import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { DOC_BY_ID, PAGES } from "@/lib/cms/schema";
import { PUBLIC_PAGES } from "@/lib/seo/schema";

const footer = readFileSync("components/site/SiteFooter.tsx", "utf8");
const page = readFileSync("app/(public)/partner/page.tsx", "utf8");

/** 푸터 「패밀리 사이트」 → 「제휴문의」 + /partner 제휴문의 페이지 (2026-11 요청) */
describe("제휴문의", () => {
  it("푸터에서 패밀리 사이트가 빠지고 제휴문의 열(전화·이메일·안내 링크)이 들어간다", () => {
    expect(footer).not.toMatch(/footerFamilyTitle|familySite|FamilySite/);
    expect(footer).toContain('L("footerPartnerTitle", "제휴문의")');
    expect(footer).toContain("tel:${b.partnerPhone}");
    expect(footer).toContain("mailto:${b.partnerEmail}");
    expect(footer).toContain('href="/partner"');
  });
  it("제휴 담당 연락처는 CMS global.brand 에 있고 기본값이 채워져 있다", () => {
    const brand = DOC_BY_ID.get("global.brand")!;
    expect(brand.fields.map((f) => f.key)).toEqual(expect.arrayContaining(["partnerPhone", "partnerEmail"]));
    expect(brand.fields.some((f) => f.key.startsWith("familySite"))).toBe(false);
    expect(brand.defaults.partnerPhone).toBe("010-9272-7783");
    expect(brand.defaults.partnerEmail).toBe("se.na@theraum.co.kr");
    expect(brand.defaults.phone).toBe("02-6925-4786");
    expect(brand.defaults.email).toBe("theraumai@gmail.com");
  });
  it("partner.page 문서: 협업 분야 3개 + 연락처 카드 + 제안서 안내 문구", () => {
    const doc = DOC_BY_ID.get("partner.page")!;
    expect(doc.page).toBe("partner");
    const tracks = doc.defaults.tracks as { title: string }[];
    expect(tracks.map((t) => t.title)).toEqual(["브랜드 · 콘텐츠 협업", "기업 · 단체 제휴", "공간 · 행사 협업"]);
    for (const k of ["title", "body", "partnerCardTitle", "partnerCtaLabel", "generalCardTitle", "generalCtaLabel", "guideTitle", "guideItems", "mailSubject"]) expect(String(doc.defaults[k] ?? "")).not.toBe("");
    expect(PAGES.some((p) => p.key === "partner" && p.preview === "/partner")).toBe(true);
  });
  it("/partner 는 공개 페이지 목록(SEO · 사이트맵 · llms.txt)에 있고 seo.partner 문서가 만들어진다", () => {
    expect(PUBLIC_PAGES.find((p) => p.key === "partner")?.path).toBe("/partner");
    expect(DOC_BY_ID.get("seo.partner")?.defaults.title).toBe("제휴문의");
  });
  it("페이지는 CMS 문구와 브랜드 연락처만 쓰고(코드에 문구 없음) 메일 제목을 자동으로 넣는다", () => {
    expect(page).toContain('getDoc("partner.page")');
    expect(page).toContain("partnerPhone");
    expect(page).toContain("encodeURIComponent(s(d, \"mailSubject\"))");
    expect(page).toContain('href="/fit-check"');
    expect(page).not.toMatch(/010-|@theraum|@gmail/);
  });
});
