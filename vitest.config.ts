import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

/** 자동 테스트 (M13). `npm test` — 가입·예약·결제·환불 핵심 흐름을 외부 서비스(Supabase·토스) 없이 검증한다. */
export default defineConfig({
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
    setupFiles: ["tests/helpers/setup.ts"],
    clearMocks: true,
    restoreMocks: true,
  },
  resolve: { alias: { "@": fileURLToPath(new URL(".", import.meta.url)) } },
});
