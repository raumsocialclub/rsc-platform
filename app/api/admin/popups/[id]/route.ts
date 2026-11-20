import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/admin/guard";
import { logAdmin } from "@/lib/admin/log";
import { revalidateHome, toRow } from "@/lib/popups/admin";
import { PopupInputSchema, PopupPatchSchema, firstIssue } from "@/lib/popups/schema";
import { createClient } from "@/lib/supabase/server";

type Ctx = { params: Promise<{ id: string }> };
const Id = z.string().uuid();
const forbidden = () => NextResponse.json({ ok: false, message: "관리자만 사용할 수 있습니다." }, { status: 403 });
const badId = () => NextResponse.json({ ok: false, message: "잘못된 요청입니다." }, { status: 400 });

/** PUT /api/admin/popups/[id] — 전체 저장 */
export async function PUT(req: Request, ctx: Ctx) {
  const me = await requireAdmin();
  if (!me) return forbidden();
  const { id } = await ctx.params;
  if (!Id.safeParse(id).success) return badId();
  const parsed = PopupInputSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ ok: false, message: firstIssue(parsed.error) }, { status: 400 });
  const supabase = await createClient();
  const { data, error } = await supabase.from("popups").update(toRow(parsed.data)).eq("id", id).select("id").maybeSingle();
  if (error) {
    console.error("[admin/popups PUT]", error);
    return NextResponse.json({ ok: false, message: "저장하지 못했습니다. 잠시 후 다시 시도해 주세요." }, { status: 500 });
  }
  if (!data) return NextResponse.json({ ok: false, message: "팝업을 찾을 수 없습니다." }, { status: 404 });
  await logAdmin(me.id, "popup.update", id, { title: parsed.data.title, ratio: parsed.data.ratio, active: parsed.data.active });
  revalidateHome();
  return NextResponse.json({ ok: true });
}

/** PATCH /api/admin/popups/[id] { active } — 켜기/끄기 */
export async function PATCH(req: Request, ctx: Ctx) {
  const me = await requireAdmin();
  if (!me) return forbidden();
  const { id } = await ctx.params;
  if (!Id.safeParse(id).success) return badId();
  const parsed = PopupPatchSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return badId();
  const supabase = await createClient();
  const { data, error } = await supabase.from("popups").update({ active: parsed.data.active }).eq("id", id).select("id").maybeSingle();
  if (error) return NextResponse.json({ ok: false, message: "변경하지 못했습니다." }, { status: 500 });
  if (!data) return NextResponse.json({ ok: false, message: "팝업을 찾을 수 없습니다." }, { status: 404 });
  await logAdmin(me.id, "popup.active", id, { active: parsed.data.active });
  revalidateHome();
  return NextResponse.json({ ok: true });
}

/** DELETE /api/admin/popups/[id] */
export async function DELETE(_req: Request, ctx: Ctx) {
  const me = await requireAdmin();
  if (!me) return forbidden();
  const { id } = await ctx.params;
  if (!Id.safeParse(id).success) return badId();
  const supabase = await createClient();
  const { data, error } = await supabase.from("popups").delete().eq("id", id).select("title").maybeSingle();
  if (error) return NextResponse.json({ ok: false, message: "삭제하지 못했습니다." }, { status: 500 });
  if (!data) return NextResponse.json({ ok: false, message: "팝업을 찾을 수 없습니다." }, { status: 404 });
  await logAdmin(me.id, "popup.delete", id, { title: data.title });
  revalidateHome();
  return NextResponse.json({ ok: true });
}
