import { NextResponse } from "next/server";
import { z } from "zod";
import { logAdmin } from "@/lib/admin/log";
import { createPasswordReset } from "@/lib/admins/reset";
import { sendAdminPasswordReset } from "@/lib/notify";
import { fmtFull } from "@/lib/programs/format";
import { createAdminClient, hasServiceRoleKey } from "@/lib/supabase/admin";

/**
 * POST /api/auth/reset-request { email } — 로그인 화면 "비밀번호 찾기" (M16). 로그인 불필요.
 * 이메일이 활동 중인 관리자 계정이고 메일 발송이 설정돼 있으면 재설정 링크를 메일로 보낸다. 링크는 응답에 절대 담지 않는다.
 * 계정 유무와 관계없이 같은 응답을 돌려 이메일 존재를 추측할 수 없게 하고, 같은 이메일은 5분에 한 번만 만든다.
 */
const Body = z.object({ email: z.string().trim().email().transform((v) => v.toLowerCase()) });
const GENERIC = "등록된 관리자 이메일이면 재설정 링크를 보냈습니다. 메일이 오지 않으면 주관리자에게 링크를 요청해 주세요.";
const COOLDOWN_MS = 5 * 60_000;

export async function POST(req: Request) {
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ ok: false, message: "이메일 형식을 확인해 주세요." }, { status: 400 });
  const { email } = parsed.data;
  if (!hasServiceRoleKey() || !process.env.RESEND_API_KEY) return NextResponse.json({ ok: true, message: GENERIC });

  const admin = createAdminClient();
  const { data: m } = await admin.from("members").select("id, name, email, role, status").ilike("email", email).maybeSingle();
  if (m && m.email && (m.role === "admin" || m.role === "owner") && m.status === "active") {
    const { data: recent } = await admin.from("admin_invites").select("created_at").eq("email", email).eq("kind", "reset").is("revoked_at", null).is("used_at", null).order("created_at", { ascending: false }).limit(1).maybeSingle();
    const tooSoon = recent && Date.now() - new Date(recent.created_at).getTime() < COOLDOWN_MS;
    if (!tooSoon) {
      const reset = await createPasswordReset(admin, { id: m.id, email: m.email, name: m.name, role: m.role }, null);
      if (reset) {
        const mail = await sendAdminPasswordReset({ to: m.email, name: m.name, link: reset.link, expiresAt: fmtFull(reset.expiresAt) });
        await logAdmin(m.id, "admin.reset.request", m.id, { email, inviteId: reset.id, mailed: mail.sent, reason: mail.reason ?? null });
      }
    }
  }
  return NextResponse.json({ ok: true, message: GENERIC });
}
