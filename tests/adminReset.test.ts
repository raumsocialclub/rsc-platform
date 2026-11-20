import { beforeEach, describe, expect, it, vi } from "vitest";
import { fakeDb } from "./helpers/fakeDb";
import { hashInviteToken, newInviteToken } from "@/lib/admins/invite";

/** 관리자 비밀번호 재설정 (M16): 주관리자 발급 → 링크로 새 비밀번호 → 로그인. 가상 데이터. */
const db = fakeDb();
let me: { id: string; role: string; name?: string; email?: string } | null = { id: "11111111-1111-4111-8111-111111111111", role: "owner", name: "대표", email: "owner@example.com" };
const mails: { to: string; link: string }[] = [];
vi.mock("@/lib/supabase/server", () => ({ createClient: async () => db.client }));
vi.mock("@/lib/supabase/admin", () => ({ hasServiceRoleKey: () => true, createAdminClient: () => db.client }));
vi.mock("@/lib/admin/guard", () => ({ requireAdmin: async () => (me && (me.role === "admin" || me.role === "owner") ? me : null), requireOwner: async () => (me?.role === "owner" ? me : null), OWNER_ONLY_MESSAGE: "주관리자만" }));
vi.mock("@/lib/admin/log", () => ({ logAdmin: async () => {} }));
vi.mock("@/lib/notify", () => ({ sendAdminPasswordReset: async (p: { to: string; link: string }) => { mails.push(p); return { sent: false, reason: "NOT_CONFIGURED" }; } }));

