import { NextResponse } from "next/server";
import { getCurrentMember } from "@/lib/auth/session";
import { refundQuote } from "@/lib/bookings/refund";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { cancelPayment, describeTossError } from "@/lib/toss/client";

/**
 * POST /api/bookings/[id]/cancel — 본인 확정 예약 취소 (FLOWS.md 3)
 * 환불 정책(lib/bookings/refund.ts) 으로 환불액 계산 → 토스 취소 → payments/bookings 갱신.
 * 결제 대기(pending) 예약은 토스 호출 없이 바로 취소한다.
 */
export async function POST(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const me = await getCurrentMember();
  if (!me) return NextResponse.json({ ok: false, message: "로그인이 필요합니다." }, { status: 401 });
  const { id } = await ctx.params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) return NextResponse.json({ ok: false, message: "잘못된 요청입니다." }, { status: 400 });

  const supabase = await createClient();
  const { data: b } = await supabase.from("bookings").select("id, member_id, session_id, amount, status").eq("id", id).maybeSingle();
  if (!b || b.member_id !== me.id) return NextResponse.json({ ok: false, message: "예약을 찾을 수 없습니다." }, { status: 404 });

  const admin = createAdminClient();
  const now = new Date().toISOString();

  if (b.status === "pending") {
    await admin.from("bookings").update({ status: "cancelled", cancelled_at: now }).eq("id", id).eq("status", "pending");
    return NextResponse.json({ ok: true, refunded: 0 });
  }
  if (b.status !== "confirmed") return NextResponse.json({ ok: false, message: "취소할 수 없는 상태의 예약입니다." }, { status: 409 });

  const { data: s } = await supabase.from("sessions").select("starts_at").eq("id", b.session_id).maybeSingle();
  if (!s) return NextResponse.json({ ok: false, message: "회차 정보를 찾을 수 없습니다." }, { status: 404 });
  const quote = refundQuote(s.starts_at, b.amount);
  if (!quote.allowed) return NextResponse.json({ ok: false, message: `취소할 수 없습니다. ${quote.label}.` }, { status: 409 });

  const { data: pay } = await admin.from("payments").select("id, payment_key, amount, status").eq("booking_id", id).eq("status", "paid").order("created_at", { ascending: false }).limit(1).maybeSingle();
  if (pay?.payment_key && pay.amount > 0) {
    const full = quote.amount >= pay.amount;
    const res = await cancelPayment(pay.payment_key, { cancelReason: "회원 취소", ...(full ? {} : { cancelAmount: quote.amount }) }, `cancel-${id}`);
    if (!res.ok && res.error.code !== "ALREADY_CANCELED_PAYMENT") {
      console.error("[bookings/cancel]", res.error);
      return NextResponse.json({ ok: false, message: describeTossError(res.error.code, "환불 처리에 실패했습니다. 잠시 후 다시 시도해 주세요.") }, { status: 502 });
    }
    await admin.from("payments").update({ status: full ? "cancelled" : "partial_cancelled", cancelled_at: now, ...(res.ok ? { raw: res.data } : {}) }).eq("id", pay.id);
  }
  await admin.from("bookings").update({ status: "cancelled", cancelled_at: now }).eq("id", id).eq("status", "confirmed");
  return NextResponse.json({ ok: true, refunded: quote.amount });
}
