import type { Metadata } from "next";
import Link from "next/link";
import { ClosedNotice } from "@/components/apply/ClosedNotice";
import { Logo } from "@/components/site/Logo";
import { LINK_MESSAGE } from "@/lib/apply/links";

export const metadata: Metadata = { title: "RSC 상담 전 설문", robots: { index: false, follow: false } };

/** /apply (토큰 없음) — 설문은 /apply/<토큰> 비밀 링크로만 열린다. 주소만 치고 들어오면 안내만 보여준다 */
export default function ApplyIndexPage() {
  return (
    <div className="min-h-screen flex flex-col bg-sand">
      <header className="h-[56px] md:h-[64px] bg-white border-b border-lineAlt flex items-center justify-between gap-[24px] px-[20px] md:px-[32px]">
        <Logo href="/" emblemClass="h-[26px] md:h-[32px]" textClass="h-[14px] md:h-[16px]" textSrc="/images/logo-text-fitcheck.png" className="gap-[10px]" />
        <Link href="/" className="t-label-1 text-labelAlt hover:text-label">닫기 ✕</Link>
      </header>
      <main className="flex-1 flex flex-col px-[16px] pt-[20px] pb-[64px] md:px-[32px] md:pt-[40px] md:pb-[96px]">
        <ClosedNotice message={LINK_MESSAGE.invalid} />
      </main>
    </div>
  );
}
