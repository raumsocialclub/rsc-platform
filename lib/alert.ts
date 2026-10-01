/**
 * 운영 알림 (M13). 결제 실패·서버 오류 같은 "사람이 봐야 하는" 사건을
 * 1) Sentry 로 보내고(설정되어 있으면 Sentry 가 이메일 알림을 보냄)
 * 2) RESEND_API_KEY 가 있으면 일반 설정 → 알림 → 운영 알림 받는 이메일로도 바로 메일을 보낸다.
 * 둘 다 없으면 서버 로그만 남긴다. 어느 경우에도 본 작업(결제·예약)을 막지 않는다.
 */
import * as Sentry from "@sentry/nextjs";
import { getSettings } from "@/lib/settings/get";
import { sendOpsAlert } from "@/lib/notify";

export type AlertLevel = "error" | "warning";
export type AlertKind = "payment.confirm_failed" | "payment.webhook_failed" | "refund.failed" | "server.error" | "auth.error";

const KIND_KO: Record<AlertKind, string> = {
  "payment.confirm_failed": "결제 승인 실패",
  "payment.webhook_failed": "결제 웹훅 처리 실패",
  "refund.failed": "환불 실패",
  "server.error": "서버 오류",
  "auth.error": "로그인/가입 오류",
};

export async function opsAlert(kind: AlertKind, detail: Record<string, unknown>, opts: { level?: AlertLevel; error?: unknown } = {}): Promise<void> {
  const level = opts.level ?? "error";
  const title = KIND_KO[kind];
  try {
    Sentry.withScope((scope) => {
      scope.setLevel(level);
      scope.setTag("ops.kind", kind);
      for (const [k, v] of Object.entries(detail)) scope.setExtra(k, v);
      if (opts.error instanceof Error) Sentry.captureException(opts.error);
      else Sentry.captureMessage(`[RSC] ${title}`, level);
    });
  } catch (e) {
    console.error("[alert] sentry", e);
  }
  try {
    const st = await getSettings().catch(() => null);
    const to = st?.alertEmail?.trim();
    if (to) await sendOpsAlert({ to, title, kind, detail, level });
  } catch (e) {
    console.error("[alert] email", e);
  }
  console.error(`[ops-alert] ${kind}`, detail, opts.error ?? "");
}
