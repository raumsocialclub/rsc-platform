import { beforeEach, describe, expect, it, vi } from "vitest";
import { fakeDb } from "./helpers/fakeDb";

/** 환불 흐름: cancelBooking(토스 취소) · 회원 취소 API(환불 정책) · 관리자 환불 API(사유 필수·로그) */
let db = fakeDb();
const toss = { cancelPayment: vi.fn() };
let me: { id: string; role: string; status: string; name: string; email: string; inviteCodeId: string | null } | null = null;
const logAdmin = vi.fn(async () => undefined);
vi.mock("@/lib/supabase/admin", () => ({ createAdminClient: () => db.client, hasServiceRoleKey: () => true }));
vi.mock("@/lib/supabase/server", () => ({ createClient: async () => db.client }));
vi.mock("@/lib/auth/session", () => ({ getCurrentMember: async () => me, isAdminRole: (m: { role: string; status: string } | null) => !!m && (m.role === "admin" || m.role === "owner") && m.status === "active", isOwnerRole: (m: { role: string } | null) => m?.role === "owner" }));
vi.mock("@/lib/admin/guard", () => ({ requireAdmin: async () => (me && (me.role === "admin" || me.role === "owner") ? me : null), requireOwner: async () => (me?.role === "owner" ? me : null), OWNER_ONLY_MESSAGE: "주관리자만" }));
vi.mock("@/lib/admin/log", () => ({ logAdmin: (...a: unknown[]) => logAdmin(...(a as [])) }));
vi.mock("@/lib/toss/client", async (orig) => {
  const real = (await orig()) as Record<string, unknown>;
  return { ...real, cancelPayment: (...a: unknown[]) => toss.cancelPayment(...a) };
});

const DAY = 86_400_000;
const B = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const booking = (over: Record<string, unknown> = {}) => ({ id: B, order_id: "RSC-1", member_id: "m1", program_id: "p1", session_id: "s1", qty: 1, unit_price: 59000, amount: 59000, status: "confirmed", expires_at: "2026-10-01T00:00:00Z", cancelled_at: null, created_at: "2026-09-20T00:00:00Z", ...over });
const payment = (over: Record<string, unknown> = {}) => ({ id: "pay1", booking_id: B, payment_key: "pk_1", amount: 59000, status: "paid", raw: { balanceAmount: 59000 }, created_at: "2026-09-20T00:00:00Z", ...over });

describe("cancelBooking (토스 취소 + DB 갱신)", () => {
  beforeEach(() => {
    db = fakeDb({ bookings: [booking()], payments: [payment()] });
    toss.cancelPayment.mockReset();
  });
  it("결제 대기 예약은 토스 호출 없이 취소", async () => {
    db.tables.bookings[0].status = "pending";
    const { cancelBooking } = await import("@/lib/bookings/cancel");
    const r = await cancelBooking({ bookingId: B, refundAmount: 59000, reason: "회원 취소" });
    expect(r).toMatchObject({ ok: true, refunded: 0 });
    expect(toss.cancelPayment).not.toHaveBeenCalled();
    expect(db.tables.bookings[0].status).toBe("cancelled");
  });
  it("전액 환불: cancelAmount 없이 호출, payments cancelled", async () => {
    toss.cancelPayment.mockResolvedValue({ ok: true, data: { status: "CANCELED", balanceAmount: 0 } });
    const { cancelBooking } = await import("@/lib/bookings/cancel");
    const r = await cancelBooking({ bookingId: B, refundAmount: 59000, reason: "회원 취소" });
    expect(r).toMatchObject({ ok: true, refunded: 59000 });
    expect(toss.cancelPayment).toHaveBeenCalledWith("pk_1", { cancelReason: "회원 취소" }, `cancel-${B}-59000`);
    expect(db.tables.payments[0].status).toBe("cancelled");
    expect(db.tables.bookings[0].status).toBe("cancelled");
  });
  it("부분 환불: cancelAmount 지정, partial_cancelled", async () => {
    toss.cancelPayment.mockResolvedValue({ ok: true, data: { status: "PARTIAL_CANCELED", balanceAmount: 39000 } });
    const { cancelBooking } = await import("@/lib/bookings/cancel");
    const r = await cancelBooking({ bookingId: B, refundAmount: 20000, reason: "관리자 조정" });
    expect(r).toMatchObject({ ok: true, refunded: 20000 });
    expect(toss.cancelPayment).toHaveBeenCalledWith("pk_1", { cancelReason: "관리자 조정", cancelAmount: 20000 }, expect.any(String));
    expect(db.tables.payments[0].status).toBe("partial_cancelled");
  });
  it("남은 금액보다 큰 요청은 남은 금액까지만 환불", async () => {
    db.tables.payments[0].raw = { balanceAmount: 30000 };
    toss.cancelPayment.mockResolvedValue({ ok: true, data: { status: "CANCELED", balanceAmount: 0 } });
    const { cancelBooking } = await import("@/lib/bookings/cancel");
    const r = await cancelBooking({ bookingId: B, refundAmount: 59000, reason: "x" });
    expect(r).toMatchObject({ ok: true, refunded: 30000 });
  });
  it("환불 0원은 예약만 취소", async () => {
    const { cancelBooking } = await import("@/lib/bookings/cancel");
    const r = await cancelBooking({ bookingId: B, refundAmount: 0, reason: "노쇼" });
    expect(r).toMatchObject({ ok: true, refunded: 0 });
    expect(toss.cancelPayment).not.toHaveBeenCalled();
    expect(db.tables.payments[0].status).toBe("paid");
    expect(db.tables.bookings[0].status).toBe("cancelled");
  });
  it("토스 취소 실패 → 502, 예약은 그대로, 운영 알림", async () => {
    toss.cancelPayment.mockResolvedValue({ ok: false, status: 400, error: { code: "PROVIDER_ERROR", message: "pg down" } });
    const { cancelBooking } = await import("@/lib/bookings/cancel");
    const { opsAlert } = await import("@/lib/alert");
    const r = await cancelBooking({ bookingId: B, refundAmount: 59000, reason: "회원 취소" });
    expect(r).toMatchObject({ ok: false, status: 502 });
    expect(db.tables.bookings[0].status).toBe("confirmed");
    expect(opsAlert).toHaveBeenCalledWith("refund.failed", expect.objectContaining({ tossCode: "PROVIDER_ERROR" }));
  });
  it("다른 회원 예약은 찾을 수 없음", async () => {
    const { cancelBooking } = await import("@/lib/bookings/cancel");
    expect(await cancelBooking({ bookingId: B, refundAmount: 0, reason: "x", memberId: "other" })).toMatchObject({ ok: false, status: 404 });
  });
});

