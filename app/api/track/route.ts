import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getCurrentMember } from "@/lib/auth/session";
import { createAdminClient, hasServiceRoleKey } from "@/lib/supabase/admin";

const VID = "rsc_vid";
export const runtime = "nodejs";

/** POST /api/track — 페이지뷰 1건 저장. 방문자 id 는 1년 쿠키. 개인정보 최소 수집. */
export async function POST(req: Request) {
  if (!hasServiceRoleKey()) return NextResponse.json({ ok: false }, { status: 204 });
  const body = (await req.json().catch(() => null)) as { path?: string; referrer?: string; search?: string; width?: number } | null;
  const path = (body?.path ?? "").slice(0, 200);
  if (!path.startsWith("/") || path.startsWith("/admin") || path.startsWith("/api")) return NextResponse.json({ ok: true });

  const cookieStore = await cookies();
  let vid = cookieStore.get(VID)?.value;
  if (!vid || !/^[0-9a-f-]{36}$/i.test(vid)) {
    vid = crypto.randomUUID();
    cookieStore.set(VID, vid, { httpOnly: true, sameSite: "lax", secure: true, path: "/", maxAge: 60 * 60 * 24 * 365 });
  }
  let refHost: string | null = null;
  try {
    if (body?.referrer) {
      const u = new URL(body.referrer);
      refHost = u.host === new URL(req.url).host ? "" : u.host;
    }
  } catch {}
  const sp = new URLSearchParams(body?.search ?? "");
  const ua = req.headers.get("user-agent") ?? "";
  const device = body?.width && body.width <= 760 ? "mobile" : /Mobi|Android|iPhone/i.test(ua) ? "mobile" : "desktop";
  const country = req.headers.get("x-vercel-ip-country") ?? null;
  const me = await getCurrentMember().catch(() => null);

  const admin = createAdminClient();
  await admin.from("page_views").insert({
    path,
    referrer: body?.referrer?.slice(0, 500) || null,
    ref_host: refHost,
    utm_source: sp.get("utm_source")?.slice(0, 100) || null,
    utm_medium: sp.get("utm_medium")?.slice(0, 100) || null,
    utm_campaign: sp.get("utm_campaign")?.slice(0, 100) || null,
    visitor_id: vid,
    member_id: me?.id ?? null,
    device,
    country,
  });
  return NextResponse.json({ ok: true });
}
