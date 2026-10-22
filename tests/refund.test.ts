import { describe, expect, it } from "vitest";
import { DEFAULT_RULES, refundPolicyText, refundQuote } from "@/lib/bookings/refund";

const DAY = 86_400_000;
const now = new Date("2026-10-01T00:00:00Z");

describe("환불 정책 계산 (refundQuote)", () => {
  it("시작 3일 이상 전이면 100% 환불", () => {
    const q = refundQuote(new Date(now.getTime() + 5 * DAY).toISOString(), 59000, DEFAULT_RULES, now);
    expect(q.allowed).toBe(true);
    expect(q.amount).toBe(59000);
    expect(q.label).toBe("100% 환불");
  });
  it("3일 안쪽이면 환불 불가", () => {
    const q = refundQuote(new Date(now.getTime() + 2 * DAY).toISOString(), 59000, DEFAULT_RULES, now);
    expect(q.allowed).toBe(false);
    expect(q.amount).toBe(0);
  });
  it("이미 시작된 프로그램은 환불 불가", () => {
    const q = refundQuote(new Date(now.getTime() - DAY).toISOString(), 59000, DEFAULT_RULES, now);
    expect(q.allowed).toBe(false);
    expect(q.label).toContain("시작");
  });
  it("어드민 설정(7일 전 100%, 이후 50%)을 따른다", () => {
    const rules = { days: 7, rate: 1, lateRate: 0.5 };
    expect(refundQuote(new Date(now.getTime() + 10 * DAY).toISOString(), 100000, rules, now).amount).toBe(100000);
    const late = refundQuote(new Date(now.getTime() + 3 * DAY).toISOString(), 100000, rules, now);
    expect(late.allowed).toBe(true);
    expect(late.amount).toBe(50000);
    expect(late.label).toBe("50% 환불");
  });
  it("정책 문구", () => {
    expect(refundPolicyText()).toBe("프로그램 3일 전까지 100% 환불, 이후 환불 불가");
    expect(refundPolicyText({ days: 7, rate: 1, lateRate: 0.5 })).toBe("프로그램 7일 전까지 100% 환불, 이후 50% 환불");
  });
});
