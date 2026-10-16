"use client";

import { createBrowserClient } from "@supabase/ssr";

/**
 * 브라우저(클라이언트 컴포넌트)용. anon key 만 사용한다.
 * 주의: 브라우저 번들에는 `process.env.NEXT_PUBLIC_…` 를 글자 그대로 쓴 경우에만 값이 들어간다.
 * (`process.env[name]` 같은 동적 접근은 빈 값이 된다 — M3 가입 실패 원인)
 */
export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) {
    throw new Error("CONFIG_MISSING");
  }
  return createBrowserClient(url, anonKey);
}