describe("회원 취소 API POST /api/bookings/[id]/cancel (환불 정책 적용)", () => {
  const ctx = { params: Promise.resolve({ id: B }) };
  beforeEach(() => {
    me = { id: "m1", role: "member", status: "active", name: "회원", email: "m@t", inviteCodeId: "inv" };
    db = fakeDb({ bookings: [booking()], payments: [payment()], sessions: [{ id: "s1", starts_at: new Date(Date.now() + 5 * DAY).toISOString() }] });
    toss.cancelPayment.mockReset();
    toss.cancelPayment.mockResolvedValue({ ok: true, data: { status: "CANCELED", balanceAmount: 0 } });
  });
  it("3일 이상 남았으면 전액 환불", async () => {
    const { POST } = await import("@/app/api/bookings/[id]/cancel/route");
    const j = await (await POST(new Request("https://t/x", { method: "POST" }), ctx)).json();
    expect(j).toEqual({ ok: true, refunded: 59000 });
  });
  it("3일 안쪽이면 409 로 거절하고 토스를 부르지 않는다", async () => {
    db.tables.sessions[0].starts_at = new Date(Date.now() + DAY).toISOString();
    const { POST } = await import("@/app/api/bookings/[id]/cancel/route");
    const res = await POST(new Request("https://t/x", { method: "POST" }), ctx);
    expect(res.status).toBe(409);
    expect(toss.cancelPayment).not.toHaveBeenCalled();
  });
  it("로그인 없이는 401, 남의 예약은 404", async () => {
    const { POST } = await import("@/app/api/bookings/[id]/cancel/route");
    me = null;
    expect((await POST(new Request("https://t/x", { method: "POST" }), ctx)).status).toBe(401);
    me = { id: "other", role: "member", status: "active", name: "", email: "", inviteCodeId: "inv" };
    expect((await POST(new Request("https://t/x", { method: "POST" }), ctx)).status).toBe(404);
  });
});

describe("관리자 환불 API POST /api/admin/orders/[id]/refund", () => {
  const ctx = { params: Promise.resolve({ id: B }) };
  const post = (body: unknown) => new Request("https://t/x", { method: "POST", body: JSON.stringify(body) });
  beforeEach(() => {
    me = { id: "a1", role: "admin", status: "active", name: "부관리자", email: "a@t", inviteCodeId: null };
    db = fakeDb({ bookings: [booking()], payments: [payment()] });
    toss.cancelPayment.mockReset();
    toss.cancelPayment.mockResolvedValue({ ok: true, data: { status: "CANCELED", balanceAmount: 0 } });
    logAdmin.mockClear();
  });
  it("사유가 없으면 400 (필수)", async () => {
    const { POST } = await import("@/app/api/admin/orders/[id]/refund/route");
    const res = await POST(post({ amount: 59000 }), ctx);
    expect(res.status).toBe(400);
    expect((await res.json()).message).toContain("사유");
    expect(toss.cancelPayment).not.toHaveBeenCalled();
  });
  it("부관리자도 사유를 넣으면 환불되고 활동 로그에 처리자·금액·사유가 남는다", async () => {
    const { POST } = await import("@/app/api/admin/orders/[id]/refund/route");
    const j = await (await POST(post({ amount: 59000, reason: "행사 취소" }), ctx)).json();
    expect(j).toEqual({ ok: true, refunded: 59000 });
    expect(logAdmin).toHaveBeenCalledWith("a1", "order.refund", B, expect.objectContaining({ refunded: 59000, amount: 59000, reason: "행사 취소", by: "admin" }));
  });
  it("일반 회원은 403", async () => {
    me = { id: "m1", role: "member", status: "active", name: "", email: "", inviteCodeId: "inv" };
    const { POST } = await import("@/app/api/admin/orders/[id]/refund/route");
    expect((await POST(post({ amount: 0, reason: "x" }), ctx)).status).toBe(403);
  });
});
