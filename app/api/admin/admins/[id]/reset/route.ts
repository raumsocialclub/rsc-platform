import { NextResponse } from "next/server";
import { OWNER_ONLY_MESSAGE, requireOwner } from "@/lib/admin/guard";
import { logAdmin } from "@/lib/admin/log";
import { createPasswordReset } from "@/lib/admins/reset";
import { sendAdminPasswordReset } from "@/lib/notify";
import { fmtFull } from "@/lib/programs/format";
import { createClient } from "@/lib/supabase/server";

/**
 * POST /api/admin/admins/[id]/reset — 관리자 비밀번호 재설정 링크 발급 (주관리자 전용, M16).
 * 링크는 응답에 담아 화면에서 복사해 전달하고, 이메일 키가 있으면 발송도 한다. 24시간 · 1회용.
 * 대상은 활동 중인 관리자(부관리자·주관리자 본인 포함). 일반 회원에게는 발급하지 않는다.
 */
export async function POST(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const me = await requireOwner();
  if (!me) return NextResponse.json({ ok: false, message: OWNER_ONLY_MESSAGE }, { status: 403 });
  const { id } = await ctx.params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) return NextResponse.json({ ok: false, message: "잘못된 요청입니다." }, { status: 400 });
  const supabase = await createClient();
  const { data: target } = await supabase.from("members").select("id, name, email, role, status").eq("id", id).maybeSingle();
  if (!target || !target.email) return NextResponse.json({ ok: false, message: "계정을 찾을 수 없습니다." }, { status: 404 });
  if (target.role !== "admin" && target.role !== "owner") return NextResponse.json({ ok: false, message: "관리자 계정에만 발급할 수 있습니다." }, { status: 400 });
  if (target.status !== "active") return NextResponse.json({ ok: false, message: "정지된 계정입니다. 정지를 해제한 뒤 발급해 주세요." }, { status: 400 });

  const reset = await createPasswordReset(supabase, { id: target.id, email: target.email, name: target.name, role: target.role }, me.id);
  if (!reset) return NextResponse.json({ ok: false, message: "재설정 링크를 만들지 못했습니다." }, { status: 500 });
  const mail = await sendAdminPasswordReset({ to: target.email, name: target.name, link: reset.link, expiresAt: fmtFull(reset.expiresAt) });
  await logAdmin(me.id, "admin.reset.issue", target.id, { email: target.email, inviteId: reset.id, mailed: mail.sent });
  return NextResponse.json({ ok: true, link: reset.link, expiresAt: reset.expiresAt, mailed: mail.sent, mailReason: mail.reason ?? null });
}
