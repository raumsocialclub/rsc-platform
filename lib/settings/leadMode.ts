import { NextResponse } from "next/server";

/**
 * 리드 모드 (settings.site.leadMode). 사이트를 "광고 → 상담 신청" 전용으로 쓸 때 켠다.
 * - 숨김 페이지: 직접 들어오면 메인(/)으로 보낸다 (proxy.ts)
 * - 닫는 API: 예약·결제·초대코드·네이버 로그인 → 404 (각 Route Handler 가 assertNotLeadMode 로 확인)
 * - 화면: GNB 의 프로그램 예약·내 예약·로그인, 메인 멤버십 섹션, 푸터 멤버십·환불규정 링크, 가격 문구를 숨긴다
 * - SEO: 숨김 페이지는 사이트맵에서 빼고 robots 에서 제외한다
 * 관리자 화면(/admin, /login)과 서비스 소개·혜택·소식·상담 신청은 그대로 열린다.
 */
export const LEAD_HIDDEN_PATHS = [/^\/pricing(\/|$)/, /^\/join(\/|$)/, /^\/programs(\/|$)/, /^\/my(\/|$)/, /^\/checkout(\/|$)/, /^\/refund(\/|$)/, /^\/auth\/naver(\/|$)/];
export const LEAD_HIDDEN_PREFIXES = ["/pricing", "/join", "/programs", "/my", "/checkout", "/refund"];

export const isLeadHiddenPath = (pathname: string) => LEAD_HIDDEN_PATHS.some((re) => re.test(pathname));

/** 리드 모드에서 닫히는 API 의 공통 응답 (404 JSON) */
export function leadModeClosed() {
  return NextResponse.json({ ok: false, message: "현재 이용할 수 없는 기능입니다." }, { status: 404 });
}

/** 금액이 들어 있는 문구인지 (예: 160,000원, 5만원/h). 리드 모드에서 가격 문구를 숨길 때 쓴다. */
export const hasPrice = (text: string) => /\d[\d,]*\s*(원|만원)/.test(text ?? "");

/** 리드 모드에서 링크를 감춰야 하는 주소인지 (숨김 페이지로 가는 링크) */
export const isLeadHiddenHref = (href: string) => LEAD_HIDDEN_PREFIXES.some((p) => href === p || href.startsWith(p + "/") || href.startsWith(p + "?") || href.startsWith(p + "#"));
