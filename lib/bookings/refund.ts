/**
 * 환불 정책 (회원 상세 NOTICE 문구와 동일): 프로그램 시작 3일 전까지 100% 환불, 이후 환불 불가.
 * FLOWS.md 3 의 D-7 100% / D-3 50% 안은 최종 정책 확정 시 RULES 만 바꾸면 된다(어드민 설정값은 2차).
 */
export const REFUND_RULES: { daysBefore: number; rate: number }[] = [{ daysBefore: 3, rate: 1 }];
export const REFUND_POLICY_TEXT = "프로그램 3일 전까지 100% 환불, 이후 환불 불가";

export type RefundQuote = { allowed: boolean; rate: number; amount: number; label: string; daysLeft: number };

export function refundQuote(startsAt: string, amount: number, now = new Date()): RefundQuote {
  const ms = new Date(startsAt).getTime() - now.getTime();
  const daysLeft = ms / 86_400_000;
  if (ms <= 0) return { allowed: false, rate: 0, amount: 0, label: "이미 시작된 프로그램", daysLeft };
  const rule = [...REFUND_RULES].sort((a, b) => b.daysBefore - a.daysBefore).find((r) => daysLeft >= r.daysBefore);
  if (!rule || rule.rate <= 0) return { allowed: false, rate: 0, amount: 0, label: "환불 기간이 지났습니다 (3일 전까지)", daysLeft };
  const refund = Math.round(amount * rule.rate);
  return { allowed: true, rate: rule.rate, amount: refund, label: rule.rate === 1 ? "100% 환불" : `${Math.round(rule.rate * 100)}% 환불`, daysLeft };
}
