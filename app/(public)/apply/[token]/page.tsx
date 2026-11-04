import type { Metadata } from "next";
import Link from "next/link";
import { ApplyForm } from "@/components/apply/ApplyForm";
import { ClosedNotice } from "@/components/apply/ClosedNotice";
import { Logo } from "@/components/site/Logo";
import { LINK_MESSAGE, findLink, linkStatus } from "@/lib/apply/links";
import { createAdminClient, hasServiceRoleKey } from "@/lib/supabase/admin";

export const metadata: Metadata = { title: "RSC 상담 전 설문", description: "대면 상담 전에 기본 정보와 선호를 미리 알려 주시면 담당자가 더 잘 준비해서 뵙겠습니다.", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

/**
 * /apply/<토큰> — 관리자가 만든 공용 비밀 링크로만 열리는 상담 전 설문. 전화 상담 후 니즈가 확실한 분들에게 대면 상담 전 받는다.
 * 로그인 없이 누구나 바로 작성할 수 있고 링크는 자유롭게 전달해도 된다. 사이트 어디에도 링크가 없고(robots 도 제외), 토큰이 유효(기간 내·취소 안 됨)할 때만 설문이 보인다.
 * 발급·전달·응답 확인: 어드민 → 상담 전 설문(/admin/apply)
 */
export default async function ApplyTokenPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const link = hasServiceRoleKey() ? await findLink(createAdminClient(), token) : null;
  const status = link ? linkStatus(link) : "invalid";
  return (
    <div className="min-h-screen flex flex-col bg-sand">
      <header className="h-[56px] md:h-[64px] bg-white border-b border-lineAlt flex items-center justify-between gap-[24px] px-[20px] md:px-[32px]">
        <Logo href="/" emblemClass="h-[26px] md:h-[32px]" textClass="h-[14px] md:h-[16px]" textSrc="/images/logo-text-fitcheck.png" className="gap-[10px]" />
        <Link href="/" className="t-label-1 text-labelAlt hover:text-label">닫기 ✕</Link>
      </header>
      <main className="flex-1 flex flex-col px-[16px] pt-[20px] pb-[64px] md:px-[32px] md:pt-[40px] md:pb-[96px]">
        {link && status === "active" ? (
          <ApplyForm token={token} />
        ) : (
          <ClosedNotice message={LINK_MESSAGE[status === "active" ? "invalid" : status]} />
        )}
      </main>
    </div>
  );
}

