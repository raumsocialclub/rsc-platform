// 서버 전용. 예약 취소 + 토스 환불 (회원 /my 취소, 어드민 환불 공용). FLOWS.md 3
import { createAdminClient } from "@/lib/supabase/admin";
import { cancelPayment, describeTossError, type TossPayment } from "@/lib/toss/client";
import type { Booking } from "./types";

export type CancelResult = { ok: true; refunded: number; bookingStatus: "cancelled" } | { ok: false; status: number; message: string };

type PaymentRow = { id: string; payment_key: string | null; amount: number; status: string; raw: Partial<TossPayment> | null };

/** 결제의 남은 금액 (부분 취소 후에는 토스 balanceAmount) */
export function paymentBalance(p: { amount: number; status: string; raw: { balanceAmount?: number } | null }): number {
  if (p.status === "cancelled" || p.status === "failed") return 0;
  const bal = p.raw?.balanceAmount;
  return typeof bal === "number" ? bal : p.amount;
}

/**
 * refundAmount 만큼 토스에서 취소하고 payments/bookings 를 갱신한다.
 * - pending 예약: 토스 호출 없이 취소
 * - refundAmount 0: 환불 없이 취소만
 * - refundAmount ≥ 남은 금액: 전액 취소(cancelled), 아니면 부분 취소(partial_cancelled)
 */
export async function cancelBooking(params: { bookingId: string; refundAmount: number; reason: string; memberId?: string }): Promise<CancelResult> {
  const admin = createAdminClient();
  const { data: b } = await admin.from("bookings").select("*").eq("id", params.bookingId).maybeSingle();
  const booking = b as Booking | null;
  if (!booking) return { ok: false, status: 404, message: "예약을 찾을 수 없습니다." };
  if (params.memberId && booking.member_id !== params.memberId) return { ok: false, status: 404, message: "예약을 찾을 수 없습니다." };
  const now = new Date().toISOString();

  if (booking.status === "pending") {
    await admin.from("bookings").update({ status: "cancelled", cancelled_at: now }).eq("id", booking.id).eq("status", "pending");
    return { ok: true, refunded: 0, bookingStatus: "cancelled" };
  }
  if (booking.status !== "confirmed" && booking.status !== "attended") return { ok: false, status: 409, message: "취소할 수 없는 상태의 예약입니다." };

  const { data: payRow } = await admin
    .from("payments")
    .select("id, payment_key, amount, status, raw")
    .eq("booking_id", booking.id)
    .in("status", ["paid", "partial_cancelled"])
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  const pay = payRow as PaymentRow | null;

  let refunded = 0;
  if (pay?.payment_key && params.refundAmount > 0) {
    const balance = paymentBalance(pay);
    const amount = Math.min(params.refundAmount, balance);
    if (amount > 0) {
      const full = amount >= balance;
      const res = await cancelPayment(pay.payment_key, { cancelReason: params.reason, ...(full ? {} : { cancelAmount: amount }) }, `cancel-${booking.id}-${amount}`);
      if (!res.ok && res.error.code !== "ALREADY_CANCELED_PAYMENT") {
        console.error("[bookings/cancel]", res.error);
        return { ok: false, status: 502, message: describeTossError(res.error.code, "환불 처리에 실패했습니다. 잠시 후 다시 시도해 주세요.") };
      }
      refunded = amount;
      await admin
        .from("payments")
        .update({ status: full ? "cancelled" : "partial_cancelled", cancelled_at: now, ...(res.ok ? { raw: res.data } : {}) })
        .eq("id", pay.id);
    }
  }
  await admin.from("bookings").update({ status: "cancelled", cancelled_at: now }).eq("id", booking.id);
  return { ok: true, refunded, bookingStatus: "cancelled" };
}
