import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { MATCHCHECK_HIDDEN_SEO, MATCH_FORM_HIDDEN, MATCH_HIDDEN_PREFIXES, isMatchHiddenHref, isMatchHiddenPath, llmsHidden, matchVisibility } from "@/lib/settings/matchHidden";
import { DOC_BY_ID } from "@/lib/cms/schema";
import { mentionsMatching } from "@/lib/settings/matchPreview";
import { SEO_DOCS } from "@/lib/seo/schema";
import { SETTINGS_DOCS } from "@/lib/settings/schema";

/** 1:1 매칭 전체 숨김 (2026-11-23, 카카오 비즈니스 채널 심사 「만남주선」 반려 대응): 설정·경로·llms.txt·API 닫힘·화면 배선. 전부 기본 문구·가상 값으로 확인 */
describe("1:1 매칭 전체 숨김 — 설정과 경로", () => {
  it("설정 기본값은 켬이고 사전등록 모드보다 앞에 있는 스위치다", () => {
    const site = SETTINGS_DOCS.find((d) => d.id === "settings.site")!;
    expect(site.defaults.matchHidden).toBe(true);
    const keys = site.fields.map((f) => f.key);
    expect(keys.indexOf("matchHidden")).toBeGreaterThan(keys.indexOf("leadMode"));
    expect(keys.indexOf("matchHidden")).toBeLessThan(keys.indexOf("matchPreview"));
    expect(site.fields.find((f) => f.key === "matchHidden")!.type).toBe("boolean");
    expect(site.description).toMatch(/1:1 매칭 전체 숨김/);
  });
  it("/matching(하위 경로 포함)만 숨기고, 프로필 진단(/match-check)은 소셜클럽 사전등록 창구로 열어 둔다", () => {
    for (const p of ["/matching", "/matching/", "/matching/plans"]) expect(isMatchHiddenPath(p)).toBe(true);
    for (const p of ["/", "/social", "/fit-check", "/match-check", "/match-check/x", "/match", "/matchings", "/news/matching", "/admin/inquiries", "/apply/abc", "/s/abc"]) expect(isMatchHiddenPath(p)).toBe(false);
    expect(isMatchHiddenHref("/matching#plans")).toBe(true);
    expect(isMatchHiddenHref("/match-check?src=prereg")).toBe(false);
    expect(isMatchHiddenHref("/social#faq")).toBe(false);
    expect(MATCH_HIDDEN_PREFIXES).toEqual(["/matching"]);
  });
  it("프로필 진단은 소셜클럽 사전등록 톤으로: 플로팅 버튼 기본 링크 /match-check?src=prereg, 덮어쓰는 문구에 1:1 매칭 없음", () => {
    const cta = DOC_BY_ID.get("match.cta")!;
    expect(cta.defaults.href).toBe("/match-check?src=prereg");
    expect((cta.defaults.hooks as { label: string; href: string }[]).map((h) => h.label)).toEqual(["이번 달 행사 보기", "RSC 멤버십 문의하기", "프로필 남기고 상담받기"]);
    for (const v of Object.values(MATCH_FORM_HIDDEN)) expect(mentionsMatching(v)).toBe(false);
    expect(MATCH_FORM_HIDDEN.preregTitle).toBe("소셜클럽 사전등록");
    for (const k of ["consentPurpose", "sensitivePurpose", "marketingPurpose", "doneBody", "preregTitle", "preregDoneTitle", "preregDoneBody"]) expect(typeof DOC_BY_ID.get("match.form")!.defaults[k]).toBe("string"); // CMS 에 있는 키만 덮어쓴다
    expect(mentionsMatching(MATCHCHECK_HIDDEN_SEO.title + MATCHCHECK_HIDDEN_SEO.description)).toBe(false);
  });
  it("matchVisibility: 전체 숨김이 켜져 있으면 사전등록 모드는 무시되고, 둘 중 하나라도 켜져 있으면 본문 문장을 뺀다", () => {
    expect(matchVisibility({ matchHidden: true, matchPreview: true })).toEqual({ hidden: true, preview: false, scrub: true });
    expect(matchVisibility({ matchHidden: true, matchPreview: false })).toEqual({ hidden: true, preview: false, scrub: true });
    expect(matchVisibility({ matchHidden: false, matchPreview: true })).toEqual({ hidden: false, preview: true, scrub: true });
    expect(matchVisibility({ matchHidden: false, matchPreview: false })).toEqual({ hidden: false, preview: false, scrub: false });
  });
  it("llmsHidden: 기본 llms.txt 본문에서 1:1 매칭 언급이 모두 사라지고 사전등록 안내 줄도 없다", () => {
    const ai = SEO_DOCS.find((d) => d.id === "seo.ai")!;
    const before = String(ai.defaults.llmsText);
    expect(before).toMatch(/1:1 매칭/);
    const after = llmsHidden(before);
    expect(mentionsMatching(after)).toBe(false);
    expect(after).not.toMatch(/사전등록|RAUM SOLO|SOCIAL NIGHT|결혼중개\)/);
    expect(after).toMatch(/소셜클럽\(\/social/);
    expect(after).toMatch(/- 운영: 주식회사 트라움에스앤씨/);
    expect(after).toMatch(/- 프로그램: 월 1회 RSC TASTE SOCIAL/);
    expect(after).toMatch(/- 문의: /);
  });
});

