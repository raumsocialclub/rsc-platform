import type { Metadata } from "next";
import Link from "next/link";
import { describeTossError } from "@/lib/toss/errors";

export const metadata: Metadata = { title: "결제 실패" };

/** 토스 failUrl (?code=&message=&orderId=&bookingId=). 예약은 pending 으로 남아 15분 뒤 자동 만료된다. */
export default async function CheckoutFailPage({ searchParams }: { searchParams: Promise<{ code?: string; message?: string; bookingId?: string }> }) {
  const { code = "", message = "", bookingId } = await searchParams;
  const text = describeTossError(code, message || "결제가 완료되지 않았습니다.");
  return (
    <div className="max-w-[560px] mx-auto text-center py-[24px]">
      <div className="text-[11px] tracking-[.3em] text-[rgba(33,30,25,.5)] mb-[18px]">PAYMENT</div>
      <h1 className="font-medium text-[26px] md:text-[32px] leading-[1.36] mb-[14px]">결제가 완료되지 않았습니다</h1>
      <p className="text-[14.5px] leading-[1.7] text-[rgba(33,30,25,.65)] mb-[8px]">{text}</p>
      {code && <p className="text-[12px] text-[rgba(33,30,25,.45)] mb-[28px]">오류 코드: {code}</p>}
      <div className="flex gap-[10px] justify-center flex-wrap">
        {bookingId && <Link href={`/checkout/${bookingId}`} className="px-[28px] py-[16px] bg-brown text-cream hover:text-cream text-[13.5px] font-semibold">다시 결제하기</Link>}
        <Link href="/programs" className="px-[28px] py-[16px] border border-brown text-brown text-[13.5px] font-semibold">프로그램 목록</Link>
      </div>
    </div>
  );
}
