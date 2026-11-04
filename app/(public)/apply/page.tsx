import type { Metadata } from "next";
import Link from "next/link";
import { ClosedNotice } from "@/components/apply/ClosedNotice";
import { Logo } from "@/components/site/Logo";
import { LINK_MESSAGE } from "@/lib/apply/links";

export const metadata: Metadata = { title: "RSC 상담 전 설문", robots: { index: false, follow: false } };

/** /apply (토큰 없음) — 설문은 /apply/<토큰> 비밀 링크로만 열린다. 주소만 치고 들어오면 안내만 보여준다 */
export default function ApplyIndexPage() {
  return (
    <div className="min-h-screen flex flex-col bg-cream">
      <header className="flex items-center justify-between gap-[24px] px-[20px] py-[16px] md:px-[40px] md:py-[22px]">
        <Logo href="/" emblemClass="h-[39px]" textClass="h-[23px]" textSrc="/images/logo-text-fitcheck.png" />
        <Link href="/" className="text-[12.5px] tracking-[.04em] text-[rgba(33,30,25,.5)]">닫기 ✕</Link>
      </header>
      <main className="flex-1 flex flex-col px-[20px] pt-[16px] pb-[64px] md:px-[40px] md:pt-[28px] md:pb-[96px]">
        <ClosedNotice message={LINK_MESSAGE.invalid} />
      </main>
    </div>
  );
}
