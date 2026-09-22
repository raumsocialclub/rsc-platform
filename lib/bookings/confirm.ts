// 서버 전용 (Route Handler / 서버 컴포넌트). service role 로 payments/bookings 를 갱신한다. (FLOWS.md 2-4, 2-6)
import { createAdminClient } from "@/lib/supabase/admin";
import { sendBookingConfirmed } from "@/lib/notify";
import { fmtFull } from "@/lib/programs/format";
import { confirmPayment, describeTossError, getPayment, methodLabel, type TossPayment } from "@/lib/toss/client";
import type { Booking } from "./types";

export type ConfirmResult =
  | { ok: true; bookingId: string; orderId: string; alreadyConfirmed: boolean }
  | { ok: false; code: string; message: string; bookingId?: string };

/**
 * successUrl 파라미터(paymentKey, orderId, amount)로 결제를 승인하고 예약을 확정한다.
 * - 금액은 DB 의 booking.amount 와 같아야 한다(클라이언트 값 불신).
 * - 이미 확정된 예약이면 토스를 다시 호출하지 않고 ok(alreadyConfirmed) 로 돌려준다(새로고침·웹훅 중복 안전).
 */
export async function confirmBookingPayment(params: { paymentKey: string; orderId: string; amount: number; memberId?: string }): Promise<ConfirmResult> {
  const admin = createAdminClient();
  const { data: b } = await admin.from("bookings").select("*").eq("order_id", params.orderId).maybeSingle();
  const booking = b as Booking | null;
  if (!booking) return { ok: false, code: "NOT_FOUND", message: "예약을 찾을 수 없습니다." };
  if (params.memberId && booking.member_id !== params.memberId) return { ok: false, code: "FORBIDDEN", message: "본인 예약만 결제할 수 있습니다.", bookingId: booking.id };
  if (booking.status === "confirmed" || booking.status === "attended") return { ok: true, bookingId: booking.id, orderId: booking.order_id, alreadyConfirmed: true };
  if (booking.status !== "pending") return { ok: false, code: "BOOKING_" + booking.status.toUpperCase(), message: "이미 취소되었거나 만료된 예약입니다. 다시 예약해 주세요.", bookingId: booking.id };
  if (new Date(booking.expires_at).getTime() < Date.now()) return { ok: false, code: "BOOKING_EXPIRED", message: "결제 시간(15분)이 지나 예약이 만료되었습니다. 다시 예약해 주세요.", bookingId: booking.id };
  if (params.amount !== booking.amount) return { ok: false, code: "AMOUNT_MISMATCH", message: "결제 금액이 예약 금액과 다릅니다. 결제가 승인되지 않았습니다.", bookingId: booking.id };

  const res = await confirmPayment({ paymentKey: params.paymentKey, orderId: params.orderId, amount: params.amount });
  if (!res.ok) {
    // 이미 승인된 결제(중복 confirm)면 조회해서 이어서 처리
    if (res.error.code === "ALREADY_PROCESSED_PAYMENT") {
      const again = await getPayment(params.paymentKey);
      if (again.ok && again.data.status === "DONE") return finalize(booking, again.data);
    }
    console.error("[payments/confirm]", res.error);
    return { ok: false, code: res.error.code, message: describeTossError(res.error.code, res.error.message), bookingId: booking.id };
  }
  return finalize(booking, res.data);
}

/** 토스에서 DONE 인 결제를 payments/bookings 에 반영 (confirm 응답·웹훅 공용) */
export async function finalize(booking: Booking, p: TossPayment): Promise<ConfirmResult> {
  const admin = createAdminClient();
  if (p.totalAmount !== booking.amount) return { ok: false, code: "AMOUNT_MISMATCH", message: "결제 금액이 예약 금액과 다릅니다.", bookingId: booking.id };

  const { error: pe } = await admin.from("payments").upsert(
    {
      booking_id: booking.id,
      member_id: booking.member_id,
      provider: "toss",
      payment_key: p.paymentKey,
      order_id: p.orderId,
      method: methodLabel(p),
      amount: p.totalAmount,
      status: "paid",
      receipt_url: p.receipt?.url ?? null,
      raw: p,
      approved_at: p.approvedAt ?? new Date().toISOString(),
    },
    { onConflict: "payment_key" },
  );
  if (pe) {
    console.error("[payments/finalize] payments upsert", pe);
    return { ok: false, code: "DB", message: "결제는 승인되었지만 기록 저장에 실패했습니다. 고객센터로 문의해 주세요.", bookingId: booking.id };
  }
  const { error: be } = await admin.from("bookings").update({ status: "confirmed" }).eq("id", booking.id).eq("status", "pending");
  if (be) console.error("[payments/finalize] bookings update", be);

  // 예약 확정 이메일 (RESEND_API_KEY 없으면 조용히 건너뜀)
  try {
    const [{ data: m }, { data: prog }, { data: sess }] = await Promise.all([
      admin.from("members").select("email, name").eq("id", booking.member_id).maybeSingle(),
      admin.from("programs").select("name, place").eq("id", booking.program_id).maybeSingle(),
      admin.from("sessions").select("starts_at").eq("id", booking.session_id).maybeSingle(),
    ]);
    if (m?.email && prog && sess) {
      await sendBookingConfirmed({ to: m.email, name: m.name, programName: prog.name, when: fmtFull(sess.starts_at), place: prog.place, amount: booking.amount });
    }
  } catch (e) {
    console.error("[payments/finalize] notify", e);
  }
  return { ok: true, bookingId: booking.id, orderId: booking.order_id, alreadyConfirmed: false };
}
