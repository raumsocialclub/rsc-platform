import localFont from "next/font/local";

/**
 * Pretendard Variable (SIL OFL 1.1) — Wanted Design System 의 기본 글꼴. 한국어·영어·일본어 지원, weight 100~900.
 * Design.md 타이포그래피 체계(Display·Title·Heading·Headline·Body·Label·Caption)는 이 글꼴 기준.
 */
export const pretendard = localFont({
  src: [{ path: "../app/fonts/PretendardVariable.woff2", weight: "45 920", style: "normal" }],
  variable: "--font-pretendard",
  display: "swap",
  fallback: ["Pretendard", "-apple-system", "BlinkMacSystemFont", "system-ui", "Roboto", "Helvetica Neue", "Segoe UI", "Apple SD Gothic Neo", "Noto Sans KR", "Malgun Gothic", "sans-serif"],
});

/** 이전 이름 호환 (SamsungOne → Pretendard 로 교체, 2026-11-04) */
export const samsungOne = pretendard;
