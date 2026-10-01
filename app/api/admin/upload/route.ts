import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin/guard";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
const MAX_BYTES = 10 * 1024 * 1024;
const TYPES: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "image/svg+xml": "svg" };
const BUCKETS = new Set(["site", "programs"]);

/** POST /api/admin/upload?bucket=site|programs (multipart: file) → 공개 URL. 관리자 RLS 로 Storage 에 쓴다. */
export async function POST(req: Request) {
  const me = await requireAdmin();
  if (!me) return NextResponse.json({ ok: false, message: "관리자만 사용할 수 있습니다." }, { status: 403 });
  const bucket = new URL(req.url).searchParams.get("bucket") ?? "site";
  if (!BUCKETS.has(bucket)) return NextResponse.json({ ok: false, message: "잘못된 버킷입니다." }, { status: 400 });
  const form = await req.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File)) return NextResponse.json({ ok: false, message: "파일이 없습니다." }, { status: 400 });
  const ext = TYPES[file.type];
  if (!ext) return NextResponse.json({ ok: false, message: "JPG, PNG, WEBP, SVG 이미지만 올릴 수 있습니다." }, { status: 400 });
  if (file.size > MAX_BYTES) return NextResponse.json({ ok: false, message: "10MB 이하 이미지만 올릴 수 있습니다." }, { status: 400 });
  const path = `${new Date().toISOString().slice(0, 10)}/${crypto.randomUUID()}.${ext}`;
  const supabase = await createClient();
  const { error } = await supabase.storage.from(bucket).upload(path, await file.arrayBuffer(), { contentType: file.type, cacheControl: "31536000" });
  if (error) {
    console.error("[admin/upload]", error);
    return NextResponse.json({ ok: false, message: `업로드하지 못했습니다. Storage 버킷(${bucket}) 설정을 확인해 주세요.` }, { status: 500 });
  }
  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return NextResponse.json({ ok: true, url: data.publicUrl });
}
