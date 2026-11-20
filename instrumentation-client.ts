import * as Sentry from "@sentry/nextjs";

/** Sentry 브라우저 설정 (M13). 결제 위젯·예약 화면의 JS 오류를 잡는다. DSN 없으면 비활성. */
Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  enabled: !!process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NEXT_PUBLIC_VERCEL_ENV || process.env.NODE_ENV,
  tracesSampleRate: 0,
  replaysSessionSampleRate: 0,
  replaysOnErrorSampleRate: 0,
  sendDefaultPii: false,
  ignoreErrors: ["ResizeObserver loop", "Load failed", "Failed to fetch", "NetworkError"],
});

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
