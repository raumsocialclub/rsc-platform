import { beforeEach, describe, expect, it, vi } from "vitest";
import { fakeDb } from "./helpers/fakeDb";

/**
 * 결제 흐름: confirmBookingPayment (successUrl → 서버 승인 → payments/bookings 확정) + 웹훅.
 * 토스 API 는 모킹. 금액 검증·중복 승인·만료 처리가 핵심.
 */
let db = fakeDb();
const toss = { confirmPayment: vi.fn(), getPayment: vi.fn(), cancelPayment: vi.fn() };
vi.mock("@/lib/supabase/admin", () => ({ createAdminClient: () => db.client, hasServiceRoleKey: () => true }));
vi.mock("@/lib/toss/client", async (orig) => {
  const real = (await orig()) as Record<string, unknown>;
  return { ...real, confirmPayment: (...a: unknown[]) => toss.confirmPayment(...a), getPayment: (...a: unknown[]) => toss.getPayment(...a), cancelPayment: (...a: unknown[]) => toss.cancelPayment(...a) };
});

const future = new Date(Date.now() + 10 * 60_000).toISOString();
const booking = (over: Record<string, unknown> = {}) => ({ id: "b1", order_id: "RSC-20261001-ABCDEF", member_id: "m1", program_id: "p1", session_id: "s1", qty: 1, unit_price: 59000, amount: 59000, status: "pending", expires_at: future, cancelled_at: null, created_at: "2026-10-01T00:00:00Z", ...over });
const paid = (over: Record<string, unknown> = {}) => ({ paymentKey: "pk_1", orderId: "RSC-20261001-ABCDEF", orderName: "ART WALK", status: "DONE", totalAmount: 59000, balanceAmount: 59000, approvedAt: "2026-10-01T01:00:00Z", easyPay: { provider: "토스페이" }, receipt: { url: "https://r" }, ...over });

