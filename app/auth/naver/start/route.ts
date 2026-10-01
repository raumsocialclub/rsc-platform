import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { NAVER_STATE_COOKIE } from "@/lib/auth/providers";

/**
 * GET /auth/naver/start?next= — 네이버 로그인 시작. state 를 쿠키에 남기고 네이버 인증 페이지로 보낸다.
 * 네이버 개발자센터: 서비스 URL = 사이트 주소, Callback URL = https://<도메인>/auth/naver/callback
 */
async function buildAuthorizeUrl(origin: string, nextParam: string): Promise<URL | null> {
  const clientId = process.env.NAVER_CLIENT_ID;
  if (!clientId) return null;
  const next = nextParam.startsWith("/") && !nextParam.startsWith("//") ? nextParam : "/programs";
  const state = `${crypto.randomUUID()}.${Buffer.from(next).toString("base64url")}`;

  const cookieStore = await cookies();
  cookieStore.set(NAVER_STATE_COOKIE, state, { httpOnly: true, sameSite: "lax", secure: origin.startsWith("https"), path: "/", maxAge: 600 });

  const url = new URL("https://nid.naver.com/oauth2.0/authorize");
  url.searchParams.set("response_type", "code");
  url.searchParams.set("client_id", clientId);
  url.searchParams.set("redirect_uri", `${origin}/auth/naver/callback`);
  url.searchParams.set("state", state);
  return url;
}

/** GET: 바로 리다이렉트 (링크용) */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const url = await buildAuthorizeUrl(origin, searchParams.get("next") ?? "/programs");
  return NextResponse.redirect(url ?? `${origin}/login?error=naver_config`);
}

/** POST { next } → { url }: 버튼에서 fetch 후 이동 */
export async function POST(request: Request) {
  const { origin } = new URL(request.url);
  const body = (await request.json().catch(() => null)) as { next?: string } | null;
  const url = await buildAuthorizeUrl(origin, body?.next ?? "/programs");
  if (!url) return NextResponse.json({ ok: false, message: "네이버 로그인 설정(NAVER_CLIENT_ID)이 비어 있습니다." }, { status: 503 });
  return NextResponse.json({ ok: true, url: url.toString() });
}