describe("1:1 매칭 전체 숨김 — 화면·SEO 배선 (소스 확인)", () => {
  const src = (p: string) => readFileSync(p, "utf8");
  it("proxy 는 /matching 을 메인으로 보내고 페이지도 직접 redirect 한다. /match-check 는 숨김 모드 문구·SEO 로 열린다", () => {
    expect(src("lib/supabase/proxy.ts")).toMatch(/settings\.matchHidden && isMatchHiddenPath\(pathname\)/);
    expect(src("app/(public)/matching/page.tsx")).toMatch(/if \(matchHidden\) redirect\("\/"\)/);
    const mc = src("app/(public)/match-check/page.tsx");
    expect(mc).not.toMatch(/redirect\(/);
    expect(mc).toMatch(/matchHidden \? \{ \.\.\.doc0, \.\.\.MATCH_FORM_HIDDEN \} : doc0/);
    expect(mc).toMatch(/matchHidden \? MATCHCHECK_HIDDEN_SEO : \{\}/);
    expect(src("app/api/match/route.ts")).not.toMatch(/matchHiddenGuard/);
  });
  it("GNB·푸터 「1:1 매칭」 메뉴, 홈 비교 카드·전환 바는 matchHidden 으로 숨기고 플로팅 버튼은 그대로 둔다", () => {
    const header = src("components/site/SiteHeader.tsx");
    expect(header).toMatch(/\{!matchHidden && <Link href="\/matching"/);
    expect(header).toMatch(/\.\.\.\(!matchHidden \? \[\{ href: "\/matching"/);
    expect(src("components/site/Header.tsx")).toMatch(/matchHidden=\{settings\.matchHidden\}/);
    expect(src("components/site/SiteFooter.tsx")).toMatch(/\{!matchHidden && <Link href="\/matching"/);
    expect(src("app/(public)/page.tsx")).toMatch(/!matchHidden && <TrackCards/);
    expect(src("app/(public)/page.tsx")).toMatch(/hideMatching=\{matchHidden\}/);
    expect(src("app/(public)/social/page.tsx")).toMatch(/\{!matchHidden && <TrackSwitch/);
    expect(src("app/layout.tsx")).toMatch(/<MatchCta visible=\{on\(cta, "visible"\)\}/);
  });
  it("사이트맵·robots·llms.txt 에서 숨김 경로를 뺀다", () => {
    expect(src("app/sitemap.ts")).toMatch(/settings\.matchHidden && isMatchHiddenPath\(p\.path\)/);
    expect(src("app/robots.ts")).toMatch(/settings\.matchHidden \? MATCH_HIDDEN_PREFIXES/);
    expect(src("app/llms.txt/route.ts")).toMatch(/hidden \? llmsHidden\(seo\.llmsText\)/);
    expect(src("app/llms.txt/route.ts")).toMatch(/if \(hidden && isMatchHiddenPath\(p\.path\)\) return;/);
    expect(src("app/llms.txt/route.ts")).toMatch(/hidden && p\.key === "matchcheck"/);
  });
});
