import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { CheckoutClient } from "@/components/checkout/CheckoutClient";
import { getCurrentMember } from "@/lib/auth/session";
import { getMyBooking } from "@/lib/bookings/queries";
import { getRefundRules, refundPolicyText } from "@/lib/bookings/refund";
import { fmtDay, fmtTime } from "@/lib/programs/format";

export const metadata: Metadata = { title: "결제 · RSC" };

/** 결제 페이지 (FLOWS.md 2-2). pending 예약만 결제할 수 있고, 확정된 예약은 완료 화면으로 보낸다. */
export default async function CheckoutPage({ params }: { params: Promise<{ bookingId: string }> }) {
  const { bookingId } = await params;
  const [me, b] = await Promise.all([getCurrentMember(), getMyBooking(bookingId)]);
  if (!me) redirect(`/login?next=/checkout/${bookingId}`);
  if (!b) notFound();
  if (b.status === "confirmed" || b.status === "attended") redirect(`/checkout/success?orderId=${encodeURIComponent(b.order_id)}&done=1`);

  const backHref = `/programs/${b.program_id}`;
  if (b.status !== "pending") {
    return (
      <Notice title="이미 취소되었거나 만료된 예약입니다" body="프로그램 상세에서 다시 예약해 주세요." href={backHref} cta="프로그램 상세로" />
    );
  }

  const site = process.env.NEXT_PUBLIC_SITE_URL || "";
  return (
    <CheckoutClient
      bookingId={b.id}
      orderId={b.order_id}
      orderName={b.program.name}
      amount={b.amount}
      unitPrice={b.unit_price}
      programName={b.program.name}
      when={`${fmtDay(b.session.starts_at)} ${fmtTime(b.session.starts_at)}`}
      place={b.program.place || "라움"}
      expiresAt={b.expires_at}
      member={{ name: me.name, email: me.email, phone: null }}
      clientKey={process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY ?? null}
      customerKey={me.id}
      successUrl={`${site}/checkout/success`}
      failUrl={`${site}/checkout/fail?bookingId=${b.id}`}
      backHref={backHref}
      refundPolicy={refundPolicyText(await getRefundRules())}
    />
  );
}

function Notice({ title, body, href, cta }: { title: string; body: string; href: string; cta: string }) {
  return (
    <div className="max-w-[560px] mx-auto text-center py-[24px]">
      <div className="text-[11px] tracking-[.3em] text-[rgba(33,30,25,.5)] mb-[18px]">CHECKOUT</div>
      <h1 className="font-medium text-[26px] md:text-[32px] leading-[1.36] mb-[14px]">{title}</h1>
      <p className="text-[14.5px] leading-[1.7] text-[rgba(33,30,25,.65)] mb-[28px]">{body}</p>
      <Link href={href} className="inline-block px-[28px] py-[16px] bg-brown text-cream hover:text-cream text-[13.5px] font-semibold">{cta}</Link>
    </div>
  );
}
