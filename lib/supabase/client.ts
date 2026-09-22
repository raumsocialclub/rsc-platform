"use client";

import { createBrowserClient } from "@supabase/ssr";
import { publicSupabaseEnv } from "./env";

/** 브라우저(클라이언트 컴포넌트)용. anon key 만 사용한다. */
export function createClient() {
  const { url, anonKey } = publicSupabaseEnv();
  return createBrowserClient(url, anonKey);
}
