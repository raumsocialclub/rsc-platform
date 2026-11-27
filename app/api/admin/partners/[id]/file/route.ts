import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin/guard";
import { createAdminClient, hasServiceRoleKey } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { PARTNER_FILES_BUCKET, type PartnerFile } from "@/lib/partner/files";

/** GET /api/admin/partners/:id/file?i=0 — 제휴문의 첨부 파일 내려받기(5분짜리 서명 URL 로 이동). 관리자만. */
export async function GET(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const me = await requireAdmin();
  if (!me) return NextResponse.json({ ok: false, message: "관리자만 사용할 수 있습니다." }, { status: 403 });
  const { id } = await ctx.params;
  const i = Number(new URL(req.url).searchParams.get("i") ?? "0");
  const supabase = await createClient();
  const { data: row } = await supabase.from("partner_inquiries").select("files").eq("id", id).maybeSingle();
  const files = ((row as { files?: PartnerFile[] } | null)?.files ?? []) as PartnerFile[];
  const f = Number.isInteger(i) ? files[i] : undefined;
  if (!f) return NextResponse.json({ ok: false, message: "파일이 없습니다." }, { status: 404 });
  const storage = (hasServiceRoleKey() ? createAdminClient() : supabase).storage.from(PARTNER_FILES_BUCKET);
  const { data, error } = await storage.createSignedUrl(f.path, 300, { download: f.name });
  if (error || !data?.signedUrl) {
    console.error("[admin/partners/file]", error);
    return NextResponse.json({ ok: false, message: "파일 주소를 만들지 못했습니다." }, { status: 500 });
  }
  return NextResponse.redirect(data.signedUrl, 302);
}
