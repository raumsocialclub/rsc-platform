import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/admin/guard";
import { logAdmin } from "@/lib/admin/log";
import { APPLY_STATUSES } from "@/lib/posts/apply";
import { createClient } from "@/lib/supabase/server";

type Ctx = { params: Promise<{ id: string }> };
const Id = z.string().uuid();
const Body = z.object({ status: z.enum(APPLY_STATUSES).optional(), memo: z.string().max(500).optional() });

/** PATCH /api/admin/events/[id] { status?, memo? } — 참여 신청 한 건의 참석 상태(신청·참석 확정·취소)·메모 (M24). 관리자 활동 로그 event.status / event.memo */
export async function PATCH(req: Request, ctx: Ctx) {
  const me = await requireAdmin();
  if (!me) return NextResponse.json({ ok: false, message: "관리자만 사용할 수 있습니다." }, { status: 403 });
  const { id } = await ctx.params;
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!Id.safeParse(id).success || !parsed.success || (parsed.data.status === undefined && parsed.data.memo === undefined)) return NextResponse.json({ ok: false, message: "잘못된 요청입니다." }, { status: 400 });
  const supabase = await createClient();
  const patch: Record<string, unknown> = {};
  if (parsed.data.status !== undefined) Object.assign(patch, { status: parsed.data.status, status_at: new Date().toISOString(), status_by: me.id });
  if (parsed.data.memo !== undefined) patch.memo = parsed.data.memo.trim() || null;
  const { data, error } = await supabase.from("event_applications").update(patch).eq("id", id).select("id, post_id").maybeSingle();
  if (error || !data) {
    console.error("[admin/events PATCH]", error);
    return NextResponse.json({ ok: false, message: error ? "저장하지 못했습니다." : "신청을 찾을 수 없습니다." }, { status: error ? 500 : 404 });
  }
  await logAdmin(me.id, parsed.data.status !== undefined ? "event.status" : "event.memo", id, { post_id: data.post_id, ...parsed.data });
  return NextResponse.json({ ok: true });
}

/** DELETE /api/admin/events/[id] — 참여 신청 한 건 삭제(잘못 들어온 것 정리). 로그 event.delete */
export async function DELETE(_req: Request, ctx: Ctx) {
  const me = await requireAdmin();
  if (!me) return NextResponse.json({ ok: false, message: "관리자만 사용할 수 있습니다." }, { status: 403 });
  const { id } = await ctx.params;
  if (!Id.safeParse(id).success) return NextResponse.json({ ok: false, message: "잘못된 요청입니다." }, { status: 400 });
  const supabase = await createClient();
  const { error } = await supabase.from("event_applications").delete().eq("id", id);
  if (error) return NextResponse.json({ ok: false, message: "삭제하지 못했습니다." }, { status: 500 });
  await logAdmin(me.id, "event.delete", id);
  return NextResponse.json({ ok: true });
}
