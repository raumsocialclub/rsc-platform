import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

const header = readFileSync("components/site/SiteHeader.tsx", "utf8");
const footer = readFileSync("components/site/SiteFooter.tsx", "utf8");
const schema = readFileSync("lib/cms/schema.ts", "utf8");

/** 상단 메뉴: 브랜드소개 · 소셜클럽 · 1:1 매칭 · 소식 · FAQ 순서, 가운데 정렬 · 넓은 간격 (2026-11 요청) */
describe("GNB 메뉴 순서·간격", () => {
  const order = (src: string, hrefs: string[]) => hrefs.map((h) => Math.max(src.indexOf(`href="${h}"`), src.indexOf(`href: "${h}"`)));
  const sorted = (xs: number[]) => xs.every((x, i) => x >= 0 && (i === 0 || x > xs[i - 1]));

  it("데스크톱 메뉴는 브랜드소개 → 소셜클럽 → 1:1 매칭 → 소식 → FAQ", () => {
    const desktop = header.slice(header.indexOf('<nav className="hidden md:flex'), header.indexOf("</nav>"));
    expect(sorted(order(desktop, ["/#about", "/social", "/matching", "/news", "/#faq"]))).toBe(true);
  });
  it("모바일 메뉴도 같은 순서", () => {
    const mobile = header.slice(header.indexOf('<nav className="flex flex-col">'));
    expect(sorted(order(mobile, ["/#about", "/social", "/matching", "/news", "/#faq"]))).toBe(true);
  });
  it("푸터 메뉴도 같은 순서", () => {
    expect(sorted(order(footer, ["/#about", "/social", "/matching", "/news"]))).toBe(true);
  });
  it("메뉴 이름 기본값은 「브랜드소개」 (헤더·푸터·CMS)", () => {
    expect(header).toContain('navAbout: "브랜드소개"');
    expect(footer).toContain('L("navAbout", "브랜드소개")');
    expect(schema).toContain('navAbout: "브랜드소개"');
  });
  it("메뉴는 로고와 버튼 사이 가운데, 간격 24px(lg 48px), 줄바꿈 없음", () => {
    expect(header).toMatch(/<nav className="hidden md:flex items-center gap-\[24px\] lg:gap-\[48px\] mx-auto/);
    expect(header).toMatch(/const NAV = ".*whitespace-nowrap"/);
  });
});