const owner = { id: "11111111-1111-4111-8111-111111111111", name: "대표", email: "owner@example.com", role: "owner", status: "active" };
const sub = { id: "22222222-2222-4222-8222-222222222222", name: "부관리자", email: "sub@example.com", role: "admin", status: "active" };
const member = { id: "33333333-3333-4333-8333-333333333333", name: "회원", email: "member@example.com", role: "member", status: "active" };
const ctx = (id: string) => ({ params: Promise.resolve({ id }) });
const post = (url: string, body?: unknown) => new Request(`https://test.example${url}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: body === undefined ? undefined : JSON.stringify(body) });

describe("POST /api/admin/admins/[id]/reset — 재설정 링크 발급", () => {
  beforeEach(() => {
    db.tables.members = [{ ...owner }, { ...sub }, { ...member }];
    db.tables.admin_invites = [];
    db.calls.length = 0;
    mails.length = 0;
    me = { id: "11111111-1111-4111-8111-111111111111", role: "owner" };
  });
  it("주관리자가 아니면 403", async () => {
    const { POST } = await import("@/app/api/admin/admins/[id]/reset/route");
    me = { id: "22222222-2222-4222-8222-222222222222", role: "admin" };
    expect((await POST(post("/x"), ctx("22222222-2222-4222-8222-222222222222"))).status).toBe(403);
  });
  it("부관리자에게 24시간 1회용 링크를 만들고(해시만 저장) 링크를 돌려준다", async () => {
    const { POST } = await import("@/app/api/admin/admins/[id]/reset/route");
    const res = await POST(post("/x"), ctx("22222222-2222-4222-8222-222222222222"));
    expect(res.status).toBe(200);
    const j = (await res.json()) as { link: string; expiresAt: string; mailed: boolean; mailReason: string };
    expect(j.link).toMatch(/\/admin-reset\/[0-9a-f]{64}$/);
    expect(j.mailed).toBe(false);
    expect(j.mailReason).toBe("NOT_CONFIGURED");
    const hours = (new Date(j.expiresAt).getTime() - Date.now()) / 3600_000;
    expect(hours).toBeGreaterThan(23.9);
    expect(hours).toBeLessThan(24.1);
    const row = db.tables.admin_invites[0] as Record<string, unknown>;
    expect(row.kind).toBe("reset");
    expect(row.email).toBe("sub@example.com");
    expect(row.token_hash).toBe(hashInviteToken(j.link.split("/").pop()!));
    expect(JSON.stringify(row)).not.toContain(j.link.split("/").pop()!);
    expect(mails[0]?.to).toBe("sub@example.com");
  });
  it("같은 사람에게 다시 만들면 이전 대기 링크는 취소된다", async () => {
    const { POST } = await import("@/app/api/admin/admins/[id]/reset/route");
    await POST(post("/x"), ctx("22222222-2222-4222-8222-222222222222"));
    await POST(post("/x"), ctx("22222222-2222-4222-8222-222222222222"));
    const rows = db.tables.admin_invites as Record<string, unknown>[];
    expect(rows).toHaveLength(2);
    expect(rows[0].revoked_at).toBeTruthy();
    expect(rows[1].revoked_at).toBeUndefined();
  });
  it("일반 회원·정지된 관리자에게는 만들지 않는다", async () => {
    const { POST } = await import("@/app/api/admin/admins/[id]/reset/route");
    expect((await POST(post("/x"), ctx("33333333-3333-4333-8333-333333333333"))).status).toBe(400);
    db.tables.members[1].status = "paused";
    expect((await POST(post("/x"), ctx("22222222-2222-4222-8222-222222222222"))).status).toBe(400);
    expect(db.tables.admin_invites).toHaveLength(0);
  });
  it("주관리자 본인에게도 만들 수 있다", async () => {
    const { POST } = await import("@/app/api/admin/admins/[id]/reset/route");
    expect((await POST(post("/x"), ctx("11111111-1111-4111-8111-111111111111"))).status).toBe(200);
  });
});

describe("POST /api/admin-reset — 링크로 새 비밀번호", () => {
  const future = () => new Date(Date.now() + 3600_000).toISOString();
  const seed = (over: Record<string, unknown> = {}) => {
    const { token, hash } = newInviteToken();
    db.tables.admin_invites = [{ id: "inv-1", email: "sub@example.com", name: "부관리자", role: "admin", kind: "reset", token_hash: hash, expires_at: future(), used_at: null, revoked_at: null, ...over }];
    return token;
  };
  beforeEach(() => {
    db.tables.members = [{ ...owner }, { ...sub }, { ...member }];
    db.authCalls.length = 0;
    db.calls.length = 0;
  });
  it("유효한 링크: 비밀번호를 바꾸고 사용 처리하고 로그인한다", async () => {
    const { POST } = await import("@/app/api/admin-reset/route");
    const token = seed();
    const res = await POST(post("/api/admin-reset", { token, password: "newpass-123" }));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true, loggedIn: true });
    expect(db.authCalls).toEqual([{ op: "updateUserById", id: "22222222-2222-4222-8222-222222222222", attrs: { password: "newpass-123" } }]);
    expect((db.tables.admin_invites[0] as Record<string, unknown>).used_at).toBeTruthy();
  });
  it("8자 미만·잘못된 토큰 꼴은 400", async () => {
    const { POST } = await import("@/app/api/admin-reset/route");
    const token = seed();
    expect((await POST(post("/api/admin-reset", { token, password: "short" }))).status).toBe(400);
    expect((await POST(post("/api/admin-reset", { token: "nope", password: "newpass-123" }))).status).toBe(400);
    expect(db.authCalls).toHaveLength(0);
  });
  it("없는·사용된·취소된·만료된 링크는 거부", async () => {
    const { POST } = await import("@/app/api/admin-reset/route");
    const pw = { password: "newpass-123" };
    expect((await POST(post("/api/admin-reset", { token: "f".repeat(64), ...pw }))).status).toBe(404);
    expect((await POST(post("/api/admin-reset", { token: seed({ used_at: future() }), ...pw }))).status).toBe(409);
    expect((await POST(post("/api/admin-reset", { token: seed({ revoked_at: future() }), ...pw }))).status).toBe(409);
    expect((await POST(post("/api/admin-reset", { token: seed({ expires_at: "2020-01-01T00:00:00.000Z" }), ...pw }))).status).toBe(409);
    expect(db.authCalls).toHaveLength(0);
  });
  it("초대 링크(kind=invite)로는 비밀번호를 바꿀 수 없다", async () => {
    const { POST } = await import("@/app/api/admin-reset/route");
    const token = seed({ kind: "invite" });
    expect((await POST(post("/api/admin-reset", { token, password: "newpass-123" }))).status).toBe(409);
    expect(db.authCalls).toHaveLength(0);
  });
  it("링크의 이메일이 활동 중인 관리자가 아니면 거부 (권한 해제·정지된 뒤 쓴 링크)", async () => {
    const { POST } = await import("@/app/api/admin-reset/route");
    const token = seed();
    db.tables.members[1].role = "member";
    expect((await POST(post("/api/admin-reset", { token, password: "newpass-123" }))).status).toBe(409);
    expect(db.authCalls).toHaveLength(0);
  });
});

describe("POST /api/auth/reset-request — 로그인 화면 비밀번호 찾기", () => {
  beforeEach(() => {
    db.tables.members = [{ ...owner }, { ...sub }, { ...member }];
    db.tables.admin_invites = [];
    mails.length = 0;
    delete process.env.RESEND_API_KEY;
  });
  it("메일 키가 없으면 아무것도 만들지 않고 같은 안내만 돌려준다", async () => {
    const { POST } = await import("@/app/api/auth/reset-request/route");
    const res = await POST(post("/api/auth/reset-request", { email: "sub@example.com" }));
    expect(res.status).toBe(200);
    expect(db.tables.admin_invites).toHaveLength(0);
  });
  it("메일 키가 있으면 관리자 이메일에만 링크를 만들어 메일로 보내고, 응답에는 링크를 담지 않는다", async () => {
    process.env.RESEND_API_KEY = "re_test";
    const { POST } = await import("@/app/api/auth/reset-request/route");
    const a = await (await POST(post("/api/auth/reset-request", { email: "sub@example.com" }))).json();
    const b = await (await POST(post("/api/auth/reset-request", { email: "member@example.com" }))).json();
    const c = await (await POST(post("/api/auth/reset-request", { email: "nobody@example.com" }))).json();
    expect(a).toEqual(b);
    expect(b).toEqual(c);
    expect(db.tables.admin_invites).toHaveLength(1);
    expect(mails).toHaveLength(1);
    expect(mails[0].to).toBe("sub@example.com");
    expect(JSON.stringify(a)).not.toContain("admin-reset");
  });
  it("같은 이메일은 5분 안에 다시 만들지 않는다", async () => {
    process.env.RESEND_API_KEY = "re_test";
    const { POST } = await import("@/app/api/auth/reset-request/route");
    await POST(post("/api/auth/reset-request", { email: "sub@example.com" }));
    (db.tables.admin_invites[0] as Record<string, unknown>).created_at = new Date().toISOString();
    await POST(post("/api/auth/reset-request", { email: "sub@example.com" }));
    expect(db.tables.admin_invites).toHaveLength(1);
  });
});
