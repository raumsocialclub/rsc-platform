import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin/guard";
import { createAdminClient, hasServiceRoleKey } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { MATCH_PHOTO_BUCKET, isPhotoPath } from "@/lib/match/photo";

/** GET /api/admin/inquiries/:id/photo?n=0 — 프로필 진단 응답의 n번째 사진 보기(5분짜리 서명 URL 로 이동). 관리자만. */
export async function GET(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const me = await requireAdmin();
  if (!me) return NextResponse.json({ ok: false, message: "관리자만 사용할 수 있습니다." }, { status: 403 });
  const { id } = await ctx.params;
  const n = Math.max(0, Number(new URL(req.url).searchParams.get("n") ?? 0) || 0); // 몇 번째 사진(0부터). 없으면 첫 장
  const supabase = await createClient();
  const { data: row } = await supabase.from("inquiries").select("answers").eq("id", id).maybeSingle();
  const a = (row as { answers?: { photo?: unknown; photos?: unknown } } | null)?.answers;
  const list: unknown[] = Array.isArray(a?.photos) ? a!.photos : a?.photo ? [a.photo] : [];
  const path = list[n];
  if (!isPhotoPath(path)) return NextResponse.json({ ok: false, message: "사진이 없습니다." }, { status: 404 });
  const storage = (hasServiceRoleKey() ? createAdminClient() : supabase).storage.from(MATCH_PHOTO_BUCKET);
  const { data, error } = await storage.createSignedUrl(path, 300);
  if (error || !data?.signedUrl) {
    console.error("[admin/inquiries/photo]", error);
    return NextResponse.json({ ok: false, message: "사진 주소를 만들지 못했습니다." }, { status: 500 });
  }
  return NextResponse.redirect(data.signedUrl, 302);
}