describe("결제 승인 confirmBookingPayment", () => {
  beforeEach(() => {
    db = fakeDb({ bookings: [booking()], payments: [], members: [{ id: "m1", email: "m@t", name: "회원" }], programs: [{ id: "p1", name: "ART WALK", place: "라움" }], sessions: [{ id: "s1", starts_at: future }] });
    toss.confirmPayment.mockReset();
    toss.getPayment.mockReset();
  });

  it("예약이 없으면 NOT_FOUND, 토스 호출 없음", async () => {
    const { confirmBookingPayment } = await import("@/lib/bookings/confirm");
    const r = await confirmBookingPayment({ paymentKey: "pk", orderId: "NOPE", amount: 59000 });
    expect(r).toMatchObject({ ok: false, code: "NOT_FOUND" });
    expect(toss.confirmPayment).not.toHaveBeenCalled();
  });
  it("다른 회원의 예약은 FORBIDDEN", async () => {
    const { confirmBookingPayment } = await import("@/lib/bookings/confirm");
    const r = await confirmBookingPayment({ paymentKey: "pk", orderId: "RSC-20261001-ABCDEF", amount: 59000, memberId: "someone" });
    expect(r).toMatchObject({ ok: false, code: "FORBIDDEN" });
  });
  it("클라이언트가 보낸 금액이 DB 와 다르면 승인하지 않는다 (가격은 서버가 결정)", async () => {
    const { confirmBookingPayment } = await import("@/lib/bookings/confirm");
    const { opsAlert } = await import("@/lib/alert");
    const r = await confirmBookingPayment({ paymentKey: "pk", orderId: "RSC-20261001-ABCDEF", amount: 1000, memberId: "m1" });
    expect(r).toMatchObject({ ok: false, code: "AMOUNT_MISMATCH" });
    expect(toss.confirmPayment).not.toHaveBeenCalled();
    expect(opsAlert).not.toHaveBeenCalled();
  });
  it("15분이 지난 예약은 BOOKING_EXPIRED", async () => {
    db.tables.bookings[0].expires_at = new Date(Date.now() - 1000).toISOString();
    const { confirmBookingPayment } = await import("@/lib/bookings/confirm");
    const r = await confirmBookingPayment({ paymentKey: "pk", orderId: "RSC-20261001-ABCDEF", amount: 59000, memberId: "m1" });
    expect(r).toMatchObject({ ok: false, code: "BOOKING_EXPIRED" });
  });
  it("이미 확정된 예약은 토스를 다시 부르지 않고 alreadyConfirmed", async () => {
    db.tables.bookings[0].status = "confirmed";
    const { confirmBookingPayment } = await import("@/lib/bookings/confirm");
    const r = await confirmBookingPayment({ paymentKey: "pk", orderId: "RSC-20261001-ABCDEF", amount: 59000, memberId: "m1" });
    expect(r).toMatchObject({ ok: true, alreadyConfirmed: true });
    expect(toss.confirmPayment).not.toHaveBeenCalled();
  });
  it("토스 승인 실패 → 실패 코드 + 운영 알림", async () => {
    toss.confirmPayment.mockResolvedValue({ ok: false, status: 400, error: { code: "INVALID_REJECT_CARD", message: "거절" } });
    const { confirmBookingPayment } = await import("@/lib/bookings/confirm");
    const { opsAlert } = await import("@/lib/alert");
    const r = await confirmBookingPayment({ paymentKey: "pk", orderId: "RSC-20261001-ABCDEF", amount: 59000, memberId: "m1" });
    expect(r).toMatchObject({ ok: false, code: "INVALID_REJECT_CARD" });
    expect(r.ok === false && r.message).toContain("카드사");
    expect(opsAlert).toHaveBeenCalledWith("payment.confirm_failed", expect.objectContaining({ tossCode: "INVALID_REJECT_CARD" }));
    expect(db.tables.bookings[0].status).toBe("pending");
  });
  it("승인 성공 → payments 기록 + 예약 confirmed + 확정 메일", async () => {
    toss.confirmPayment.mockResolvedValue({ ok: true, data: paid() });
    const { confirmBookingPayment } = await import("@/lib/bookings/confirm");
    const { sendBookingConfirmed } = await import("@/lib/notify");
    const r = await confirmBookingPayment({ paymentKey: "pk_1", orderId: "RSC-20261001-ABCDEF", amount: 59000, memberId: "m1" });
    expect(r).toMatchObject({ ok: true, bookingId: "b1", alreadyConfirmed: false });
    expect(toss.confirmPayment).toHaveBeenCalledWith({ paymentKey: "pk_1", orderId: "RSC-20261001-ABCDEF", amount: 59000 });
    expect(db.tables.payments).toHaveLength(1);
    expect(db.tables.payments[0]).toMatchObject({ payment_key: "pk_1", status: "paid", amount: 59000, method: "토스페이" });
    expect(db.tables.bookings[0].status).toBe("confirmed");
    expect(sendBookingConfirmed).toHaveBeenCalledWith(expect.objectContaining({ to: "m@t", amount: 59000 }));
  });
  it("중복 승인(ALREADY_PROCESSED_PAYMENT)이면 조회해서 이어서 확정", async () => {
    toss.confirmPayment.mockResolvedValue({ ok: false, status: 400, error: { code: "ALREADY_PROCESSED_PAYMENT", message: "dup" } });
    toss.getPayment.mockResolvedValue({ ok: true, data: paid() });
    const { confirmBookingPayment } = await import("@/lib/bookings/confirm");
    const r = await confirmBookingPayment({ paymentKey: "pk_1", orderId: "RSC-20261001-ABCDEF", amount: 59000, memberId: "m1" });
    expect(r).toMatchObject({ ok: true });
    expect(db.tables.bookings[0].status).toBe("confirmed");
  });
  it("토스가 승인한 금액이 예약 금액과 다르면 기록하지 않고 알림", async () => {
    toss.confirmPayment.mockResolvedValue({ ok: true, data: paid({ totalAmount: 10 }) });
    const { confirmBookingPayment } = await import("@/lib/bookings/confirm");
    const { opsAlert } = await import("@/lib/alert");
    const r = await confirmBookingPayment({ paymentKey: "pk_1", orderId: "RSC-20261001-ABCDEF", amount: 59000, memberId: "m1" });
    expect(r).toMatchObject({ ok: false, code: "AMOUNT_MISMATCH" });
    expect(db.tables.payments).toHaveLength(0);
    expect(opsAlert).toHaveBeenCalledWith("payment.confirm_failed", expect.objectContaining({ stage: "amount" }));
  });
});

