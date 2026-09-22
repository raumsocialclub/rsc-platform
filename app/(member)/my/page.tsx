import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "내 예약 · RSC" };

/** M3 자리 화면. M6에서 다가오는/지난 예약 목록으로 교체한다. */
export default function MyPage() {
  return (
    <>
      <div className="text-[11px] tracking-[.3em] text-[rgba(33,30,25,.5)] mb-[16px]">MY RESERVATIONS</div>
      <h1 className="font-medium text-[28px] md:text-[clamp(28px,3.4vw,42px)] leading-[1.3] mb-[40px]">내 예약</h1>
      <div className="bg-cream border border-[rgba(33,30,25,.14)] px-[28px] py-[56px] text-center">
        <div className="text-[15px] font-medium mb-[8px]">아직 예약한 프로그램이 없습니다</div>
        <Link href="/programs" className="text-[13px] font-semibold text-brown">프로그램 보기</Link>
      </div>
    </>
  );
}
