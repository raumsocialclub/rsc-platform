import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentMember } from "@/lib/auth/session";
import { confirmBookingPayment } from "@/lib/bookings/confirm";
import { listMyBookings } from "@/lib/bookings/queries";
import { fmtDay, fmtTime, won } from "@/lib/programs/format";

export const metadata: Metadata = { title: "예약 완료 · RSC" };

type SP = { paymentKey?: string; orderId?: string; amount?: string; done?: string };

/**
 * 토스 successUrl (FLOWS.md 2-3, 2-4). 서버에서 바로 승인(confirm)하고 결과를 그린다.
 * 새로고침해도 이미 확정된 예약은 그대로 완료 화면.
 */
export default async function CheckoutSuccessPage({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  const me = await getCurrentMember();
  if (!me) redirect(`/login?next=${encodeURIComponent(`/checkout/success?${new URLSearchParams(sp as Record<string, string>).toString()}`)}`);
  if (!sp.orderId) redirect("/my");

  let error: string | null = null;
  if (!sp.done) {
    const amount = Number(sp.amount);
    if (!sp.paymentKey || !Number.isInteger(amount)) {
      error = "결제 정보가 올바르지 않습니다.";
    } else {
      const r = await confirmBookingPayment({ paymentKey: sp.paymentKey, orderId: sp.orderId, amount, memberId: me.id });
      if (!r.ok) error = r.message;
    }
  }

  const booking = (await listMyBookings()).find((b) => b.order_id === sp.orderId) ?? null;
  const confirmed = booking && (booking.status === "confirmed" || booking.status === "attended");

  if (!confirmed) {
    return (
      <div className="max-w-[560px] mx-auto text-center py-[24px]">
        <div className="text-[11px] tracking-[.3em] text-[rgba(33,30,25,.5)] mb-[18px]">PAYMENT</div>
        <h1 className="font-medium text-[26px] md:text-[32px] leading-[1.36] mb-[14px]">결제가 완료되지 않았습니다</h1>
        <p className="text-[14.5px] leading-[1.7] text-[rgba(33,30,25,.65)] mb-[28px]">{error ?? "결제 승인 결과를 확인하지 못했습니다."}<br />카드 승인이 있었다면 자동으로 취소되며 청구되지 않습니다.</p>
        <div className="flex gap-[10px] justify-center flex-wrap">
          {booking && booking.status === "pending" && <Link href={`/checkout/${booking.id}`} className="px-[28px] py-[16px] bg-brown text-cream hover:text-cream text-[13.5px] font-semibold">다시 결제하기</Link>}
          <Link href={booking ? `/programs/${booking.program_id}` : "/programs"} className="px-[28px] py-[16px] border border-brown text-brown text-[13.5px] font-semibold">프로그램으로</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[560px] mx-auto text-center py-[16px] md:py-[40px]">
      <div className="w-[64px] h-[64px] rounded-full bg-brown text-cream flex items-center justify-center text-[26px] mx-auto mb-[28px]">✓</div>
      <div className="text-[11px] tracking-[.3em] text-[rgba(33,30,25,.5)] mb-[18px]">RESERVATION CONFIRMED</div>
      <h1 className="font-medium text-[28px] md:text-[clamp(28px,3.4vw,40px)] leading-[1.36] mb-[16px]">예약이 완료되었습니다</h1>
      <p className="mb-[36px] text-[15px] leading-[1.75] text-[rgba(33,30,25,.65)]">상세 안내와 드레스코드는 프로그램 3일 전 문자로 발송됩니다.<br />좋은 시간 함께 만들어가요.</p>
      <div className="bg-white border border-[rgba(33,30,25,.12)] p-[28px] text-left grid gap-[12px] text-[14px] mb-[28px]">
        <Row k="예약번호" v={booking.order_id} />
        <Row k="프로그램" v={booking.program.name} />
        <Row k="일시" v={`${fmtDay(booking.session.starts_at)} ${fmtTime(booking.session.starts_at)}`} />
        <Row k="인원" v="본인 1명" />
        <Row k="결제" v={`${booking.payment?.method ?? "결제"} · ${won(booking.amount)}`} />
        {booking.payment?.receipt_url && (
          <div className="flex justify-between"><span className="text-[rgba(33,30,25,.55)]">영수증</span><a href={booking.payment.receipt_url} target="_blank" rel="noreferrer" className="text-brown font-semibold">보기 ↗</a></div>
        )}
      </div>
      <div className="flex gap-[10px] justify-center flex-wrap">
        <Link href="/my" className="px-[28px] py-[16px] bg-brown text-cream hover:text-cream text-[13.5px] font-semibold">내 예약 보기</Link>
        <Link href="/programs" className="px-[28px] py-[16px] border border-brown text-brown text-[13.5px] font-semibold">다른 프로그램 보기</Link>
      </div>
    </div>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return <div className="flex justify-between gap-[12px]"><span className="text-[rgba(33,30,25,.55)]">{k}</span><b className="text-right">{v}</b></div>;
}
