import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo/get";
import Link from "next/link";
import { Logo } from "@/components/site/Logo";
import { FitCheck } from "@/components/fit-check/FitCheck";
import { LeadForm } from "@/components/fit-check/LeadForm";
import { getSettings } from "@/lib/settings/get";

export async function generateMetadata(): Promise<Metadata> {
  return pageMetadata("fitcheck");
}

/**
 * 상담 신청. 기본은 한 화면 간단 신청(LeadForm: 이름·휴대폰·가능 시간·동의).
 * 일반 설정 → 상담 신청 → "설문형 상담 신청 켜기" 면 예전 6문항 설문(FitCheck, 성향 결과 유형 저장)으로 돌아간다.
 */
export default async function FitCheckPage() {
  const { surveyMode } = await getSettings();
  return (
    <div className="min-h-screen flex flex-col bg-cream">
      <header className="flex items-center justify-between gap-[24px] px-[20px] py-[16px] md:px-[40px] md:py-[22px]">
        <Logo href="/" emblemClass="h-[39px]" textClass="h-[23px]" textSrc="/images/logo-text-fitcheck.png" />
        <Link href="/" className="text-[12.5px] tracking-[.04em] text-[rgba(33,30,25,.5)]">닫기 ✕</Link>
      </header>
      <main className="flex-1 flex flex-col justify-center px-[20px] pt-[24px] pb-[64px] md:px-[40px] md:pt-[40px] md:pb-[96px]">
        {surveyMode ? <FitCheck /> : <LeadForm title="RSC 상담 신청" note="남겨주신 연락처로 담당자가 직접 연락드립니다." />}
      </main>
    </div>
  );
}
