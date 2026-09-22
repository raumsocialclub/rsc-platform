import type { Metadata } from "next";
import Link from "next/link";
import { Logo } from "@/components/site/Logo";
import { FitCheck } from "@/components/fit-check/FitCheck";

export const metadata: Metadata = { title: "RSC 상담 신청" };

/* deploy/fit-check.html 재현. 저장(POST /api/inquiries)은 M2에서 연결한다. */
export default function FitCheckPage() {
  return (
    <div className="min-h-screen flex flex-col bg-cream">
      <header className="flex items-center justify-between gap-[24px] px-[20px] py-[16px] md:px-[40px] md:py-[22px]">
        <Logo href="/" emblemClass="h-[39px]" textClass="h-[23px]" textSrc="/images/logo-text-fitcheck.png" />
        <Link href="/" className="text-[12.5px] tracking-[.04em] text-[rgba(33,30,25,.5)]">닫기 ✕</Link>
      </header>
      <main className="flex-1 flex flex-col justify-center px-[20px] pt-[24px] pb-[64px] md:px-[40px] md:pt-[40px] md:pb-[96px]">
        <FitCheck />
      </main>
    </div>
  );
}
