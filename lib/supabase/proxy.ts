import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * 요청마다 Supabase 세션 쿠키를 갱신하고, 보호 라우트를 검사한다. (proxy.ts 에서 호출)
 * - /programs, /my, /checkout: 로그인 필요 → /login?next=
 * - /admin: 로그인 필요. role=admin 검사는 app/admin/layout.tsx 에서 members 를 읽어 수행 (M4)
 */
const PROTECTED = [/^\/programs(\/|$)/, /^\/my(\/|$)/, /^\/checkout(\/|$)/, /^\/admin(\/|$)/];

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) return response; // 환경변수 없으면 그대로 통과 (M0/M1 화면은 동작)

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });

  // getUser() 는 토큰을 서버에서 검증하고 필요 시 갱신한다. 이 호출을 생략하면 세션이 만료된다.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname, search } = request.nextUrl;
  const needsAuth = PROTECTED.some((re) => re.test(pathname));
  if (needsAuth && !user) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/login";
    loginUrl.search = `?next=${encodeURIComponent(pathname + search)}`;
    return NextResponse.redirect(loginUrl);
  }

  return response;
}
