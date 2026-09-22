import { NextResponse } from "next/server";
import { finalize } from "@/lib/bookings/confirm";
import type { Booking } from "@/lib/bookings/types";
import { createAdminClient } from "@/lib/supabase/admin";
import { getPayment } from "@/lib/toss/client";

/**
 * POST /api/payments/webhook — 토스 PAYMENT_STATUS_CHANGED (FLOWS.md 2-6, confirm 누락 보강)
 * 본문은 신뢰하지 않고 paymentKey 로 토스에 다시 조회한 결과만 반영한다.
 * TOSS_WEBHOOK_SECRET 이 설정되어 있으면 ?key= 가 일치해야 한다. 항상 200 을 돌려 재전송 폭주를 막는다.
 */
export async function POST(req: Request) {
  const secret = process.env.TOSS_WEBHOOK_SECRET;
  if (secret && new URL(req.url).searchParams.get("key") !== secret) return NextResponse.json({ ok: false }, { status: 401 });

  const body = (await req.json().catch(() => null)) as { eventType?: string; data?: { paymentKey?: string; orderId?: string; status?: string } } | null;
  const paymentKey = body?.data?.paymentKey;
  if (body?.eventType !== "PAYMENT_STATUS_CHANGED" || !paymentKey) return NextResponse.json({ ok: true, ignored: true });

  const res = await getPayment(paymentKey);
  if (!res.ok) return NextResponse.json({ ok: true, ignored: true, reason: res.error.code });
  const p = res.data;

  const admin = createAdminClient();
  const { data: b } = await admin.from("bookings").select("*").eq("order_id", p.orderId).maybeSingle();
  const booking = b as Booking | null;
  if (!booking) return NextResponse.json({ ok: true, ignored: true, reason: "NO_BOOKING" });

  if (p.status === "DONE" && booking.status === "pending") {
    const r = await finalize(booking, p);
    return NextResponse.json({ ok: r.ok, code: r.ok ? "CONFIRMED" : r.code });
  }
  if ((p.status === "CANCELED" || p.status === "PARTIAL_CANCELED") && booking.status === "confirmed") {
    const now = new Date().toISOString();
    await admin.from("payments").update({ status: p.status === "CANCELED" ? "cancelled" : "partial_cancelled", cancelled_at: now, raw: p }).eq("payment_key", p.paymentKey);
    await admin.from("bookings").update({ status: "cancelled", cancelled_at: now }).eq("id", booking.id);
    return NextResponse.json({ ok: true, code: "CANCELLED" });
  }
  return NextResponse.json({ ok: true, ignored: true, reason: `${p.status}/${booking.status}` });
}
