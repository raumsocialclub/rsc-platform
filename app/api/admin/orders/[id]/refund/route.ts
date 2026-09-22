import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/admin/guard";
import { cancelBooking } from "@/lib/bookings/cancel";

/**
 * POST /api/admin/orders/[id]/refund { amount, reason? } — 관리자 환불(취소). 정책과 무관하게 금액 지정(0 = 환불 없이 취소).
 */
const Body = z.object({ amount: z.number().int().min(0).max(100_000_000), reason: z.string().trim().max(200).optional() });

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const me = await requireAdmin();
  if (!me) return NextResponse.json({ ok: false, message: "관리자만 사용할 수 있습니다." }, { status: 403 });
  const { id } = await ctx.params;
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!/^[0-9a-f-]{36}$/i.test(id) || !parsed.success) return NextResponse.json({ ok: false, message: "잘못된 요청입니다." }, { status: 400 });
  const r = await cancelBooking({ bookingId: id, refundAmount: parsed.data.amount, reason: parsed.data.reason || "관리자 환불" });
  if (!r.ok) return NextResponse.json({ ok: false, message: r.message }, { status: r.status });
  return NextResponse.json({ ok: true, refunded: r.refunded });
}
