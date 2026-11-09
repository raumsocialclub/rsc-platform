import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo/get";
import Link from "next/link";
import { Logo } from "@/components/site/Logo";
import { FitCheck } from "@/components/fit-check/FitCheck";
import { LeadForm, type LeadCopy, type LeadTrack } from "@/components/fit-check/LeadForm";
import { getDoc } from "@/lib/cms/get";
import { getSettings } from "@/lib/settings/get";

export async function generateMetadata(): Promise<Metadata> {
  return pageMetadata("fitcheck");
}

/**
 * 상담 신청. 기본은 한 화면 간단 신청(LeadForm: 관심 방식·이름·휴대폰·동의). ?track=social|matching 으로 들어오면 그 방식이 미리 선택된다. 일반 설정 → "설문형 상담 신청 켜기" 면 6문항 설문(FitCheck).
 * 흰 배경에 얇은 상단 바(로고 + 닫기)만 두고 양식을 가운데 카드로 보여준다. 문구는 모두 CMS(apply.form).
 */
export default async function FitCheckPage({ searchParams }: { searchParams: Promise<{ track?: string }> }) {
  const [{ surveyMode }, sp, doc] = await Promise.all([getSettings(), searchParams, getDoc("apply.form")]);
  const track: LeadTrack = sp.track === "social" || sp.track === "matching" ? sp.track : "undecided";
  const copy: Partial<LeadCopy> = {};
  for (const [k, v] of Object.entries(doc)) if (typeof v === "string" && v) (copy as Record<string, string>)[k] = v;
  const title = (track === "social" ? copy.titleSocial : track === "matching" ? copy.titleMatching : copy.titleDefault) || "RSC 상담 신청";
  return (
    <div className="min-h-screen flex flex-col bg-sand">
      <header className="h-[56px] md:h-[64px] bg-white border-b border-lineAlt flex items-center justify-between gap-[24px] px-[20px] md:px-[32px]">
        <Logo href="/" emblemClass="h-[26px] md:h-[32px]" textClass="h-[14px] md:h-[16px]" textSrc="/images/logo-text-fitcheck.png" className="gap-[10px]" />
        <Link href="/" className="t-label-1 text-labelAlt hover:text-label">{copy.closeLabel || "닫기 ✕"}</Link>
      </header>
      <main className="flex-1 flex flex-col justify-center px-[16px] py-[32px] md:px-[32px] md:py-[64px]">
        <div className="w-full max-w-[640px] mx-auto bg-white border border-lineAlt rounded-ds p-[24px] md:p-[48px]">
          {surveyMode ? <FitCheck /> : <LeadForm title={title} note={copy.note || "남겨주신 연락처로 담당자가 직접 연락드립니다."} track={track} copy={copy} />}
        </div>
      </main>
    </div>
  );
}
