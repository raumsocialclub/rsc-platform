import { describe, expect, it, vi } from "vitest";
import { hasPrice, isLeadHiddenHref, isLeadHiddenPath } from "@/lib/settings/leadMode";
import { parseUtm } from "@/lib/utm/client";

/** 리드 모드: 숨김 페이지 판정·가격 문구 판정·API 닫힘, 그리고 UTM 파싱 */
describe("리드 모드 경로 판정", () => {
  it("가격·가입·예약·내 예약·결제·환불규정·네이버 로그인은 숨김", () => {
    for (const p of ["/pricing", "/join", "/join/register", "/programs", "/programs/abc", "/my", "/checkout/123", "/refund", "/auth/naver/start"]) expect(isLeadHiddenPath(p)).toBe(true);
  });
  it("메인·혜택·소식·상담·약관·관리자·로그인은 그대로", () => {
    for (const p of ["/", "/benefits", "/news", "/news/hello", "/fit-check", "/terms", "/privacy", "/admin", "/admin/inquiries", "/login", "/auth/callback", "/pricing-guide"]) expect(isLeadHiddenPath(p)).toBe(false);
  });
  it("링크 주소 판정도 같은 기준 (해시·쿼리 포함)", () => {
    expect(isLeadHiddenHref("/pricing")).toBe(true);
    expect(isLeadHiddenHref("/pricing#preview")).toBe(true);
    expect(isLeadHiddenHref("/fit-check")).toBe(false);
    expect(isLeadHiddenHref("https://www.instagram.com/raum_socialclub/")).toBe(false);
  });
  it("금액이 들어간 문구 판정", () => {
    expect(hasPrice("회당 평균 160,000원 상당 절감")).toBe(true);
    expect(hasPrice("미팅룸 5만원/h")).toBe(true);
    expect(hasPrice("연 8매 · 분기당 2매 제공")).toBe(false);
    expect(hasPrice("")).toBe(false);
  });
});

describe("리드 모드에서 닫히는 API", () => {
  it("예약·결제·초대코드 API 는 404", async () => {
    vi.doMock("@/lib/settings/get", () => ({ getSettings: async () => ({ leadMode: true }) }));
    vi.doMock("@/lib/supabase/server", () => ({ createClient: async () => ({}) }));
    const req = () => new Request("https://test.example/x", { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" });
    const bookings = await import("@/app/api/bookings/route");
    const verify = await import("@/app/api/invites/verify/route");
    const confirm = await import("@/app/api/payments/confirm/route");
    for (const r of [bookings, verify, confirm]) {
      const res = await r.POST(req());
      expect(res.status).toBe(404);
      expect((await res.json()).ok).toBe(false);
    }
    vi.doUnmock("@/lib/settings/get");
    vi.doUnmock("@/lib/supabase/server");
  });
});

describe("UTM 파싱", () => {
  it("utm_* 만 뽑고 100자로 자른다", () => {
    expect(parseUtm("?utm_source=meta&utm_campaign=oct&gclid=abc&utm_term=")).toEqual({ utm_source: "meta", utm_campaign: "oct" });
    expect(parseUtm("?utm_medium=" + "m".repeat(150)).utm_medium).toHaveLength(100);
    expect(parseUtm("")).toEqual({});
  });
});
