import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/admin/guard";
import { logAdmin } from "@/lib/admin/log";
import { createClient } from "@/lib/supabase/server";

/**
 * PATCH /api/admin/surveys/:id { closed?: boolean, name?, memo? } — 설문 마감/다시 열기, 이름·메모 수정.
 * 마감하면 그 링크로는 더 이상 답할 수 없고, 받은 응답은 남는다. 다시 열면 마감일(closes_at)이 지났어도 열리도록 마감일을 지운다.
 */
const Body = z.object({
  closed: z.boolean().optional(),
  name: z.string().trim().min(1).max(80).optional(),
  memo: z.string().trim().max(500).optional(),
});

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const me = await requireAdmin();
  if (!me) return NextResponse.json({ ok: false, message: "관리자만 사용할 수 있습니다." }, { status: 403 });
  const { id } = await ctx.params;
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ ok: false, message: "입력값을 확인해 주세요." }, { status: 400 });
  const patch: Record<string, unknown> = {};
  if (parsed.data.closed === true) patch.closed_at = new Date().toISOString();
  if (parsed.data.closed === false) { patch.closed_at = null; patch.closes_at = null; }
  if (parsed.data.name !== undefined) patch.name = parsed.data.name;
  if (parsed.data.memo !== undefined) patch.memo = parsed.data.memo || null;
  if (!Object.keys(patch).length) return NextResponse.json({ ok: false, message: "바꿀 내용이 없습니다." }, { status: 400 });

  const supabase = await createClient();
  const { data, error } = await supabase.from("surveys").update(patch).eq("id", id).select("id");
  if (error) {
    console.error("[admin/surveys]", error);
    return NextResponse.json({ ok: false, message: "저장하지 못했습니다." }, { status: 500 });
  }
  if (!data?.length) return NextResponse.json({ ok: false, message: "설문을 찾을 수 없습니다." }, { status: 404 });
  await logAdmin(me.id, parsed.data.closed === true ? "survey.close" : parsed.data.closed === false ? "survey.reopen" : "survey.update", id, patch);
  return NextResponse.json({ ok: true });
}
