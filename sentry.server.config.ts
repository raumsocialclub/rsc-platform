import * as Sentry from "@sentry/nextjs";

/** Sentry 서버(Node) 설정 (M13). SENTRY_DSN 또는 NEXT_PUBLIC_SENTRY_DSN 이 비어 있으면 비활성. */
Sentry.init({
  dsn: process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN,
  enabled: !!(process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN),
  environment: process.env.VERCEL_ENV || process.env.NODE_ENV,
  release: process.env.VERCEL_GIT_COMMIT_SHA,
  tracesSampleRate: 0.05,
  sendDefaultPii: false,
  // 비밀번호·토큰·카드 정보가 이벤트에 실리지 않게 한다
  beforeSend(event) {
    if (event.request?.data && typeof event.request.data === "object") {
      const d = event.request.data as Record<string, unknown>;
      for (const k of Object.keys(d)) if (/password|token|secret|card/i.test(k)) d[k] = "[filtered]";
    }
    return event;
  },
});
