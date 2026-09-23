import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { loadSettingsEdge, noticeHtml } from "@/lib/settings/edge";
import { clientIp, ipMatches, parseList } from "@/lib/settings/ip";

/**
 * 요청마다: (1) 일반 설정에 따른 접근 차단·점검 모드·관리자 IP 제한 → (2) Supabase 세션 쿠키 갱신 + 보호 라우트
 * → (3) 보안 헤더·공개 페이지 CDN 캐시 헤더. (proxy.ts 에서 호출)
 */
const PROTECTED = [/^\/programs(\/|$)/, /^\/my(\/|$)/, /^\/checkout(\/|$)/, /^\/admin(\/|$)/];
const PUBLIC_CACHEABLE = new Set(["/", "/pricing", "/benefits", "/fit-check", "/terms", "/privacy", "/refund", "/news", "/robots.txt", "/sitemap.xml", "/llms.txt"]);
const isPublicCacheable = (p: string) => PUBLIC_CACHEABLE.has(p) || p.startsWith("/news/");
const MAINTENANCE_OPEN = [/^\/admin(\/|$)/, /^\/login(\/|$)/, /^\/auth(\/|$)/];

export async function updateSession(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const settings = await loadSettingsEdge();
  const ip = clientIp(request.headers);
  const country = (request.headers.get("x-vercel-ip-country") ?? "").toUpperCase();

  // (1) 접근 차단
  if (ipMatches(ip, parseList(settings.blockedIps)) || (country && parseList(settings.blockedCountries).map((c) => c.toUpperCase()).includes(country))) {
    return noticeHtml("접속이 제한되었습니다", settings.blockMessage, 403);
  }
  if (settings.maintenance && !MAINTENANCE_OPEN.some((re) => re.test(pathname)) && !ipMatches(ip, parseList(settings.maintenanceAllowIps))) {
    return noticeHtml("사이트 점검 중", settings.maintenanceMessage, 503);
  }
  const adminIps = parseList(settings.adminAllowedIps);
  if (adminIps.length && /^\/admin(\/|$)/.test(pathname) && !ipMatches(ip, adminIps)) {
    return noticeHtml("관리자 접속이 제한되었습니다", `허용되지 않은 IP(${ip})입니다. 일반 설정 → 보안 → 관리자 허용 IP 를 확인해 주세요.`, 403);
  }

  // (2) 세션 갱신 + 보호 라우트
  let response = NextResponse.next({ request });
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  let hasSession = false;
  if (url && anonKey) {
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
    hasSession = !!user;
    const needsAuth = PROTECTED.some((re) => re.test(pathname));
    if (needsAuth && !user) {
      const loginUrl = request.nextUrl.clone();
      loginUrl.pathname = "/login";
      loginUrl.search = `?next=${encodeURIComponent(pathname + search)}`;
      return NextResponse.redirect(loginUrl);
    }
  }

  // (3) 보안 헤더 + 공개 페이지 캐시
  if (settings.securityHeaders) {
    response.headers.set("Strict-Transport-Security", "max-age=63072000; includeSubDomains");
    response.headers.set("X-Frame-Options", "SAMEORIGIN");
    response.headers.set("X-Content-Type-Options", "nosniff");
    response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
    response.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  }
  const ttl = Number(settings.cacheSeconds) || 0;
  const hasAuthCookie = request.cookies.getAll().some((c) => c.name.startsWith("sb-"));
  if (ttl > 0 && isPublicCacheable(pathname) && !hasSession && !hasAuthCookie && request.method === "GET") {
    response.headers.set("Cache-Control", `public, s-maxage=${ttl}, stale-while-revalidate=${ttl * 5}`);
    response.headers.set("Vary", "Cookie");
  }
  return response;
}
