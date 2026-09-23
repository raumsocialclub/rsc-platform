import { NextResponse } from "next/server";
import { z } from "zod";
import { describeAuthError } from "@/lib/auth/errors";
import { getSettings } from "@/lib/settings/get";
import { clientIp } from "@/lib/settings/ip";
import { createAdminClient, hasServiceRoleKey } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

/**
 * POST /api/auth/login { email, password } — 이메일 로그인 + 연속 실패 잠금(일반 설정 → 보안).
 * 성공하면 서버가 세션 쿠키를 심는다. 잠금은 이메일과 IP 각각 센다.
 */
const Body = z.object({ email: z.string().trim().email(), password: z.string().min(1) });

export async function POST(req: Request) {
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ ok: false, message: "이메일과 비밀번호를 입력해 주세요." }, { status: 400 });
  const email = parsed.data.email.toLowerCase();
  const settings = await getSettings();
  const maxFails = Number(settings.loginMaxFails) || 0;
  const lockMin = Math.max(1, Number(settings.loginLockMinutes) || 15);
  const ip = clientIp(req.headers);
  const keys = [`email:${email}`, ip ? `ip:${ip}` : null].filter((k): k is string => !!k);
  const useLock = maxFails > 0 && hasServiceRoleKey();
  const admin = useLock ? createAdminClient() : null;

  if (admin) {
    const { data: rows } = await admin.from("login_attempts").select("key, fails, locked_until").in("key", keys);
    const locked = (rows ?? []).find((r) => r.locked_until && new Date(r.locked_until) > new Date());
    if (locked) {
      const min = Math.ceil((new Date(locked.locked_until).getTime() - Date.now()) / 60000);
      return NextResponse.json({ ok: false, message: `로그인 시도가 너무 많습니다. ${min}분 후 다시 시도해 주세요.` }, { status: 429 });
    }
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password: parsed.data.password });
  if (error) {
    if (admin) {
      for (const key of keys) {
        const { data: row } = await admin.from("login_attempts").select("fails").eq("key", key).maybeSingle();
        const fails = (row?.fails ?? 0) + 1;
        const locked_until = fails >= maxFails ? new Date(Date.now() + lockMin * 60000).toISOString() : null;
        await admin.from("login_attempts").upsert({ key, fails: locked_until ? 0 : fails, locked_until, updated_at: new Date().toISOString() });
      }
    }
    return NextResponse.json({ ok: false, message: describeAuthError(error.message, "login") }, { status: 401 });
  }
  if (admin) await admin.from("login_attempts").delete().in("key", keys);
  // 역할(관리자면 /admin 으로 보냄) + 마지막 로그인 시각 (M12)
  const { data: { user } } = await supabase.auth.getUser();
  let role = "member";
  if (user) {
    const { data: m } = await supabase.from("members").select("role").eq("id", user.id).maybeSingle();
    role = (m?.role as string | undefined) ?? "member";
    if (admin) await admin.from("members").update({ last_login_at: new Date().toISOString() }).eq("id", user.id);
  }
  return NextResponse.json({ ok: true, role });
}
