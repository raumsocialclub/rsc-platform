import { beforeEach, describe, expect, it, vi } from "vitest";
import { fakeDb } from "./helpers/fakeDb";

/** 가입 흐름: 초대코드 검증(/api/invites/verify) · 사용 처리(/api/invites/consume) · 관리자 초대 토큰 */
const db = fakeDb();
vi.mock("@/lib/supabase/server", () => ({ createClient: async () => db.client }));

const post = (url: string, body: unknown) => new Request(`https://test.example${url}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });

describe("초대코드 검증 POST /api/invites/verify", () => {
  beforeEach(() => {
    db.client.user = null;
    db.rpc.handlers = {};
  });
  it("형식이 틀리면 DB 를 부르지 않고 FORMAT", async () => {
    const { POST } = await import("@/app/api/invites/verify/route");
    const spy = vi.fn();
    db.rpc.handlers.verify_invite_code = spy;
    const res = await POST(post("/api/invites/verify", { code: "hello" }));
    expect((await res.json()).reason).toBe("FORMAT");
    expect(spy).not.toHaveBeenCalled();
  });
  it("소문자·공백을 정리해 RPC 에 넘기고 결과를 그대로 돌려준다", async () => {
    const { POST } = await import("@/app/api/invites/verify/route");
    db.rpc.handlers.verify_invite_code = (a) => ({ data: { valid: true, name: "홍길동", code: a.p_code } });
    const j = await (await POST(post("/api/invites/verify", { code: " rsc-ab12-cd34 " }))).json();
    expect(j).toEqual({ valid: true, name: "홍길동", code: "RSC-AB12-CD34" });
  });
  it("사용·만료된 코드는 valid=false", async () => {
    const { POST } = await import("@/app/api/invites/verify/route");
    db.rpc.handlers.verify_invite_code = () => ({ data: { valid: false, reason: "USED" } });
    expect((await (await POST(post("/api/invites/verify", { code: "RSC-AB12-CD34" }))).json()).valid).toBe(false);
  });
  it("빈 입력은 400", async () => {
    const { POST } = await import("@/app/api/invites/verify/route");
    expect((await POST(post("/api/invites/verify", { code: "" }))).status).toBe(400);
  });
});

describe("초대코드 사용 POST /api/invites/consume", () => {
  beforeEach(() => {
    db.client.user = null;
    db.rpc.handlers = {};
  });
  it("로그인하지 않으면 401", async () => {
    const { POST } = await import("@/app/api/invites/consume/route");
    expect((await POST(post("/api/invites/consume", { code: "RSC-AB12-CD34" }))).status).toBe(401);
  });
  it("유효하지 않은 코드는 400", async () => {
    const { POST } = await import("@/app/api/invites/consume/route");
    db.client.user = { id: "u1" };
    db.rpc.handlers.consume_invite_code = () => ({ data: false });
    expect((await POST(post("/api/invites/consume", { code: "RSC-AB12-CD34" }))).status).toBe(400);
  });
  it("유효한 코드는 ok", async () => {
    const { POST } = await import("@/app/api/invites/consume/route");
    db.client.user = { id: "u1" };
    db.rpc.handlers.consume_invite_code = (a) => ({ data: a.p_code === "RSC-AB12-CD34" });
    expect((await (await POST(post("/api/invites/consume", { code: "rsc-ab12-cd34" }))).json()).ok).toBe(true);
  });
});

describe("관리자 초대 토큰", () => {
  it("토큰은 64자 hex, 해시는 토큰과 다르고 재현 가능", async () => {
    const { newInviteToken, hashInviteToken, isTokenShape, inviteLink } = await import("@/lib/admins/invite");
    const { token, hash } = newInviteToken();
    expect(isTokenShape(token)).toBe(true);
    expect(hash).not.toBe(token);
    expect(hashInviteToken(token)).toBe(hash);
    expect(isTokenShape("short")).toBe(false);
    expect(inviteLink(token)).toBe(`https://test.example/admin-invite/${token}`);
  });
  it("초대 상태 판정", async () => {
    const { inviteState } = await import("@/lib/admins/types");
    const base = { id: "i", email: "a@b", name: "", role: "admin" as const, created_at: "2026-01-01", used_at: null, revoked_at: null };
    const now = new Date("2026-01-02T00:00:00Z");
    expect(inviteState({ ...base, expires_at: "2026-01-03T00:00:00Z" }, now)).toBe("pending");
    expect(inviteState({ ...base, expires_at: "2026-01-01T00:00:00Z" }, now)).toBe("expired");
    expect(inviteState({ ...base, expires_at: "2026-01-03T00:00:00Z", used_at: "2026-01-02" }, now)).toBe("used");
    expect(inviteState({ ...base, expires_at: "2026-01-03T00:00:00Z", revoked_at: "2026-01-02" }, now)).toBe("revoked");
  });
});
