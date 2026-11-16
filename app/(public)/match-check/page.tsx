import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo/get";
import { MatchForm, type MatchCopy } from "@/components/match/MatchForm";
import { getDoc } from "@/lib/cms/get";

export async function generateMetadata(): Promise<Metadata> {
  return pageMetadata("matchcheck");
}

/**
 * 프로필 진단 「내게 맞는 인연 알아보기」 (/match-check) — 1:1 매칭 DB 수집 퍼널 (2026-11-16).
 * 플로팅 버튼(components/site/MatchCta.tsx)에서 들어오며, 한 화면에 한 질문씩(lib/match/schema.ts) 묻고 마지막에 휴대폰·동의를 받아 POST /api/match 로 저장한다.
 * 공통 문구는 CMS(match.form). 헤더·푸터 없이 흰 화면에 로고·진행률·닫기만 둔다.
 */
export default async function MatchCheckPage() {
  const doc = await getDoc("match.form");
  const copy: Partial<MatchCopy> = {};
  for (const [k, v] of Object.entries(doc)) if (typeof v === "string" && v) (copy as Record<string, string>)[k] = v;
  return <MatchForm copy={copy} />;
}
