import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/admin/guard";
import { logAdmin } from "@/lib/admin/log";
import { DEFAULT_LINK_DAYS, applyLinkUrl, newToken } from "@/lib/apply/links";
import { normalizePhone } from "@/lib/phone";
import { createClient } from "@/lib/supabase/server";

/**
 * POST /api/admin/apply-links { name?, phone?, memo?, inquiryId?, days? } → { ok, link: { id, token, url, expiresAt } }
 * 상담 전 설문 비밀 링크 발급(관리자). 전화 상담 후 니즈가 확실한 분에게 전달한다. RLS "admin apply links".
 * inquiryId 를 주면 그 상담 신청에 연결돼 상세 화면에서 링크 상태·응답을 바로 볼 수 있다.
 */
const Body = z.object({
  name: z.string().trim().max(50).optional().default(""),
  phone: z.string().trim().max(30).optional().default(""),
  memo: z.string().trim().max(500).optional().default(""),
  inquiryId: z.string().uuid().optional(),
  days: z.number().int().min(1).max(180).optional().default(DEFAULT_LINK_DAYS),
});

export async function POST(req: Request) {
  const me = await requireAdmin();
  if (!me) return NextResponse.json({ ok: false, message: "관리자만 사용할 수 있습니다." }, { status: 403 });
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ ok: false, message: "입력값을 확인해 주세요." }, { status: 400 });
  const { name, phone, memo, inquiryId, days } = parsed.data;
  const normPhone = phone ? normalizePhone(phone) ?? phone : null;

  const supabase = await createClient();
  const token = newToken();
  const expiresAt = new Date(Date.now() + days * 86_400_000).toISOString();
  const { data, error } = await supabase
    .from("apply_links")
    .insert({ token, name, phone: normPhone, memo: memo || null, inquiry_id: inquiryId ?? null, created_by: me.id, expires_at: expiresAt })
    .select("id, token, expires_at")
    .single();
  if (error || !data) {
    console.error("[admin/apply-links]", error);
    return NextResponse.json({ ok: false, message: "설문 링크를 만들지 못했습니다." }, { status: 500 });
  }
  const link = data as { id: string; token: string; expires_at: string };
  await logAdmin(me.id, "apply_link.issue", link.id, { inquiryId: inquiryId ?? null, name: name || null });
  return NextResponse.json({ ok: true, link: { id: link.id, token: link.token, url: applyLinkUrl(link.token), expiresAt: link.expires_at } });
}
