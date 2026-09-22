import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/admin/guard";
import { ProgramInputSchema, firstIssue } from "@/lib/programs/schema";
import { saveProgram } from "@/lib/programs/admin";
import { createClient } from "@/lib/supabase/server";

type Ctx = { params: Promise<{ id: string }> };
const Id = z.string().uuid();

/** PUT /api/admin/programs/[id] — 전체 저장 */
export async function PUT(req: Request, ctx: Ctx) {
  const me = await requireAdmin();
  if (!me) return NextResponse.json({ ok: false, message: "관리자만 사용할 수 있습니다." }, { status: 403 });
  const { id } = await ctx.params;
  if (!Id.safeParse(id).success) return NextResponse.json({ ok: false, message: "잘못된 요청입니다." }, { status: 400 });
  const parsed = ProgramInputSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ ok: false, message: firstIssue(parsed.error) }, { status: 400 });

  const supabase = await createClient();
  const result = await saveProgram(supabase, parsed.data, id);
  if ("error" in result) {
    console.error("[admin/programs PUT]", result.error);
    return NextResponse.json({ ok: false, message: "저장하지 못했습니다. 잠시 후 다시 시도해 주세요." }, { status: 500 });
  }
  return NextResponse.json({ ok: true, id });
}

/** PATCH /api/admin/programs/[id] { is_published } — 목록에서 공개/비공개 토글 */
export async function PATCH(req: Request, ctx: Ctx) {
  const me = await requireAdmin();
  if (!me) return NextResponse.json({ ok: false, message: "관리자만 사용할 수 있습니다." }, { status: 403 });
  const { id } = await ctx.params;
  const parsed = z.object({ is_published: z.boolean() }).safeParse(await req.json().catch(() => null));
  if (!Id.safeParse(id).success || !parsed.success) return NextResponse.json({ ok: false, message: "잘못된 요청입니다." }, { status: 400 });
  const supabase = await createClient();
  const { error } = await supabase.from("programs").update({ is_published: parsed.data.is_published }).eq("id", id);
  if (error) return NextResponse.json({ ok: false, message: "변경하지 못했습니다." }, { status: 500 });
  return NextResponse.json({ ok: true });
}

/** DELETE /api/admin/programs/[id] — 예약이 하나도 없는 프로그램만 삭제 */
export async function DELETE(_req: Request, ctx: Ctx) {
  const me = await requireAdmin();
  if (!me) return NextResponse.json({ ok: false, message: "관리자만 사용할 수 있습니다." }, { status: 403 });
  const { id } = await ctx.params;
  if (!Id.safeParse(id).success) return NextResponse.json({ ok: false, message: "잘못된 요청입니다." }, { status: 400 });
  const supabase = await createClient();
  const { count } = await supabase.from("bookings").select("id", { count: "exact", head: true }).eq("program_id", id);
  if (count) return NextResponse.json({ ok: false, message: "예약이 있는 프로그램은 삭제할 수 없습니다. 비공개로 전환해 주세요." }, { status: 409 });
  const { error } = await supabase.from("programs").delete().eq("id", id);
  if (error) return NextResponse.json({ ok: false, message: "삭제하지 못했습니다." }, { status: 500 });
  return NextResponse.json({ ok: true });
}
