import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin/guard";
import { logAdmin } from "@/lib/admin/log";
import { createClient } from "@/lib/supabase/server";

/** DELETE /api/admin/apply-links/:id — 설문 링크 취소(revoked_at). 이미 응답한 링크는 취소할 수 없다(응답은 상담 신청에 남는다) */
export async function DELETE(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const me = await requireAdmin();
  if (!me) return NextResponse.json({ ok: false, message: "관리자만 사용할 수 있습니다." }, { status: 403 });
  const { id } = await ctx.params;
  const supabase = await createClient();
  const { data, error } = await supabase.from("apply_links").update({ revoked_at: new Date().toISOString() }).eq("id", id).is("used_at", null).is("revoked_at", null).select("id");
  if (error) {
    console.error("[admin/apply-links]", error);
    return NextResponse.json({ ok: false, message: "취소하지 못했습니다." }, { status: 500 });
  }
  if (!data?.length) return NextResponse.json({ ok: false, message: "이미 응답했거나 취소된 링크입니다." }, { status: 409 });
  await logAdmin(me.id, "apply_link.revoke", id);
  return NextResponse.json({ ok: true });
}
