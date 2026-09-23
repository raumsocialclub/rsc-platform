import { getSettings } from "@/lib/settings/get";

/**
 * 환불 정책. 기본값: 프로그램 시작 3일 전까지 100% 환불, 이후 환불 불가.
 * 어드민 → 일반 설정 → 결제 · 환불 에서 바꾸면 회원 화면 문구와 취소 계산에 그대로 적용된다.
 */
export type RefundRules = { days: number; rate: number; lateRate: number };
export const DEFAULT_RULES: RefundRules = { days: 3, rate: 1, lateRate: 0 };

export async function getRefundRules(): Promise<RefundRules> {
  try {
    const s = await getSettings();
    return { days: Math.max(0, Number(s.refundDays) || 0), rate: Math.min(1, Math.max(0, (Number(s.refundRate) || 0) / 100)), lateRate: Math.min(1, Math.max(0, (Number(s.lateRefundRate) || 0) / 100)) };
  } catch {
    return DEFAULT_RULES;
  }
}

export function refundPolicyText(r: RefundRules = DEFAULT_RULES): string {
  const pct = (x: number) => `${Math.round(x * 100)}%`;
  const before = r.rate > 0 ? `프로그램 ${r.days}일 전까지 ${pct(r.rate)} 환불` : `프로그램 ${r.days}일 전까지 환불 불가`;
  const after = r.lateRate > 0 ? `이후 ${pct(r.lateRate)} 환불` : "이후 환불 불가";
  return `${before}, ${after}`;
}

export type RefundQuote = { allowed: boolean; rate: number; amount: number; label: string; daysLeft: number };

export function refundQuote(startsAt: string, amount: number, rules: RefundRules = DEFAULT_RULES, now = new Date()): RefundQuote {
  const ms = new Date(startsAt).getTime() - now.getTime();
  const daysLeft = ms / 86_400_000;
  if (ms <= 0) return { allowed: false, rate: 0, amount: 0, label: "이미 시작된 프로그램", daysLeft };
  const rate = daysLeft >= rules.days ? rules.rate : rules.lateRate;
  if (rate <= 0) return { allowed: false, rate: 0, amount: 0, label: daysLeft >= rules.days ? "환불 불가" : `환불 기간이 지났습니다 (${rules.days}일 전까지)`, daysLeft };
  const refund = Math.round(amount * rate);
  return { allowed: true, rate, amount: refund, label: rate === 1 ? "100% 환불" : `${Math.round(rate * 100)}% 환불`, daysLeft };
}
