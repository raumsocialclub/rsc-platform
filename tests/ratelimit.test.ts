import { beforeEach, describe, expect, it, vi } from "vitest";
import { fakeDb } from "./helpers/fakeDb";

/** 공개 API 요청 제한(lib/ratelimit.ts): DB 함수가 막으면 429, 키가 없거나 DB 가 실패하면 제한하지 않는다(fail-open). 전부 가상 데이터 */
const db = fakeDb();
let hasKey = true;
vi.mock("@/lib/supabase/admin", () => ({ hasServiceRoleKey: () => hasKey, createAdminClient: () => db.client }));

const req = (ip: string, path = "/api/apply") => new Request(`https://test.example${path}`, { method: "POST", headers: { "x-forwarded-for": ip, "Content-Type": "application/json" }, body: "{}" });

describe("rateLimit / limitByIp", () => {
  beforeEach(() => { hasKey = true; db.rpc.handlers = {}; });

  it("한도 안이면 통과, 넘으면 retryAfter 와 함께 거부", async () => {
    let hits = 0;
    db.rpc.handlers.rate_limit_hit = (args) => { hits += 1; return { data: { allowed: hits <= Number(args.p_limit), hits, retry_after: 42 } }; };
    const { limitByIp } = await import("@/lib/ratelimit");
    expect(await limitByIp(req("1.2.3.4"), "apply", 2, 600)).toEqual({ ok: true });
    expect(await limitByIp(req("1.2.3.4"), "apply", 2, 600)).toEqual({ ok: true });
    expect(await limitByIp(req("1.2.3.4"), "apply", 2, 600)).toEqual({ ok: false, retryAfter: 42 });
  });

  it("키에는 원본 IP 가 아니라 해시가 들어간다", async () => {
    const keys: string[] = [];
    db.rpc.handlers.rate_limit_hit = (args) => { keys.push(String(args.p_key)); return { data: { allowed: true, hits: 1, retry_after: 1 } }; };
    const { limitByIp } = await import("@/lib/ratelimit");
    await limitByIp(req("203.0.113.9, 10.0.0.1"), "inquiries", 5, 600);
    expect(keys[0]).toMatch(/^inquiries:[0-9a-f]{32}$/);
    expect(keys[0]).not.toContain("203.0.113.9");
  });

  it("service role 키가 없으면(로컬) 제한하지 않고 DB 도 부르지 않는다", async () => {
    hasKey = false;
    let called = false;
    db.rpc.handlers.rate_limit_hit = () => { called = true; return { data: { allowed: false, hits: 99, retry_after: 9 } }; };
    const { rateLimit } = await import("@/lib/ratelimit");
    expect(await rateLimit("x", 1, 60)).toEqual({ ok: true });
    expect(called).toBe(false);
  });

  it("DB 함수가 실패하면 막지 않는다 (fail-open)", async () => {
    db.rpc.handlers.rate_limit_hit = () => ({ data: null, error: { message: "boom" } });
    const { rateLimit } = await import("@/lib/ratelimit");
    expect(await rateLimit("x", 1, 60)).toEqual({ ok: true });
  });

  it("429 응답에는 Retry-After 가 붙고, 본문 모양은 바꿀 수 있다", async () => {
    const { tooManyResponse, TOO_MANY } = await import("@/lib/ratelimit");
    const a = tooManyResponse({ retryAfter: 30 });
    expect(a.status).toBe(429);
    expect(a.headers.get("Retry-After")).toBe("30");
    expect((await a.json()).message).toBe(TOO_MANY);
    const b = tooManyResponse({ retryAfter: 5 }, { valid: false, reason: "RATE_LIMIT" });
    expect(await b.json()).toEqual({ valid: false, reason: "RATE_LIMIT" });
  });
});

describe("공개 POST 라우트가 제한을 적용한다", () => {
  beforeEach(() => { hasKey = true; db.rpc.handlers = {}; db.calls.length = 0; });
  it("/api/inquiries: 한도를 넘으면 429 이고 DB 에 저장하지 않는다", async () => {
    db.rpc.handlers.rate_limit_hit = () => ({ data: { allowed: false, hits: 6, retry_after: 100 } });
    vi.doMock("@/lib/supabase/server", () => ({ createClient: async () => db.client }));
    const { POST } = await import("@/app/api/inquiries/route");
    const res = await POST(new Request("https://test.example/api/inquiries", { method: "POST", headers: { "x-forwarded-for": "9.9.9.9", "Content-Type": "application/json" }, body: JSON.stringify({ name: "홍길동", phone: "01012345678", consent: true }) }));
    expect(res.status).toBe(429);
    expect(db.calls.filter((c) => c.table === "inquiries")).toHaveLength(0);
  });
});
