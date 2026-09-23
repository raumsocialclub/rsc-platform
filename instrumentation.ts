import * as Sentry from "@sentry/nextjs";

/** 서버 시작 시 1회. Sentry 서버/엣지 설정을 읽는다 (M13). DSN 이 없으면 아무것도 보내지 않는다. */
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") await import("./sentry.server.config");
  if (process.env.NEXT_RUNTIME === "edge") await import("./sentry.edge.config");
}

/** 서버 컴포넌트·Route Handler 의 처리되지 않은 오류를 Sentry 로 */
export const onRequestError = Sentry.captureRequestError;
