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
    // 동작 줄이기: 자동 움직임(켄 번즈·가라앉기)은 끄고, 호버·누름 반응은 0.2s 로 남긴다 (끄면 그 설정을 켠 PC 에서 "효과가 없다"고 보인다)
    expect(css).toMatch(/\.img-live-hero \{ animation: none !important; transform: none !important; \}/);
    expect(css).toMatch(/\.img-live > img \{ animation: none !important; scale: 1 !important; transition-duration: \.2s !important; \}/);
    expect(css).not.toMatch(/\.img-live > img[^}]*transform: none !important/);
  });
  it("모바일 생동감: 스크롤 가라앉기·히어로 켄 번즈·스와이프 포커스·카드 누름이 정의된다", () => {
    expect(css).toMatch(/@keyframes rsc-img-settle \{ from \{ scale: 1\.12; \} to \{ scale: 1; \} \}/);
    expect(css).toMatch(/@supports \(animation-timeline: view\(\)\) \{\s*\.img-live:not\(\.img-live-hero\) > img \{ animation: rsc-img-settle/);
    expect(css).toMatch(/html\.js \.img-live:not\(\.img-live-hero\):not\(\.is-in\) > img \{ scale: 1\.12; \}/);
    // 켄 번즈는 상자(.img-live-hero)에: 사진(img)에 걸면 호버 확대(transform)를 덮어써 대문 호버가 죽는다
    expect(css).toMatch(/\.img-live-hero \{ animation: rsc-kenburns 16s/);
    expect(css).not.toMatch(/\.img-live-hero > img \{ animation/);
    expect(css).toMatch(/@media \(max-width: 760px\) \{\s*@supports \(animation-timeline: view\(\)\) \{\s*\.swipe-item \{ animation: rsc-swipe-focus linear both; animation-timeline: view\(inline\)/);
    const ds = read("components/ui/ds.tsx");
    expect(ds).toMatch(/CARD_HOVER = "group transition-\[transform,translate,scale,box-shadow,border-color\][^"]*active:scale-\[\.985\]"/);
    expect(ds).toMatch(/SWIPE_ITEM = "swipe-item /);
    const ro = read("components/site/RevealObserver.tsx");
    expect(ro).toContain('addEventListener("touchstart", noop, { passive: true })');
    expect(ro).toMatch(/WATCH = \["\[data-reveal\]", "\[data-fold\]", "\.img-live"\]/);
    expect(read("components/site/GateHero.tsx")).toMatch(/className=\{`img-live img-live-hero absolute inset-0/);
  });
  it("ImageBlock 은 항상 img-live 래퍼를 쓴다", () => {
    const src = read("components/site/ImageBlock.tsx");
    expect(src).toContain("overflow-hidden img-live");
    expect(src).not.toContain("group-hover:scale");
  });
  it("대문 히어로 배경·소식·프로그램 사진도 img-live 를 단다", () => {
    expect(read("components/site/GateHero.tsx")).toContain('className="group relative overflow-hidden');
    expect(read("app/(public)/news/page.tsx")).toContain("bg-fill img-live");
    expect(read("app/(public)/news/[slug]/page.tsx")).toContain("mb-[36px] img-live");
    expect(read("components/programs/ProgramCard.tsx")).toContain("overflow-hidden img-live");
    expect(read("components/programs/ProgramDetail.tsx")).toContain("overflow-hidden mb-[36px] img-live");
  });
});
