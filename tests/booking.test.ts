import { beforeEach, describe, expect, it, vi } from "vitest";
import { fakeDb } from "./helpers/fakeDb";

/** 예약 흐름: POST /api/bookings → DB 함수 book_session (정원·상태·회원 검사는 DB 가 한다) */
const db = fakeDb();
let me: { id: string; role: string; status: string; inviteCodeId: string | null; name: string; email: string } | null = null;
vi.mock("@/lib/supabase/server", () => ({ createClient: async () => db.client }));
vi.mock("@/lib/auth/session", () => ({ getCurrentMember: async () => me }));

const post = (body: unknown) => new Request("https://test.example/api/bookings", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
const SESSION = "11111111-1111-4111-8111-111111111111";

describe("예약 생성 POST /api/bookings", () => {
  beforeEach(() => {
    me = { id: "m1", role: "member", status: "active", inviteCodeId: "inv", name: "회원", email: "m@t" };
    db.rpc.handlers = {};
  });
  it("로그인하지 않으면 401", async () => {
    me = null;
    const { POST } = await import("@/app/api/bookings/route");
    expect((await POST(post({ sessionId: SESSION }))).status).toBe(401);
  });
  it("회차 id 가 uuid 가 아니면 400", async () => {
    const { POST } = await import("@/app/api/bookings/route");
    expect((await POST(post({ sessionId: "nope" }))).status).toBe(400);
  });
  it("정원이 차면 409 + SOLD_OUT 안내", async () => {
    const { POST } = await import("@/app/api/bookings/route");
    db.rpc.handlers.book_session = () => ({ data: null, error: { message: "SOLD_OUT" } });
    const res = await POST(post({ sessionId: SESSION }));
    expect(res.status).toBe(409);
    const j = await res.json();
    expect(j.code).toBe("SOLD_OUT");
    expect(j.message).toContain("마감");
  });
  it("초대코드 미등록 회원은 NOT_INVITED", async () => {
    const { POST } = await import("@/app/api/bookings/route");
    db.rpc.handlers.book_session = () => ({ data: null, error: { message: "NOT_INVITED" } });
    expect((await (await POST(post({ sessionId: SESSION }))).json()).code).toBe("NOT_INVITED");
  });
  it("성공하면 bookingId 와 pending 상태", async () => {
    const { POST } = await import("@/app/api/bookings/route");
    db.rpc.handlers.book_session = (a) => ({ data: { id: "b1", status: "pending", session_id: a.p_session } });
    const j = await (await POST(post({ sessionId: SESSION }))).json();
    expect(j).toEqual({ ok: true, bookingId: "b1", status: "pending" });
  });
  it("알 수 없는 DB 오류는 500", async () => {
    const { POST } = await import("@/app/api/bookings/route");
    db.rpc.handlers.book_session = () => ({ data: null, error: { message: "connection reset" } });
    expect((await POST(post({ sessionId: SESSION }))).status).toBe(500);
  });
});
