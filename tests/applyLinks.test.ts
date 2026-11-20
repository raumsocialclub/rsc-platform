import { beforeEach, describe, expect, it, vi } from "vitest";
import { fakeDb } from "./helpers/fakeDb";
import { APPLY_LINK_STATUS_KO, TOKEN_RE, applyLinkUrl, linkStatus, newToken } from "@/lib/apply/links";

/** 상담 전 설문 비밀 링크(apply_links): 토큰·상태·주소 + 관리자 발급/취소 API. 전부 가상 데이터 */
const db = fakeDb();
let me: { id: string; name: string; email: string; role: string; status: string } | null = null;
vi.mock("@/lib/supabase/server", () => ({ createClient: async () => db.client }));
vi.mock("@/lib/admin/guard", () => ({ requireAdmin: async () => (me && (me.role === "admin" || me.role === "owner") ? me : null), requireOwner: async () => (me?.role === "owner" ? me : null), OWNER_ONLY_MESSAGE: "주관리자만" }));
vi.mock("@/lib/admin/log", () => ({ logAdmin: async () => {} }));
const admin = { id: "11111111-1111-4111-8111-111111111111", name: "대표", email: "owner@example.com", role: "owner", status: "active" };

describe("링크 토큰·상태·주소", () => {
  it("토큰은 22자 base64url 이고 매번 다르다", () => {
    const a = newToken(), b = newToken();
    expect(a).toMatch(TOKEN_RE); expect(a).toHaveLength(22); expect(a).not.toBe(b);
    expect(TOKEN_RE.test("short")).toBe(false); expect(TOKEN_RE.test("has space in it 12345")).toBe(false);
  });
  it("상태: 취소 > 만료 > 사용 중", () => {
    const now = new Date("2026-11-04T00:00:00Z");
    const base = { revoked_at: null, expires_at: "2026-12-01T00:00:00Z" };
    expect(linkStatus(base, now)).toBe("active");
    expect(linkStatus({ ...base, expires_at: "2026-11-03T00:00:00Z" }, now)).toBe("expired");
    expect(linkStatus({ ...base, revoked_at: "2026-11-02T00:00:00Z", expires_at: "2026-11-03T00:00:00Z" }, now)).toBe("revoked");
    expect(APPLY_LINK_STATUS_KO.active).toBe("사용 중");
  });
  it("전달용 주소는 사이트 주소 + /apply/<토큰>", () => {
    expect(applyLinkUrl("abc", "https://rsc-platform.vercel.app/")).toBe("https://rsc-platform.vercel.app/apply/abc");
  });
});

describe("관리자 발급·취소 API", () => {
  beforeEach(() => { db.calls.length = 0; db.tables.apply_links = []; me = admin; });
  const post = (body: unknown) => new Request("https://test.example/api/admin/apply-links", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });

  it("관리자가 아니면 403", async () => {
    me = null;
    const { POST } = await import("@/app/api/admin/apply-links/route");
    expect((await POST(post({ name: "홍길동" }))).status).toBe(403);
    expect(db.tables.apply_links).toHaveLength(0);
  });
  it("만들기: 이름 필수, 토큰·기본 90일 만료·만든 관리자 기록, 응답에 전달용 주소", async () => {
    const { POST } = await import("@/app/api/admin/apply-links/route");
    expect((await POST(post({ name: "" }))).status).toBe(400);
    const res = await POST(post({ name: "11월 전화상담 완료자", memo: "11/4 전화상담" }));
    expect(res.status).toBe(200);
    const j = (await res.json()) as { ok: boolean; link: { id: string; token: string; url: string; expiresAt: string } };
    expect(j.ok).toBe(true);
    expect(j.link.token).toMatch(TOKEN_RE);
    expect(j.link.url.endsWith(`/apply/${j.link.token}`)).toBe(true);
    const row = db.tables.apply_links[0] as Record<string, unknown>;
    expect(row.name).toBe("11월 전화상담 완료자");
    expect(row.created_by).toBe(admin.id);
    const days = (new Date(row.expires_at as string).getTime() - Date.now()) / 86_400_000;
    expect(days).toBeGreaterThan(89.9); expect(days).toBeLessThan(90.1);
    const res2 = await POST(post({ name: "단기", days: 7 }));
    const row2 = (db.tables.apply_links[1] ?? db.tables.apply_links[0]) as Record<string, unknown>;
    expect(res2.status).toBe(200);
    expect((new Date(row2.expires_at as string).getTime() - Date.now()) / 86_400_000).toBeLessThan(7.1);
  });
  it("취소: 한 번만, 이미 취소된 링크는 409", async () => {
    const { DELETE } = await import("@/app/api/admin/apply-links/[id]/route");
    db.tables.apply_links = [{ id: "l1", token: "a".repeat(22), revoked_at: null }];
    const del = (id: string) => DELETE(new Request(`https://test.example/api/admin/apply-links/${id}`, { method: "DELETE" }), { params: Promise.resolve({ id }) });
    expect((await del("l1")).status).toBe(200);
    expect((db.tables.apply_links[0] as { revoked_at: string | null }).revoked_at).toBeTruthy();
    expect((await del("l1")).status).toBe(409);
  });
});
