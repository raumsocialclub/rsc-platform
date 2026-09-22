import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentMember } from "@/lib/auth/session";
import { confirmBookingPayment } from "@/lib/bookings/confirm";

/** POST /api/payments/confirm { paymentKey, orderId, amount } — /checkout/success 가 같은 로직을 서버에서 직접 호출한다. */
const Body = z.object({ paymentKey: z.string().min(1).max(200), orderId: z.string().min(1).max(64), amount: z.number().int().nonnegative() });

export async function POST(req: Request) {
  const me = await getCurrentMember();
  if (!me) return NextResponse.json({ ok: false, message: "로그인이 필요합니다." }, { status: 401 });
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ ok: false, message: "잘못된 요청입니다." }, { status: 400 });
  const r = await confirmBookingPayment({ ...parsed.data, memberId: me.id });
  return NextResponse.json(r, { status: r.ok ? 200 : 400 });
}
