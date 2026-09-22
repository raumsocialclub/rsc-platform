import { NextResponse } from "next/server";

/**
 * GET /api/health — 운영 점검용. 비밀값은 절대 내보내지 않는다(설정 여부만 true/false).
 * Supabase Auth 공개 설정(/auth/v1/settings)에서 이메일 자동 확인(Confirm email 꺼짐) 여부를 함께 읽는다.
 */
export const dynamic = "force-dynamic";

export async function GET() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  let auth: { reachable: boolean; mailerAutoconfirm?: boolean; signupDisabled?: boolean; externalEmail?: boolean; error?: string } = { reachable: false };

  if (url && anon) {
    try {
      const res = await fetch(`${url}/auth/v1/settings`, { headers: { apikey: anon }, cache: "no-store" });
      const j = (await res.json()) as { mailer_autoconfirm?: boolean; disable_signup?: boolean; external?: { email?: boolean } };
      auth = { reachable: res.ok, mailerAutoconfirm: j.mailer_autoconfirm, signupDisabled: j.disable_signup, externalEmail: j.external?.email };
    } catch (e) {
      auth = { reachable: false, error: e instanceof Error ? e.message : String(e) };
    }
  }

  return NextResponse.json({
    ok: true,
    env: {
      supabaseUrl: !!url,
      supabaseAnonKey: !!anon,
      supabaseServiceRoleKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      authProviders: process.env.NEXT_PUBLIC_AUTH_PROVIDERS ?? "",
      tossClientKey: !!process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY,
      tossSecretKey: !!process.env.TOSS_SECRET_KEY,
      tossTestKeys: (process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY ?? "").startsWith("test_"),
      resendApiKey: !!process.env.RESEND_API_KEY,
    },
    auth,
    // 가입 즉시 활성이 되려면 auth.mailerAutoconfirm 이 true 여야 한다 (Supabase "Confirm email" 꺼짐).
  });
}
