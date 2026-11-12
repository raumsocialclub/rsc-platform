import { NextResponse } from "next/server";
import { z } from "zod";
import { logAdmin } from "@/lib/admin/log";
import { hashInviteToken, isTokenShape } from "@/lib/admins/invite";
import { describeResetState } from "@/lib/admins/reset";
import { describeAuthError } from "@/lib/auth/errors";
import { createAdminClient, hasServiceRoleKey } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

/**
 * POST /api/admin-reset { token, password } — 재설정 링크로 관리자 비밀번호 바꾸기 (로그인 불필요, M16).
 * - 토큰은 해시로 조회. kind='reset' 이고 만료·사용·취소가 아니어야 한다 (24시간 · 1회용)
 * - 링크의 이메일로 활동 중인 관리자 계정을 찾아 service role 로 비밀번호를 바꾼다
 * - 성공하면 링크를 사용 처리하고 바로 로그인 세션을 심는다
 */
const Body = z.object({ token: z.string().trim(), password: z.string().min(8, "비밀번호는 8자 이상이어야 합니다.").max(72) });

export async function POST(req: Request) {
  if (!hasServiceRoleKey()) return NextResponse.json({ ok: false, message: "서버 설정(SUPABASE_SERVICE_ROLE_KEY)이 비어 있어 처리할 수 없습니다." }, { status: 500 });
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ ok: false, message: parsed.error.issues[0]?.message ?? "입력값을 확인해 주세요." }, { status: 400 });
  const { token, password } = parsed.data;
  if (!isTokenShape(token)) return NextResponse.json({ ok: false, message: "재설정 링크가 올바르지 않습니다." }, { status: 400 });

  const admin = createAdminClient();
  const { data: inv } = await admin.from("admin_invites").select("id, email, kind, expires_at, used_at, revoked_at").eq("token_hash", hashInviteToken(token)).maybeSingle();
  const bad = describeResetState(inv);
  if (bad) return NextResponse.json({ ok: false, message: `${bad.title}. ${bad.body}` }, { status: inv ? 409 : 404 });

  const email = String(inv!.email).toLowerCase();
  const { data: m } = await admin.from("members").select("id, email, role, status").ilike("email", email).maybeSingle();
  if (!m || (m.role !== "admin" && m.role !== "owner") || m.status !== "active") {
    return NextResponse.json({ ok: false, message: "이 링크로 바꿀 수 있는 관리자 계정이 없습니다. 주관리자에게 문의해 주세요." }, { status: 409 });
  }

  const { error } = await admin.auth.admin.updateUserById(m.id, { password });
  if (error) {
    console.error("[admin-reset] updateUserById", error);
    return NextResponse.json({ ok: false, message: describeAuthError(error.message, "signup") }, { status: 400 });
  }
  const now = new Date().toISOString();
  await admin.from("admin_invites").update({ used_at: now, used_by: m.id }).eq("id", inv!.id).is("used_at", null);
  await logAdmin(m.id, "admin.reset.done", m.id, { email, inviteId: inv!.id });

  const supabase = await createClient();
  const { error: loginErr } = await supabase.auth.signInWithPassword({ email, password });
  if (!loginErr) await admin.from("members").update({ last_login_at: now }).eq("id", m.id);
  return NextResponse.json({ ok: true, loggedIn: !loginErr });
}
