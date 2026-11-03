import type { Metadata } from "next";
import Link from "next/link";
import { ApplyForm } from "@/components/apply/ApplyForm";
import { Logo } from "@/components/site/Logo";
import { getCurrentMember, isAdminRole } from "@/lib/auth/session";
import { getSettings } from "@/lib/settings/get";

export const metadata: Metadata = { title: "RSC 상담 전 설문", description: "상담 전에 기본 정보와 선호를 미리 알려 주시면 담당자가 더 잘 준비해서 연락드립니다.", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

/**
 * /apply — 상담 전 고객 정보 설문 (광고 랜딩 · 직접 전달 URL). 일반 설정 → 상담 신청 · 광고 측정 → 「상담 전 설문(/apply) 열기」로 언제든 켜고 끈다.
 * 닫혀 있으면 안내 문구만 보이고(API 도 거부), 관리자가 로그인한 상태면 미리보기로 설문이 보인다.
 * 주소: /apply?utm_source=…(광고) · /apply?ref=코드(추천인·직접 전달)
 */
export default async function ApplyPage() {
  const [{ applyEnabled, applyClosedMessage }, me] = await Promise.all([getSettings(), getCurrentMember()]);
  const preview = !applyEnabled && isAdminRole(me);
  return (
    <div className="min-h-screen flex flex-col bg-cream">
      <header className="flex items-center justify-between gap-[24px] px-[20px] py-[16px] md:px-[40px] md:py-[22px]">
        <Logo href="/" emblemClass="h-[39px]" textClass="h-[23px]" textSrc="/images/logo-text-fitcheck.png" />
        <Link href="/" className="text-[12.5px] tracking-[.04em] text-[rgba(33,30,25,.5)]">닫기 ✕</Link>
      </header>
      <main className="flex-1 flex flex-col px-[20px] pt-[16px] pb-[64px] md:px-[40px] md:pt-[28px] md:pb-[96px]">
        {applyEnabled || preview ? (
          <ApplyForm preview={preview} />
        ) : (
          <div className="w-full max-w-[640px] mx-auto py-[60px]">
            <div className="text-[11px] tracking-[.34em] text-[rgba(33,30,25,.5)] mb-[24px]">RSC PRE-CONSULTATION</div>
            <p className="whitespace-pre-line text-[17px] leading-[1.9] text-[rgba(33,30,25,.75)] mb-[36px]">{applyClosedMessage}</p>
            <Link href="/fit-check" className="inline-flex items-center px-[34px] py-[16px] bg-brown text-cream text-[13.5px] hover:text-cream">상담 신청하러 가기</Link>
          </div>
        )}
      </main>
    </div>
  );
}