describe("결제 API POST /api/payments/confirm", () => {
  it("로그인 없이는 401", async () => {
    vi.doMock("@/lib/auth/session", () => ({ getCurrentMember: async () => null }));
    const { POST } = await import("@/app/api/payments/confirm/route");
    const res = await POST(new Request("https://test.example/api/payments/confirm", { method: "POST", body: JSON.stringify({ paymentKey: "pk", orderId: "o", amount: 1 }) }));
    expect(res.status).toBe(401);
    vi.doUnmock("@/lib/auth/session");
  });
});

describe("웹훅 POST /api/payments/webhook", () => {
  beforeEach(() => {
    db = fakeDb({ bookings: [booking()], payments: [], members: [], programs: [], sessions: [] });
    toss.getPayment.mockReset();
    delete process.env.TOSS_WEBHOOK_SECRET;
  });
  const hook = (body: unknown, key?: string) => new Request(`https://test.example/api/payments/webhook${key ? `?key=${key}` : ""}`, { method: "POST", body: JSON.stringify(body) });

  it("본문을 믿지 않고 토스에 다시 조회한 DONE 결제만 확정한다", async () => {
    toss.getPayment.mockResolvedValue({ ok: true, data: paid() });
    const { POST } = await import("@/app/api/payments/webhook/route");
    const j = await (await POST(hook({ eventType: "PAYMENT_STATUS_CHANGED", data: { paymentKey: "pk_1", status: "DONE" } }))).json();
    expect(j.code).toBe("CONFIRMED");
    expect(toss.getPayment).toHaveBeenCalledWith("pk_1");
    expect(db.tables.bookings[0].status).toBe("confirmed");
  });
  it("다른 이벤트는 무시(200)", async () => {
    const { POST } = await import("@/app/api/payments/webhook/route");
    const res = await POST(hook({ eventType: "OTHER" }));
    expect(res.status).toBe(200);
    expect((await res.json()).ignored).toBe(true);
    expect(toss.getPayment).not.toHaveBeenCalled();
  });
  it("웹훅 비밀키가 설정되면 키가 맞아야 한다", async () => {
    process.env.TOSS_WEBHOOK_SECRET = "s3cret";
    const { POST } = await import("@/app/api/payments/webhook/route");
    expect((await POST(hook({ eventType: "PAYMENT_STATUS_CHANGED", data: { paymentKey: "pk_1" } }))).status).toBe(401);
    toss.getPayment.mockResolvedValue({ ok: true, data: paid() });
    expect((await POST(hook({ eventType: "PAYMENT_STATUS_CHANGED", data: { paymentKey: "pk_1" } }, "s3cret"))).status).toBe(200);
  });
  it("토스에서 취소된 결제는 예약도 취소로 맞춘다", async () => {
    db.tables.bookings[0].status = "confirmed";
    db.tables.payments.push({ id: "pay1", payment_key: "pk_1", status: "paid", amount: 59000 });
    toss.getPayment.mockResolvedValue({ ok: true, data: paid({ status: "CANCELED", balanceAmount: 0 }) });
    const { POST } = await import("@/app/api/payments/webhook/route");
    const j = await (await POST(hook({ eventType: "PAYMENT_STATUS_CHANGED", data: { paymentKey: "pk_1" } }))).json();
    expect(j.code).toBe("CANCELLED");
    expect(db.tables.bookings[0].status).toBe("cancelled");
    expect(db.tables.payments[0].status).toBe("cancelled");
  });
});
