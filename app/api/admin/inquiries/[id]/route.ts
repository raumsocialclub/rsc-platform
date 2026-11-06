import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/admin/guard";
import { createClient } from "@/lib/supabase/server";

/** PATCH /api/admin/inquiries/:id { memo?, status? } — 상담 메모·상태 변경 (RLS admin 정책) */
const Body = z.object({
  memo: z.string().max(2000).optional(),
  status: z.enum(["pending", "contacted", "invited", "closed"]).optional(),
});

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const me = await requireAdmin();
  if (!me) return NextResponse.json({ ok: false, message: "관리자만 사용할 수 있습니다." }, { status: 403 });
  const { id } = await ctx.params;
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ ok: false, message: "입력값을 확인해 주세요." }, { status: 400 });

  const supabase = await createClient();
  const { error } = await supabase.from("inquiries").update(parsed.data).eq("id", id);
  if (error) {
    console.error("[admin/inquiries]", error);
    return NextResponse.json({ ok: false, message: "저장하지 못했습니다." }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
