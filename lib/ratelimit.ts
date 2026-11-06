import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import { clientIp } from "@/lib/settings/ip";
import { createAdminClient, hasServiceRoleKey } from "@/lib/supabase/admin";

/**
 * 공개 API(로그인 없이 누구나 부르는 POST) 요청 제한. 같은 IP 가 짧은 시간에 너무 많이 부르면 429.
 * 저장은 DB 함수 rate_limit_hit(rate_limits 테이블, service role 전용) — 서버리스라 메모리 카운터를 쓸 수 없다.
 * IP 는 해시로만 저장하고(원본 IP 저장 안 함) 하루 지난 행은 purge_expired_logs 크론이 지운다.
 * service role 키가 없거나(로컬) DB 가 실패하면 제한하지 않는다(fail-open) — 서비스가 멈추는 것보다 낫다.
 * 더 센 보호(국가 차단·경로별 제한·공격 모드)는 Vercel 방화벽에서 (SETUP.md 4-1).
 */
export type RateLimitResult = { ok: true } | { ok: false; retryAfter: number };

export const TOO_MANY = "요청이 너무 많습니다. 잠시 후 다시 시도해 주세요.";

export async function rateLimit(key: string, limit: number, windowSec: number): Promise<RateLimitResult> {
  if (!hasServiceRoleKey()) return { ok: true };
  try {
    const { data, error } = await createAdminClient().rpc("rate_limit_hit", { p_key: key, p_limit: limit, p_window_sec: windowSec });
    if (error || !data) {
      console.error("[ratelimit] rpc failed:", error?.message ?? "no data");
      return { ok: true };
    }
    const r = data as { allowed?: boolean; retry_after?: number };
    return r.allowed === false ? { ok: false, retryAfter: Math.max(1, Number(r.retry_after) || windowSec) } : { ok: true };
  } catch (e) {
    console.error("[ratelimit]", e);
    return { ok: true };
  }
}

/** 요청 IP 기준 제한. scope 는 용도 이름(예: "apply"). 키에는 IP 해시만 들어간다 */
export async function limitByIp(req: Request, scope: string, limit: number, windowSec: number): Promise<RateLimitResult> {
  const ip = clientIp(req.headers) || "unknown";
  const hash = createHash("sha256").update(ip).digest("hex").slice(0, 32);
  return rateLimit(`${scope}:${hash}`, limit, windowSec);
}

/** 429 응답 (Retry-After 초 포함). body 를 주면 그 모양으로, 없으면 { ok:false, message } */
export function tooManyResponse(r: { retryAfter: number }, body?: Record<string, unknown>): NextResponse {
  return NextResponse.json(body ?? { ok: false, message: TOO_MANY }, { status: 429, headers: { "Retry-After": String(r.retryAfter) } });
}
