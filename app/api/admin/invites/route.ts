import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/admin/guard";
import { createClient } from "@/lib/supabase/server";
import { sendInviteCode } from "@/lib/notify";
import { normalizePhone } from "@/lib/phone";
import { logAdmin } from "@/lib/admin/log";

/**
 * POST /api/admin/invites { inquiryId?, name?, phone?, email? }
 * → DB 함수 issue_invite_code(30일 만료) 로 코드 생성. 이메일이 있고 RESEND_API_KEY 가 있으면 발송(구조만, 없으면 표시용).
 */
const Body = z.object({
  inquiryId: z.string().uuid().optional(),
  name: z.string().trim().max(50).optional(),
  phone: z.string().trim().max(30).optional(),
  email: z.string().trim().email().optional().or(z.literal("")),
});

export async function POST(req: Request) {
  const me = await requireAdmin();
  if (!me) return NextResponse.json({ ok: false, message: "관리자만 사용할 수 있습니다." }, { status: 403 });
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ ok: false, message: "입력값을 확인해 주세요." }, { status: 400 });
  const { inquiryId, name, phone, email } = parsed.data;

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("issue_invite_code", {
    p_inquiry: inquiryId ?? null,
    p_name: name || null,
    p_phone: phone ? (normalizePhone(phone) ?? phone) : null,
  });
  if (error || !data) {
    console.error("[admin/invites]", error);
    return NextResponse.json({ ok: false, message: "초대코드를 발급하지 못했습니다." }, { status: 500 });
  }
  const code = data as { code: string; expires_at: string | null };
  await logAdmin(me.id, "invite.issue", code.code, { inquiryId: inquiryId ?? null, name: name ?? null });
  const notify = await sendInviteCode({ to: email || null, name, code: code.code, expiresAt: code.expires_at?.slice(0, 10) });
  return NextResponse.json({ ok: true, code: code.code, expiresAt: code.expires_at, notify });
}
