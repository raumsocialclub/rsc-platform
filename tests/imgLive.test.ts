import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

/** 사진 생동감(img-live) 규칙이 CSS 와 공개 사진 컴포넌트에 빠짐없이 들어 있는지 — 코드 계약 검사 */
const css = readFileSync("app/globals.css", "utf8");
const read = (p: string) => readFileSync(p, "utf8");

describe("img-live (사진 호버·누름 효과)", () => {
  it("CSS: 호버 확대·빛줄기·누름·감속 모션 예외가 모두 정의된다", () => {
    expect(css).toMatch(/\.img-live:hover > img, \.group:hover \.img-live > img \{ transform: scale\(1\.05\)/);
    expect(css).toMatch(/\.img-live::after \{[^}]*linear-gradient/);
    expect(css).toMatch(/\.img-live:active > img[^{]*\{ transform: scale\(1\.02\)/);
    expect(css).toMatch(/@media \(hover: none\) \{[\s\S]*?\.img-live::after \{ display: none; \}/);
    expect(css).toMatch(/@media \(prefers-reduced-motion: reduce\) \{\s*\.img-live > img[^}]*transform: none !important/);
  });
  it("ImageBlock 은 항상 img-live 래퍼를 쓴다", () => {
    const src = read("components/site/ImageBlock.tsx");
    expect(src).toContain("overflow-hidden img-live");
    expect(src).not.toContain("group-hover:scale");
  });
  it("대문 히어로 배경·소식·프로그램 사진도 img-live 를 단다", () => {
    expect(read("components/site/GateHero.tsx")).toMatch(/className=\{`img-live absolute inset-0/);
    expect(read("components/site/GateHero.tsx")).toContain('className="group relative overflow-hidden');
    expect(read("app/(public)/news/page.tsx")).toContain("bg-fill img-live");
    expect(read("app/(public)/news/[slug]/page.tsx")).toContain("mb-[36px] img-live");
    expect(read("components/programs/ProgramCard.tsx")).toContain("overflow-hidden img-live");
    expect(read("components/programs/ProgramDetail.tsx")).toContain("overflow-hidden mb-[36px] img-live");
  });
});
