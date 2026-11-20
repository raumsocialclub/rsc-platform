import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/admin/guard";
import { logAdmin } from "@/lib/admin/log";
import { createClient } from "@/lib/supabase/server";

/** PATCH /api/admin/marketing/:id { withdrawn: boolean } — 마케팅 수신 동의 철회(발송 중단) 또는 철회 취소(잘못 눌렀을 때). RLS admin 정책 + 관리자 로그 */
const Body = z.object({ withdrawn: z.boolean() });

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const me = await requireAdmin();
  if (!me) return NextResponse.json({ ok: false, message: "관리자만 사용할 수 있습니다." }, { status: 403 });
  const { id } = await ctx.params;
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ ok: false, message: "입력값을 확인해 주세요." }, { status: 400 });
  const supabase = await createClient();
  const patch = parsed.data.withdrawn ? { withdrawn_at: new Date().toISOString(), withdrawn_by: me.id } : { withdrawn_at: null, withdrawn_by: null };
  const { error } = await supabase.from("marketing_consents").update(patch).eq("id", id);
  if (error) {
    console.error("[admin/marketing]", error);
    return NextResponse.json({ ok: false, message: "저장하지 못했습니다." }, { status: 500 });
  }
  await logAdmin(me.id, parsed.data.withdrawn ? "marketing.withdraw" : "marketing.restore", id);
  return NextResponse.json({ ok: true });
}
