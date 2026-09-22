import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { requireEnv } from "./env";

/**
 * 서버 전용 관리자 클라이언트. RLS 를 우회하므로 Route Handler 안에서만 쓴다.
 * 절대 클라이언트 컴포넌트에서 import 하지 않는다.
 */
export function createAdminClient() {
  const url = requireEnv("NEXT_PUBLIC_SUPABASE_URL");
  const serviceKey = requireEnv("SUPABASE_SERVICE_ROLE_KEY");
  return createSupabaseClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

/** service role key 가 설정되어 있는지 (없으면 anon 클라이언트로 대체하는 곳에서 사용) */
export function hasServiceRoleKey() {
  return !!process.env.SUPABASE_SERVICE_ROLE_KEY;
}
