import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { renderToStaticMarkup } from "react-dom/server";
import { createElement } from "react";
import { DOC_BY_ID } from "@/lib/cms/schema";
import { KakaoButton } from "@/components/site/KakaoButton";

const footer = readFileSync("components/site/SiteFooter.tsx", "utf8");

/** 푸터 「제휴문의 →」 아래 카카오톡 상담 버튼 (2026-11-26 사용자 요청) */
describe("카카오톡 상담 버튼", () => {
  it("CMS global.brand 에 링크·문구 항목이 있고 기본 링크는 카카오 채널 주소", () => {
    const brand = DOC_BY_ID.get("global.brand")!;
    expect(brand.fields.map((f) => f.key)).toEqual(expect.arrayContaining(["kakaoUrl", "kakaoLabel"]));
    expect(brand.defaults.kakaoUrl).toBe("https://pf.kakao.com/_xezfXj");
    expect(brand.defaults.kakaoLabel).toBe("카카오톡 상담");
  });
  it("푸터 3열 「문의하기」: 설명 줄 + 카카오 버튼, 설명 줄 + 제휴문의 테두리 버튼 — 제휴문의와 헷갈리지 않게 분리", () => {
    const col = footer.slice(footer.indexOf('data-testid="footer-partner"'));
    expect(col).toContain('L("footerInquiryTitle", "문의하기")');
    expect(col).toContain('L("footerKakaoNote", "멤버십 · 프로그램 문의")');
    expect(col).toContain("<KakaoButton href={b.kakaoUrl}");
    expect(col).toContain('label={b.kakaoLabel || "카카오톡 상담"}');
    expect(col).toContain('L("footerPartnerNote", "협업 · 제휴 제안")');
    expect(col).toContain('className={btn("assistive", "md", "rounded-pill")}>{L("footerPartnerTitle", "제휴문의")} →');
    expect(col.indexOf("<KakaoButton")).toBeLessThan(col.indexOf('href="/partner"'));
    const nav = DOC_BY_ID.get("global.nav")!;
    expect(nav.defaults.footerInquiryTitle).toBe("문의하기");
    expect(nav.fields.map((f) => f.key)).toEqual(expect.arrayContaining(["footerInquiryTitle", "footerKakaoNote", "footerPartnerNote"]));
  });
  it("새 탭으로 여는 노란 버튼, 링크가 비면 아무것도 그리지 않는다", () => {
    const html = renderToStaticMarkup(createElement(KakaoButton, { href: "https://pf.kakao.com/_xezfXj" }));
    expect(html).toContain('href="https://pf.kakao.com/_xezfXj"');
    expect(html).toContain('target="_blank"');
    expect(html).toContain('rel="noreferrer"');
    expect(html).toContain("bg-[#FEE500]");
    expect(html).toContain("카카오톡 상담");
    expect(renderToStaticMarkup(createElement(KakaoButton, { href: "" }))).toBe("");
  });
});
