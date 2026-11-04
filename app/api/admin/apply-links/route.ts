import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/admin/guard";
import { logAdmin } from "@/lib/admin/log";
import { DEFAULT_LINK_DAYS, applyLinkUrl, newToken } from "@/lib/apply/links";
import { createClient } from "@/lib/supabase/server";

/**
 * POST /api/admin/apply-links { name, memo?, days? } → { ok, link: { id, token, url, expiresAt } }
 * 상담 전 설문 공용 비밀 링크 만들기(관리자). 전화 상담을 마친 분들에게 전달하면 로그인 없이 누구나 작성한다. RLS "admin apply links".
 */
const Body = z.object({
  name: z.string().trim().min(1, "링크 이름을 적어 주세요.").max(60),
  memo: z.string().trim().max(500).optional().default(""),
  days: z.number().int().min(1).max(365).optional().default(DEFAULT_LINK_DAYS),
});

export async function POST(req: Request) {
  const me = await requireAdmin();
  if (!me) return NextResponse.json({ ok: false, message: "관리자만 사용할 수 있습니다." }, { status: 403 });
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ ok: false, message: parsed.error.issues[0]?.message ?? "입력값을 확인해 주세요." }, { status: 400 });
  const { name, memo, days } = parsed.data;

  const supabase = await createClient();
  const token = newToken();
  const expiresAt = new Date(Date.now() + days * 86_400_000).toISOString();
  const { data, error } = await supabase
    .from("apply_links")
    .insert({ token, name, memo: memo || null, created_by: me.id, expires_at: expiresAt })
    .select("id, token, expires_at")
    .single();
  if (error || !data) {
    console.error("[admin/apply-links]", error);
    return NextResponse.json({ ok: false, message: "설문 링크를 만들지 못했습니다." }, { status: 500 });
  }
  const link = data as { id: string; token: string; expires_at: string };
  await logAdmin(me.id, "apply_link.issue", link.id, { name, days });
  return NextResponse.json({ ok: true, link: { id: link.id, token: link.token, url: applyLinkUrl(link.token), expiresAt: link.expires_at } });
}
