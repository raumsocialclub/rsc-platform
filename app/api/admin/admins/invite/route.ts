import { NextResponse } from "next/server";
import { z } from "zod";
import { OWNER_ONLY_MESSAGE, requireOwner } from "@/lib/admin/guard";
import { logAdmin } from "@/lib/admin/log";
import { ADMIN_INVITE_HOURS, inviteLink, newInviteToken } from "@/lib/admins/invite";
import { sendAdminInvite } from "@/lib/notify";
import { fmtFull } from "@/lib/programs/format";
import { createClient } from "@/lib/supabase/server";

/**
 * POST /api/admin/admins/invite { name, email } — 부관리자 초대 (주관리자 전용, M12).
 * 같은 이메일의 대기 중 초대는 취소하고 새로 만든다. 링크는 응답에 담고(화면에서 복사), 이메일 키가 있으면 발송한다.
 */
const Body = z.object({ name: z.string().trim().max(60).default(""), email: z.string().trim().email("이메일 형식을 확인해 주세요.").transform((v) => v.toLowerCase()) });

export async function POST(req: Request) {
  const me = await requireOwner();
  if (!me) return NextResponse.json({ ok: false, message: OWNER_ONLY_MESSAGE }, { status: 403 });
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ ok: false, message: parsed.error.issues[0]?.message ?? "입력값을 확인해 주세요." }, { status: 400 });
  const { name, email } = parsed.data;
  const supabase = await createClient();

  const { data: existing } = await supabase.from("members").select("id, role, status").ilike("email", email).maybeSingle();
  if (existing && (existing.role === "admin" || existing.role === "owner") && existing.status === "active") {
    return NextResponse.json({ ok: false, message: "이미 관리자인 계정입니다." }, { status: 409 });
  }

  const now = new Date().toISOString();
  await supabase.from("admin_invites").update({ revoked_at: now }).eq("email", email).is("used_at", null).is("revoked_at", null);
  const { token, hash } = newInviteToken();
  const expires_at = new Date(Date.now() + ADMIN_INVITE_HOURS * 3600_000).toISOString();
  const { data: inv, error } = await supabase.from("admin_invites").insert({ email, name, role: "admin", token_hash: hash, invited_by: me.id, expires_at }).select("id").single();
  if (error || !inv) {
    console.error("[admin/admins/invite]", error);
    return NextResponse.json({ ok: false, message: "초대를 만들지 못했습니다." }, { status: 500 });
  }
  const link = inviteLink(token);
  const mail = await sendAdminInvite({ to: email, name, link, invitedBy: me.name || me.email, expiresAt: fmtFull(expires_at) });
  await logAdmin(me.id, "admin.invite", inv.id, { email, name, existingMember: !!existing, mailed: mail.sent });
  return NextResponse.json({ ok: true, id: inv.id, link, expiresAt: expires_at, mailed: mail.sent, mailReason: mail.reason ?? null, existingMember: !!existing });
}
