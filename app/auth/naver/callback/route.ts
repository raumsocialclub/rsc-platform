import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { INVITE_COOKIE, NAVER_STATE_COOKIE } from "@/lib/auth/providers";
import { normalizePhone } from "@/lib/phone";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

/**
 * GET /auth/naver/callback?code=&state= — 네이버 로그인 콜백 (Supabase 기본 provider 가 아니라 직접 연동).
 * 1) state 검증 → 2) 네이버 토큰 교환 → 3) 프로필(이메일·이름·휴대폰) 조회
 * 4) Supabase 사용자 생성(없으면, provider=naver → 트리거가 members 행 생성, 초대코드는 /join 에서 연결)
 * 5) 관리자 API 로 매직링크 토큰을 만들어 서버에서 바로 세션을 열고 쿠키에 저장 (비밀번호 없음)
 * 6) 가입 화면에서 남긴 초대코드 쿠키가 있으면 사용 처리
 */
type NaverToken = { access_token?: string; error?: string; error_description?: string };
type NaverProfile = { resultcode: string; message: string; response?: { id: string; email?: string; name?: string; nickname?: string; mobile?: string; profile_image?: string } };

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const fail = (reason: string) => NextResponse.redirect(`${origin}/login?error=${reason}`);
  const code = searchParams.get("code");
  const state = searchParams.get("state") ?? "";
  const cookieStore = await cookies();
  const savedState = cookieStore.get(NAVER_STATE_COOKIE)?.value;
  cookieStore.delete(NAVER_STATE_COOKIE);
  if (!code || !state || state !== savedState) return fail("naver_state");

  const clientId = process.env.NAVER_CLIENT_ID;
  const clientSecret = process.env.NAVER_CLIENT_SECRET;
  if (!clientId || !clientSecret) return fail("naver_config");

  // next 는 state 뒤쪽(base64url)에 실려 있다
  let next = "/programs";
  try {
    const decoded = Buffer.from(state.split(".")[1] ?? "", "base64url").toString();
    if (decoded.startsWith("/") && !decoded.startsWith("//")) next = decoded;
  } catch {}

  // 2) 토큰 교환
  const tokenUrl = new URL("https://nid.naver.com/oauth2.0/token");
  tokenUrl.searchParams.set("grant_type", "authorization_code");
  tokenUrl.searchParams.set("client_id", clientId);
  tokenUrl.searchParams.set("client_secret", clientSecret);
  tokenUrl.searchParams.set("code", code);
  tokenUrl.searchParams.set("state", state);
  const token = (await fetch(tokenUrl, { cache: "no-store" }).then((r) => r.json()).catch(() => null)) as NaverToken | null;
  if (!token?.access_token) {
    console.error("[auth/naver] token", token);
    return fail("naver");
  }

  // 3) 프로필
  const profile = (await fetch("https://openapi.naver.com/v1/nid/me", { headers: { Authorization: `Bearer ${token.access_token}` }, cache: "no-store" }).then((r) => r.json()).catch(() => null)) as NaverProfile | null;
  const me = profile?.response;
  if (!me?.email) {
    console.error("[auth/naver] profile", profile);
    return fail("naver_email");
  }
  const email = me.email.toLowerCase();
  const name = me.name || me.nickname || "";
  const phone = me.mobile ? normalizePhone(me.mobile) : null;

  // 4) 사용자 생성 (이미 있으면 그대로 사용)
  const admin = createAdminClient();
  const created = await admin.auth.admin.createUser({
    email,
    email_confirm: true,
    user_metadata: { name, phone, naver_id: me.id },
    app_metadata: { provider: "naver", providers: ["naver"] },
  });
  if (created.error && !/already|exists|registered/i.test(created.error.message)) {
    console.error("[auth/naver] createUser", created.error);
    return fail("naver");
  }

  // 5) 매직링크 토큰으로 서버에서 세션 생성
  const link = await admin.auth.admin.generateLink({ type: "magiclink", email });
  const tokenHash = link.data?.properties?.hashed_token;
  if (link.error || !tokenHash) {
    console.error("[auth/naver] generateLink", link.error);
    return fail("naver");
  }
  const supabase = await createClient();
  const { error: otpErr } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type: "magiclink" });
  if (otpErr) {
    console.error("[auth/naver] verifyOtp", otpErr);
    return fail("naver");
  }

  // 6) 초대코드 쿠키 → 사용 처리 (가입 화면에서 온 경우)
  const invite = cookieStore.get(INVITE_COOKIE)?.value;
  if (invite) {
    await supabase.rpc("consume_invite_code", { p_code: invite.toUpperCase() });
    cookieStore.delete(INVITE_COOKIE);
  }
  return NextResponse.redirect(`${origin}${next}`);
}
