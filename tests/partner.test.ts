import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { DOC_BY_ID, PAGES } from "@/lib/cms/schema";
import { PUBLIC_PAGES } from "@/lib/seo/schema";
import { PARTNER_KINDS, PARTNER_STATUSES } from "@/lib/partner/types";

const footer = readFileSync("components/site/SiteFooter.tsx", "utf8");
const page = readFileSync("app/(public)/partner/page.tsx", "utf8");

/** 푸터 「패밀리 사이트」 → 「제휴문의」 + /partner 제휴문의 페이지 (2026-11 요청) */
describe("제휴문의", () => {
  it("푸터: 패밀리 사이트 없음, 2열 「서비스 문의」, 3열은 /partner 로 가는 「제휴문의 →」 링크 하나(연락처 없음)", () => {
    expect(footer).not.toMatch(/footerFamilyTitle|familySite|FamilySite/);
    expect(footer).toContain('L("footerContactTitle", "문의")');
    expect(DOC_BY_ID.get("global.nav")!.defaults.footerContactTitle).toBe("서비스 문의");
    expect(footer).toMatch(/<Link href="\/partner" [^>]*>\{L\("footerPartnerTitle", "제휴문의"\)\} →<\/Link>/);
    expect(footer).not.toContain("partnerPhone");
    expect(footer).not.toContain("partnerEmail");
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
  it("partner.page 문서: 협업 분야 3개 + 양식 문구 + 제안서 안내 문구", () => {
    const doc = DOC_BY_ID.get("partner.page")!;
    expect(doc.page).toBe("partner");
    const tracks = doc.defaults.tracks as { title: string }[];
    expect(tracks.map((t) => t.title)).toEqual(["브랜드 · 콘텐츠 협업", "기업 · 단체 제휴", "공간 · 행사 협업"]);
    for (const k of ["title", "body", "trackCta", "contactTitle", "formTitle", "kindLabel", "kindBrand", "kindCorporate", "kindVenue", "kindOther", "companyLabel", "messageLabel", "messageHelp", "readyHint", "attachHelp", "attachButton", "attachNote", "consentTitle", "consentAgree", "consentPurpose", "consentCollect", "consentRetention", "consentRefuse", "submitLabel", "doneTitle", "guideTitle", "guideItems"]) expect(String(doc.defaults[k] ?? "")).not.toBe("");
    expect(String(doc.defaults.attachNote)).toContain("{email}");
    expect(PAGES.some((p) => p.key === "partner" && p.preview === "/partner")).toBe(true);
  });
  it("/partner 는 공개 페이지 목록(SEO · 사이트맵 · llms.txt)에 있고 seo.partner 문서가 만들어진다", () => {
    expect(PUBLIC_PAGES.find((p) => p.key === "partner")?.path).toBe("/partner");
    expect(DOC_BY_ID.get("seo.partner")?.defaults.title).toBe("제휴문의");
  });
  it("페이지는 CMS 문구만 쓰고(코드에 연락처 없음) 양식을 붙이며, 협업 분야 카드에서 유형을 미리 고를 수 있다", () => {
    expect(page).toContain('getDoc("partner.page")');
    expect(page).toContain("<PartnerForm copy={copy} partnerEmail={partnerEmail} initialKind={initialKind} />");
    expect(page).toContain("?kind=${KINDS[i]}#form");
    expect(page).not.toMatch(/010-|@theraum|@gmail|tel:/);
  });
  it("양식은 /api/partner 로 보내고 문의 유형 4종 · 개인정보 동의 · 봇 함정을 갖는다", () => {
    const form = readFileSync("components/partner/PartnerForm.tsx", "utf8");
    expect(form).toContain('fetch("/api/partner"');
    expect(form).toContain("PARTNER_KINDS.map");
    expect(form).toContain("consent: true");
    expect(form).toContain('name="kind"');
    expect(form).toContain("website");
    expect(form).toContain('fetch("/api/partner/upload-url"');
    expect(form).toContain("uploadToSignedUrl(");
    expect(form).toContain('type="file" multiple accept={PARTNER_FILE_ACCEPT}');
    expect(form).toContain("PARTNER_MESSAGE_MIN");
    expect(form).toContain('data-testid="partner-missing"');
    expect(readFileSync("app/api/partner/route.ts", "utf8")).toContain("min(PARTNER_MESSAGE_MIN");
    for (const h of ["수집 · 이용 목적", "수집 항목", "보유 · 이용 기간", "동의 거부 관련"]) expect(form).toContain(h);
    const doc = DOC_BY_ID.get("partner.page")!.defaults as Record<string, string>;
    expect(doc.consentPurpose).toContain("제휴");
    expect(doc.consentRetention).toContain("1년");
    expect(doc.consentRefuse).toContain("거부할 권리");
  });
  it("어드민: /admin/partners 메뉴(접수 배지) + 상태·메모 PATCH + 상태 4단계", () => {
    const layout = readFileSync("app/admin/layout.tsx", "utf8");
    expect(layout).toContain('{ href: "/admin/partners", label: "제휴문의", badge: newPartners ?? 0 }');
    expect(layout).toContain('from("partner_inquiries")');
    const api = readFileSync("app/api/admin/partners/[id]/route.ts", "utf8");
    expect(api).toContain("requireAdmin()");
    expect(api).toContain('from("partner_inquiries").update(parsed.data).eq("id", id)');
    expect(PARTNER_STATUSES).toEqual(["new", "reviewing", "done", "declined"]);
    expect(PARTNER_KINDS).toEqual(["brand", "corporate", "venue", "other"]);
    const sql = readFileSync("SCHEMA.sql", "utf8");
    expect(sql).toContain("create table partner_inquiries");
    expect(sql).toContain('create policy "admin partner inquiries"');
    expect(sql).toContain("purge-expired-partner-inquiries");
    expect(sql).toContain("values ('partner-files', 'partner-files', false, 10485760)");
    expect(sql).toContain("add column if not exists files jsonb");
    const dl = readFileSync("app/api/admin/partners/[id]/file/route.ts", "utf8");
    expect(dl).toContain("requireAdmin()");
    expect(dl).toContain("createSignedUrl(f.path, 300");
  });
});
