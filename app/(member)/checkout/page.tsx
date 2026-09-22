import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "결제 · RSC" };

/** M5 자리 화면. M6에서 예약 생성(reserve_seat) + 토스 결제위젯으로 교체한다. */
export default async function CheckoutPlaceholder({ searchParams }: { searchParams: Promise<{ session?: string }> }) {
  const { session } = await searchParams;
  return (
    <div className="max-w-[560px] mx-auto">
      <div className="text-[11px] tracking-[.3em] text-[rgba(33,30,25,.5)] mb-[16px]">CHECKOUT</div>
      <h1 className="font-medium text-[28px] leading-[1.3] mb-[24px]">결제 준비 중</h1>
      <div className="bg-cream border border-[rgba(33,30,25,.14)] px-[28px] py-[40px] text-center">
        <div className="text-[15px] font-medium mb-[8px]">결제 기능은 다음 단계(M6)에서 열립니다.</div>
        <div className="text-[13.5px] leading-[1.7] text-[rgba(33,30,25,.6)] mb-[20px]">예약 생성과 토스페이먼츠 결제창이 이 화면에 연결됩니다.{session ? ` (회차 ${session.slice(0, 8)}…)` : ""}</div>
        <Link href="/programs" className="text-[13px] font-semibold text-brown">← 프로그램 목록으로</Link>
      </div>
    </div>
  );
}
