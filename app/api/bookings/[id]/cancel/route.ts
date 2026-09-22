import { NextResponse } from "next/server";
import { getCurrentMember } from "@/lib/auth/session";
import { cancelBooking } from "@/lib/bookings/cancel";
import { refundQuote } from "@/lib/bookings/refund";
import { createClient } from "@/lib/supabase/server";

/**
 * POST /api/bookings/[id]/cancel — 본인 예약 취소 (FLOWS.md 3)
 * 환불 정책(lib/bookings/refund.ts) 으로 환불액 계산 → 토스 취소 → payments/bookings 갱신.
 */
export async function POST(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const me = await getCurrentMember();
  if (!me) return NextResponse.json({ ok: false, message: "로그인이 필요합니다." }, { status: 401 });
  const { id } = await ctx.params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) return NextResponse.json({ ok: false, message: "잘못된 요청입니다." }, { status: 400 });

  const supabase = await createClient();
  const { data: b } = await supabase.from("bookings").select("id, member_id, session_id, amount, status").eq("id", id).maybeSingle();
  if (!b || b.member_id !== me.id) return NextResponse.json({ ok: false, message: "예약을 찾을 수 없습니다." }, { status: 404 });

  let refundAmount = 0;
  if (b.status === "confirmed") {
    const { data: s } = await supabase.from("sessions").select("starts_at").eq("id", b.session_id).maybeSingle();
    if (!s) return NextResponse.json({ ok: false, message: "회차 정보를 찾을 수 없습니다." }, { status: 404 });
    const quote = refundQuote(s.starts_at, b.amount);
    if (!quote.allowed) return NextResponse.json({ ok: false, message: `취소할 수 없습니다. ${quote.label}.` }, { status: 409 });
    refundAmount = quote.amount;
  } else if (b.status !== "pending") {
    return NextResponse.json({ ok: false, message: "취소할 수 없는 상태의 예약입니다." }, { status: 409 });
  }

  const r = await cancelBooking({ bookingId: id, refundAmount, reason: "회원 취소", memberId: me.id });
  if (!r.ok) return NextResponse.json({ ok: false, message: r.message }, { status: r.status });
  return NextResponse.json({ ok: true, refunded: r.refunded });
}
