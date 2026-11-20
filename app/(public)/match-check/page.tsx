import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo/get";
import { MatchForm, type MatchCopy, type MatchSource } from "@/components/match/MatchForm";
import { PREREG_SRC } from "@/lib/settings/matchPreview";
import { getDoc } from "@/lib/cms/get";

export async function generateMetadata(): Promise<Metadata> {
  return pageMetadata("matchcheck");
}

/**
 * 프로필 진단 「3분 프로필 진단」 (/match-check) — 1:1 매칭 DB 수집 퍼널 (2026-11-16).
 * 플로팅 버튼(components/site/MatchCta.tsx)에서 들어오며, 한 화면에 한 질문씩(lib/match/schema.ts) 묻고 마지막에 휴대폰·동의를 받아 POST /api/match 로 저장한다.
 * 공통 문구는 CMS(match.form). 헤더·푸터 없이 흰 화면에 로고·진행률·닫기만 둔다.
 * ?src=prereg — /matching 의 「1:1 매칭 사전등록하기」(2026-11-20 사전등록 모드)로 들어온 경우. 화면 이름·완료 문구를 사전등록용으로 바꾸고 서버에 entrySource 로 남긴다.
 */
export default async function MatchCheckPage({ searchParams }: { searchParams: Promise<{ src?: string }> }) {
  const [doc, sp] = await Promise.all([getDoc("match.form"), searchParams]);
  const source: MatchSource | undefined = sp.src === PREREG_SRC ? PREREG_SRC : undefined;
  const copy: Partial<MatchCopy> = {};
  for (const [k, v] of Object.entries(doc)) if (typeof v === "string" && v) (copy as Record<string, string>)[k] = v;
  if (source) {
    const str = (k: string) => (typeof doc[k] === "string" ? (doc[k] as string) : "");
    if (str("preregTitle")) copy.title = str("preregTitle");
    if (str("preregDoneTitle")) copy.doneTitle = str("preregDoneTitle");
    if (str("preregDoneBody")) copy.doneBody = str("preregDoneBody");
  }
  return <MatchForm copy={copy} source={source} />;
}
