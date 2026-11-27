import { NextResponse } from "next/server";
import type { Settings } from "./get";
import { dropMatchingSegments, mentionsMatching } from "./matchPreview";

/**
 * 1:1 매칭 전체 숨김 (settings.site.matchHidden, 기본 켬 — 2026-11-23 카카오 비즈니스 채널 심사 「만남주선」 반려 대응).
 * 사전등록 모드(matchPreview)보다 강한 스위치: 사이트 어디에서도 1:1 매칭을 안내하지 않는다.
 * - 숨김 페이지: /matching(사전등록 화면 포함) → 직접 들어오면 메인(/)으로 (lib/supabase/proxy.ts + 페이지)
 * - 화면: GNB·푸터의 「1:1 매칭」 메뉴, 홈 대문의 1:1 매칭 탭·비교 카드 섹션·하단 띠의 1:1 매칭 버튼, 소셜클럽 전환 바를 숨기고
 *   홈·소셜클럽·제휴·상담 신청 본문의 1:1 매칭 문장은 사전등록 모드와 같은 규칙(scrubDoc·stripMatching)으로 뺀다
 * - 프로필 진단(/match-check)과 플로팅 버튼은 **소셜클럽 사전등록** 창구로 그대로 연다 (2026-11-23 사용자 결정: 세 문구 세트 모두 /match-check?src=prereg).
 *   화면 문구 중 1:1 매칭을 말하는 동의 목적·완료 안내·사전등록 이름은 MATCH_FORM_HIDDEN 으로 소셜클럽 톤으로 바꾸고, 검색 제목·설명은 MATCHCHECK_HIDDEN_SEO 를 쓴다
 * - SEO: /matching 은 사이트맵에서 빼고 robots 에서 제외, llms.txt 는 1:1 매칭 줄을 모두 뺀다(사전등록 안내 줄도 없음)
 * - 끄면(/admin/settings → 사이트 상태) 사전등록 모드(matchPreview) 설정값대로 돌아간다. 코드·CMS 문서·접수된 응답은 그대로.
 * 어드민의 1:1 매칭 CMS 탭·사전등록 응답 목록은 영향을 받지 않는다.
 */
export const MATCH_HIDDEN_PATHS = [/^\/matching(\/|$)/];
export const MATCH_HIDDEN_PREFIXES = ["/matching"];

export const isMatchHiddenPath = (pathname: string) => MATCH_HIDDEN_PATHS.some((re) => re.test(pathname));

/** 숨김 페이지로 가는 링크인지 (해시·쿼리 포함) */
export const isMatchHiddenHref = (href: string) => MATCH_HIDDEN_PREFIXES.some((p) => href === p || href.startsWith(p + "/") || href.startsWith(p + "?") || href.startsWith(p + "#"));

/**
 * 전체 숨김일 때 프로필 진단(/match-check, CMS match.form) 문구 덮어쓰기 — 1:1 매칭을 말하던 동의 목적·완료 안내·사전등록 이름을 소셜클럽 사전등록 톤으로.
 * 수집 항목·보관 기간은 그대로(개인정보처리방침 제2조 5-2~5-4호와 같은 범위). 모드를 끄면 CMS 값이 다시 쓰인다.
 */
export const MATCH_FORM_HIDDEN: Record<string, string> = {
  consentPurpose: "소셜클럽 가입 상담의 준비(담당 매니저가 기본 정보와 희망 조건을 미리 확인)와 일정 조율, 문의 응대",
  sensitivePurpose: "소셜클럽 상담에서 희망 조건과의 적합성 확인",
  marketingPurpose: "소셜클럽 신규 모임·행사 안내, 이벤트·프로모션 안내, 재상담 안내",
  doneBody: "담당 매니저가 남겨주신 번호로 연락드려 소셜클럽 멤버십과 이번 달 행사를 안내해 드립니다. 문의나 취소는 전화(02-6925-4786)로 알려 주세요.",
  preregTitle: "소셜클럽 사전등록",
  preregDoneTitle: "사전등록이 접수되었습니다",
  preregDoneBody: "소셜클럽 멤버십과 이번 달 행사 소식을 담당 매니저가 남겨주신 번호로 안내드립니다. 문의나 취소는 전화(02-6925-4786)나 이메일로 알려 주세요.",
};

/** 전체 숨김일 때 /match-check 의 검색 제목·설명 (기본값 「나에게 맞는 1:1 소개」 대신) */
export const MATCHCHECK_HIDDEN_SEO = { title: "3분 프로필 진단 · 소셜클럽 사전등록", description: "프로필을 남기면 담당 매니저가 라움소셜클럽 멤버십과 이번 달 행사를 안내해 드립니다. 가입이 아닌 사전등록이며 비용은 없습니다." };

/** 숨김 모드에서 닫히는 API 의 공통 응답 (404 JSON) */
export function matchHiddenClosed() {
  return NextResponse.json({ ok: false, message: "현재 이용할 수 없는 기능입니다." }, { status: 404 });
}

/**
 * 두 스위치를 합친 화면 상태.
 * - hidden: 전체 숨김(1:1 매칭을 어디에도 안내하지 않음)
 * - preview: 사전등록 모드(전체 숨김이 꺼져 있고 matchPreview 가 켜진 때만)
 * - scrub: 본문에서 1:1 매칭 문장을 빼야 하는지 (둘 중 하나라도 켜져 있으면)
 */
export function matchVisibility(s: Pick<Settings, "matchHidden" | "matchPreview">) {
  const hidden = !!s.matchHidden;
  return { hidden, preview: !hidden && !!s.matchPreview, scrub: hidden || !!s.matchPreview };
}

/**
 * llms.txt 본문(seo.ai.llmsText)에서 1:1 매칭 언급을 모두 뺀다 — 사전등록 안내 줄도 넣지 않는다.
 * "- 항목: a · b · c" 줄은 매칭 조각만 빼고, 소개 문단의 「…과 1:1 매칭(/matching: …)」 짝은 지운다.
 */
export function llmsHidden(text: string): string {
  const out: string[] = [];
  for (const raw of text.split("\n")) {
    let line = raw;
    if (/^\s*-\s/.test(line)) line = dropMatchingSegments(line);
    else if (mentionsMatching(line)) {
      line = line
        .replace(/\s*(과|와|및)\s*1\s*:\s*1\s*매칭\([^)]*\)/g, "")
        .replace(/두 가지 방식으로 만납니다\s*[—–-]\s*/, "")
        .replace(/\s*(과|와|및)\s*1\s*:\s*1\s*매칭/g, "");
      if (mentionsMatching(line)) line = "";
    }
    if (line || !raw) out.push(line);
  }
  return out.join("\n").replace(/\n{3,}/g, "\n\n");
}
