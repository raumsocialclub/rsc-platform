// 서버 전용. 토스페이먼츠 Core API (https://api.tosspayments.com/v1). 시크릿 키는 TOSS_SECRET_KEY 로만 읽는다.
import { requireEnv } from "@/lib/supabase/env";

export type TossPayment = {
  paymentKey: string;
  orderId: string;
  orderName: string;
  status: "READY" | "IN_PROGRESS" | "WAITING_FOR_DEPOSIT" | "DONE" | "CANCELED" | "PARTIAL_CANCELED" | "ABORTED" | "EXPIRED";
  method?: string;
  totalAmount: number;
  balanceAmount?: number;
  approvedAt?: string;
  receipt?: { url?: string };
  easyPay?: { provider?: string };
  card?: { company?: string; number?: string };
  cancels?: { cancelAmount: number; cancelReason: string; canceledAt: string }[];
};

export type TossError = { code: string; message: string };
export type TossResult<T> = { ok: true; data: T } | { ok: false; status: number; error: TossError };

function authHeader() {
  const secret = requireEnv("TOSS_SECRET_KEY");
  return `Basic ${Buffer.from(`${secret}:`).toString("base64")}`;
}

async function tossFetch<T>(path: string, init?: { method?: string; body?: unknown; idempotencyKey?: string }): Promise<TossResult<T>> {
  const headers: Record<string, string> = { Authorization: authHeader(), "Content-Type": "application/json" };
  if (init?.idempotencyKey) headers["Idempotency-Key"] = init.idempotencyKey;
  let res: Response;
  try {
    res = await fetch(`https://api.tosspayments.com/v1${path}`, {
      method: init?.method ?? "GET",
      headers,
      body: init?.body ? JSON.stringify(init.body) : undefined,
      cache: "no-store",
    });
  } catch (e) {
    return { ok: false, status: 0, error: { code: "NETWORK", message: e instanceof Error ? e.message : "network error" } };
  }
  const j = (await res.json().catch(() => ({}))) as T & Partial<TossError>;
  if (!res.ok) return { ok: false, status: res.status, error: { code: j.code ?? "UNKNOWN", message: j.message ?? `HTTP ${res.status}` } };
  return { ok: true, data: j as T };
}

/** 결제 승인 (FLOWS.md 2-4). successUrl 로 받은 paymentKey/orderId/amount 를 그대로 넘긴다. */
export function confirmPayment(params: { paymentKey: string; orderId: string; amount: number }) {
  return tossFetch<TossPayment>("/payments/confirm", { method: "POST", body: params, idempotencyKey: `confirm-${params.orderId}` });
}

/** 결제 조회 (웹훅 검증용) */
export function getPayment(paymentKey: string) {
  return tossFetch<TossPayment>(`/payments/${encodeURIComponent(paymentKey)}`);
}

/** 결제 취소 (전액: cancelAmount 생략) */
export function cancelPayment(paymentKey: string, params: { cancelReason: string; cancelAmount?: number }, idempotencyKey?: string) {
  return tossFetch<TossPayment>(`/payments/${encodeURIComponent(paymentKey)}/cancel`, { method: "POST", body: params, idempotencyKey });
}

/** 토스 응답의 결제수단 라벨 (payments.method) */
export function methodLabel(p: TossPayment): string {
  if (p.easyPay?.provider) return p.easyPay.provider;
  return p.method ?? "기타";
}

export { describeTossError } from "./errors";
