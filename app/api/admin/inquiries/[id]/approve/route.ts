import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/admin/guard";
import { logAdmin } from "@/lib/admin/log";
import { isJoinRequest } from "@/lib/inquiries/join";
import { createClient } from "@/lib/supabase/server";

/**
 * POST /api/admin/inquiries/:id/approve { approve: boolean } — 가입 신청(프로필 진단 응답) 승인 / 승인 취소 (2026-11-23).
 * 승인하면 approved_at = now(), approved_by = 나. 취소하면 둘 다 null. 상담 상태(status)는 건드리지 않는다. 관리자 활동 로그에 남긴다.
 */
const Body = z.object({ approve: z.boolean() });

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const me = await requireAdmin();
  if (!me) return NextResponse.json({ ok: false, message: "관리자만 사용할 수 있습니다." }, { status: 403 });
  const { id } = await ctx.params;
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ ok: false, message: "입력값을 확인해 주세요." }, { status: 400 });

  const supabase = await createClient();
  const { data: row } = await supabase.from("inquiries").select("id, answers, approved_at").eq("id", id).maybeSingle();
  if (!row) return NextResponse.json({ ok: false, message: "신청을 찾을 수 없습니다." }, { status: 404 });
  if (!isJoinRequest(row as { answers: { form?: string } })) return NextResponse.json({ ok: false, message: "가입 신청(프로필 진단 응답)만 승인할 수 있습니다." }, { status: 400 });

  const approvedAt = parsed.data.approve ? new Date().toISOString() : null;
  const { error } = await supabase.from("inquiries").update({ approved_at: approvedAt, approved_by: parsed.data.approve ? me.id : null }).eq("id", id);
  if (error) {
    console.error("[admin/inquiries/approve]", error);
    return NextResponse.json({ ok: false, message: "저장하지 못했습니다." }, { status: 500 });
  }
  await logAdmin(me.id, parsed.data.approve ? "join.approve" : "join.unapprove", id);
  return NextResponse.json({ ok: true, approvedAt });
}
