import { NextResponse } from "next/server";
import { z } from "zod";
import { logAdmin } from "@/lib/admin/log";
import { hashInviteToken, isTokenShape } from "@/lib/admins/invite";
import { describeAuthError } from "@/lib/auth/errors";
import { createAdminClient, hasServiceRoleKey } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

/**
 * POST /api/admin-invite/accept { token, name, password } — 초대 링크로 관리자 계정 만들기 (로그인 불필요, M12).
 * - 토큰은 해시로 조회. 만료·사용·취소된 초대는 거부 (48시간 · 1회용)
 * - 같은 이메일의 회원이 이미 있으면 계정을 새로 만들지 않고 역할만 부관리자로 올린다 (기존 비밀번호로 로그인)
 * - 없으면 service role 로 계정을 만든다. user_metadata.admin_invite(+app_metadata) 를 보고 DB 트리거가 초대코드 없이 members 행(role=admin)을 만들고 초대를 사용 처리한다
 * - 성공하면 바로 로그인 세션을 심는다
 */
const Body = z.object({
  token: z.string().trim(),
  name: z.string().trim().min(1, "이름을 입력해 주세요.").max(60),
  password: z.string().min(8, "비밀번호는 8자 이상이어야 합니다.").max(72),
});

export async function POST(req: Request) {
  if (!hasServiceRoleKey()) return NextResponse.json({ ok: false, message: "서버 설정(SUPABASE_SERVICE_ROLE_KEY)이 비어 있어 초대를 처리할 수 없습니다." }, { status: 500 });
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ ok: false, message: parsed.error.issues[0]?.message ?? "입력값을 확인해 주세요." }, { status: 400 });
  const { token, name, password } = parsed.data;
  if (!isTokenShape(token)) return NextResponse.json({ ok: false, message: "초대 링크가 올바르지 않습니다." }, { status: 400 });

  const admin = createAdminClient();
  const { data: inv } = await admin.from("admin_invites").select("id, email, name, role, expires_at, used_at, revoked_at, invited_by").eq("token_hash", hashInviteToken(token)).maybeSingle();
  if (!inv) return NextResponse.json({ ok: false, message: "초대 링크가 올바르지 않습니다." }, { status: 404 });
  if (inv.used_at) return NextResponse.json({ ok: false, message: "이미 사용된 초대 링크입니다. 로그인해 주세요." }, { status: 409 });
  if (inv.revoked_at) return NextResponse.json({ ok: false, message: "취소된 초대입니다. 주관리자에게 다시 요청해 주세요." }, { status: 409 });
  if (new Date(inv.expires_at) < new Date()) return NextResponse.json({ ok: false, message: "초대 링크가 만료되었습니다(48시간). 주관리자에게 다시 요청해 주세요." }, { status: 409 });

  const email = String(inv.email).toLowerCase();
  const { data: existing } = await admin.from("members").select("id, role, status").ilike("email", email).maybeSingle();

  if (existing) {
    // 기존 회원 → 역할만 올림. 비밀번호는 바꾸지 않는다 (기존 방식으로 로그인)
    const { error } = await admin.from("members").update({ role: inv.role, status: "active", name: name || undefined }).eq("id", existing.id);
    if (error) return NextResponse.json({ ok: false, message: "권한을 부여하지 못했습니다." }, { status: 500 });
    await admin.from("admin_invites").update({ used_at: new Date().toISOString(), used_by: existing.id }).eq("id", inv.id);
    await logAdmin(existing.id, "admin.accept", inv.id, { email, existingMember: true });
    // 기존 계정은 여기서 비밀번호로 로그인 시도 (틀리면 로그인 화면으로 안내)
    const supabase = await createClient();
    const { error: loginErr } = await supabase.auth.signInWithPassword({ email, password });
    if (loginErr) return NextResponse.json({ ok: true, existingMember: true, loggedIn: false, message: "관리자 권한이 부여되었습니다. 기존 비밀번호로 로그인해 주세요." });
    await admin.from("members").update({ last_login_at: new Date().toISOString() }).eq("id", existing.id);
    return NextResponse.json({ ok: true, existingMember: true, loggedIn: true });
  }

  const created = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    // 초대 id 는 user_metadata 로 넘긴다: GoTrue 가 app_metadata 를 INSERT 뒤에 붙이는 경우가 있어 트리거가 못 읽는다.
    // 트리거는 초대 이메일 == 계정 이메일 까지 확인하므로 남이 이 값을 흉내 내도 자기 이메일로는 관리자가 될 수 없다.
    user_metadata: { name, admin_invite: inv.id },
    app_metadata: { admin_invite: inv.id },
  });
  if (created.error || !created.data.user) {
    const raw = created.error?.message ?? "";
    console.error("[admin-invite/accept] createUser", created.error);
    const msg = raw.includes("ADMIN_INVITE_INVALID") ? "초대가 더 이상 유효하지 않습니다." : raw.toLowerCase().includes("already") ? "이미 가입된 이메일입니다. 로그인해 주세요." : describeAuthError(raw, "signup");
    return NextResponse.json({ ok: false, message: msg }, { status: 400 });
  }
  const uid = created.data.user.id;
  // 트리거가 members 행을 만들지 못한 예외 대비 (초대는 트리거에서 used 처리)
  const { data: m } = await admin.from("members").select("id, role").eq("id", uid).maybeSingle();
  if (!m) await admin.from("members").upsert({ id: uid, name, email, role: inv.role, provider: "email" });
  await admin.from("admin_invites").update({ used_at: new Date().toISOString(), used_by: uid }).eq("id", inv.id).is("used_at", null);
  await logAdmin(uid, "admin.accept", inv.id, { email, existingMember: false });

  const supabase = await createClient();
  const { error: loginErr } = await supabase.auth.signInWithPassword({ email, password });
  if (!loginErr) await admin.from("members").update({ last_login_at: new Date().toISOString() }).eq("id", uid);
  return NextResponse.json({ ok: true, existingMember: false, loggedIn: !loginErr });
}
