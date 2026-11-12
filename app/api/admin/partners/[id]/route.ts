import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/admin/guard";
import { logAdmin } from "@/lib/admin/log";
import { PARTNER_STATUSES } from "@/lib/partner/types";
import { createClient } from "@/lib/supabase/server";

/** PATCH /api/admin/partners/:id { memo?, status? } — 제휴문의 메모·상태 변경 (RLS admin 정책) + 관리자 로그 */
const Body = z.object({
  memo: z.string().max(2000).optional(),
  status: z.enum(PARTNER_STATUSES).optional(),
});

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const me = await requireAdmin();
  if (!me) return NextResponse.json({ ok: false, message: "관리자만 사용할 수 있습니다." }, { status: 403 });
  const { id } = await ctx.params;
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ ok: false, message: "입력값을 확인해 주세요." }, { status: 400 });

  const supabase = await createClient();
  const { error } = await supabase.from("partner_inquiries").update(parsed.data).eq("id", id);
  if (error) {
    console.error("[admin/partners]", error);
    return NextResponse.json({ ok: false, message: "저장하지 못했습니다." }, { status: 500 });
  }
  await logAdmin(me.id, "partner.update", id, { status: parsed.data.status });
  return NextResponse.json({ ok: true });
}
