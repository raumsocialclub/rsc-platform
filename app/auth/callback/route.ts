import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { INVITE_COOKIE } from "@/lib/auth/providers";

/**
 * 소셜 로그인 콜백. code → 세션 교환 후, 가입 화면에서 남긴 초대코드 쿠키가 있으면 사용 처리한다. (FLOWS.md 1-5)
 * members 행은 DB 트리거(handle_new_user)가 만든다.
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const nextParam = searchParams.get("next") ?? "/programs";
  const next = nextParam.startsWith("/") ? nextParam : "/programs";

  if (!code) return NextResponse.redirect(`${origin}/login?error=oauth`);

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) {
    console.error("[auth/callback]", error);
    return NextResponse.redirect(`${origin}/login?error=oauth`);
  }

  const cookieStore = await cookies();
  const invite = cookieStore.get(INVITE_COOKIE)?.value;
  if (invite) {
    await supabase.rpc("consume_invite_code", { p_code: invite.toUpperCase() });
    cookieStore.delete(INVITE_COOKIE);
  }

  // 초대코드가 아직 연결되지 않은 회원은 /join 에서 코드를 입력하게 한다. (member layout 이 검사)
  return NextResponse.redirect(`${origin}${next}`);
}
