import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs/config";

const nextConfig: NextConfig = {
  images: {
    // Supabase Storage(programs 버킷)의 프로그램 이미지
    remotePatterns: [{ protocol: "https", hostname: "*.supabase.co", pathname: "/storage/v1/object/public/**" }],
  },
};

/**
 * Sentry (M13). SENTRY_AUTH_TOKEN 이 있을 때만 소스맵을 업로드한다(없으면 빌드에 영향 없음).
 * DSN 은 런타임 환경변수(NEXT_PUBLIC_SENTRY_DSN / SENTRY_DSN)로 읽는다.
 */
export default withSentryConfig(nextConfig, {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  authToken: process.env.SENTRY_AUTH_TOKEN,
  silent: !process.env.CI,
  sourcemaps: { disable: !process.env.SENTRY_AUTH_TOKEN },
  widenClientFileUpload: true,
  disableLogger: true,
  telemetry: false,
});
