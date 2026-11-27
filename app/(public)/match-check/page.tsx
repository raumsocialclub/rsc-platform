import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo/get";
import { MatchForm, type MatchCopy, type MatchSource } from "@/components/match/MatchForm";
import { PREREG_SRC } from "@/lib/settings/matchPreview";
import { getDoc } from "@/lib/cms/get";
import { getSettings } from "@/lib/settings/get";
import { MATCHCHECK_HIDDEN_SEO, MATCH_FORM_HIDDEN } from "@/lib/settings/matchHidden";
import { EVENT_PARAM, canApply, cleanEventSlug, type PostEvent } from "@/lib/posts/apply";
import { getPostBySlug } from "@/lib/posts/queries";

export async function generateMetadata(): Promise<Metadata> {
  const { matchHidden } = await getSettings();
  return pageMetadata("matchcheck", matchHidden ? MATCHCHECK_HIDDEN_SEO : {});
}

/**
 * 프로필 진단 「3분 프로필 진단」 (/match-check) — 1:1 매칭 DB 수집 퍼널 (2026-11-16).
 * 플로팅 버튼(components/site/MatchCta.tsx)에서 들어오며, 한 화면에 한 질문씩(lib/match/schema.ts) 묻고 마지막에 휴대폰·동의를 받아 POST /api/match 로 저장한다.
 * 공통 문구는 CMS(match.form). 헤더·푸터 없이 흰 화면에 로고·진행률·닫기만 둔다.
 * ?src=prereg — /matching 의 「1:1 매칭 사전등록하기」(2026-11-20 사전등록 모드)로 들어온 경우. 화면 이름·완료 문구를 사전등록용으로 바꾸고 서버에 entrySource 로 남긴다.
 * 1:1 매칭 전체 숨김(settings.site.matchHidden, 2026-11-23)에서도 이 화면은 **소셜클럽 사전등록** 창구로 그대로 열린다(플로팅 버튼 세 세트 → /match-check?src=prereg).
 * 그때는 1:1 매칭을 말하던 동의 목적·완료 안내·사전등록 이름을 MATCH_FORM_HIDDEN(소셜클럽 톤)으로 바꾸고 검색 제목도 MATCHCHECK_HIDDEN_SEO 를 쓴다.
 * ?event=<소식 주소> (M24, 2026-11-25) — 소식의 「참여하기」 버튼. 발행 중이고 참여를 받는 글이면 설문 앞에 「이미 프로필을 남기셨나요?」(휴대폰만으로 바로 신청) 화면이 먼저 나오고, 제출에 그 소식이 함께 기록된다.
 */
export default async function MatchCheckPage({ searchParams }: { searchParams: Promise<{ src?: string; [EVENT_PARAM]?: string }> }) {
  const [doc0, sp, { matchHidden }] = await Promise.all([getDoc("match.form"), searchParams, getSettings()]);
  const eventSlug = cleanEventSlug(sp[EVENT_PARAM]);
  const post = eventSlug ? await getPostBySlug(eventSlug) : null;
  const event: PostEvent | undefined = post && canApply(post) ? { slug: post.slug, title: post.title } : undefined;
  const doc = matchHidden ? { ...doc0, ...MATCH_FORM_HIDDEN } : doc0;
  const source: MatchSource | undefined = sp.src === PREREG_SRC || event ? PREREG_SRC : undefined;
  const copy: Partial<MatchCopy> = {};
  for (const [k, v] of Object.entries(doc)) if (typeof v === "string" && v) (copy as Record<string, string>)[k] = v;
  if (source) {
    const str = (k: string) => (typeof doc[k] === "string" ? (doc[k] as string) : "");
    if (str("preregTitle")) copy.title = str("preregTitle");
    if (str("preregDoneTitle")) copy.doneTitle = str("preregDoneTitle");
    if (str("preregDoneBody")) copy.doneBody = str("preregDoneBody");
  }
  return <MatchForm copy={copy} source={source} event={event} />;
}
