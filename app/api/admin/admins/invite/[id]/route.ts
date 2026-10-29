import { NextResponse } from "next/server";
import { OWNER_ONLY_MESSAGE, requireOwner } from "@/lib/admin/guard";
import { logAdmin } from "@/lib/admin/log";
import { createClient } from "@/lib/supabase/server";

/** DELETE /api/admin/admins/invite/[id] — 대기 중 초대 취소 (주관리자 전용) */
export async function DELETE(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const me = await requireOwner();
  if (!me) return NextResponse.json({ ok: false, message: OWNER_ONLY_MESSAGE }, { status: 403 });
  const { id } = await ctx.params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) return NextResponse.json({ ok: false, message: "잘못된 요청입니다." }, { status: 400 });
  const supabase = await createClient();
  const { data, error } = await supabase.from("admin_invites").update({ revoked_at: new Date().toISOString() }).eq("id", id).is("used_at", null).is("revoked_at", null).select("email").maybeSingle();
  if (error) return NextResponse.json({ ok: false, message: "취소하지 못했습니다." }, { status: 500 });
  if (!data) return NextResponse.json({ ok: false, message: "이미 사용됐거나 취소된 초대입니다." }, { status: 409 });
  await logAdmin(me.id, "admin.invite.revoke", id, { email: data.email });
  return NextResponse.json({ ok: true });
}
