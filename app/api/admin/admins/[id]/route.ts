import { NextResponse } from "next/server";
import { z } from "zod";
import { OWNER_ONLY_MESSAGE, requireOwner } from "@/lib/admin/guard";
import { logAdmin } from "@/lib/admin/log";
import { createClient } from "@/lib/supabase/server";

/**
 * PATCH /api/admin/admins/[id] { role?: "admin" | "member", status?: "active" | "paused" } — 주관리자 전용 (M12)
 * role=member 는 관리자 권한 해제(회원 계정은 남는다). status=paused 는 정지(어드민 접속 즉시 차단).
 * 본인과 다른 주관리자는 바꿀 수 없다.
 */
const Body = z.object({ role: z.enum(["admin", "member"]).optional(), status: z.enum(["active", "paused"]).optional() }).refine((b) => b.role || b.status, { message: "변경할 값이 없습니다." });

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const me = await requireOwner();
  if (!me) return NextResponse.json({ ok: false, message: OWNER_ONLY_MESSAGE }, { status: 403 });
  const { id } = await ctx.params;
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!/^[0-9a-f-]{36}$/i.test(id) || !parsed.success) return NextResponse.json({ ok: false, message: "잘못된 요청입니다." }, { status: 400 });
  if (id === me.id) return NextResponse.json({ ok: false, message: "본인 계정은 바꿀 수 없습니다." }, { status: 400 });
  const supabase = await createClient();
  const { data: target } = await supabase.from("members").select("id, email, role, status").eq("id", id).maybeSingle();
  if (!target) return NextResponse.json({ ok: false, message: "계정을 찾을 수 없습니다." }, { status: 404 });
  if (target.role === "owner") return NextResponse.json({ ok: false, message: "주관리자 계정은 바꿀 수 없습니다." }, { status: 400 });
  const { error } = await supabase.from("members").update(parsed.data).eq("id", id);
  if (error) return NextResponse.json({ ok: false, message: "저장하지 못했습니다." }, { status: 500 });
  if (parsed.data.role) await logAdmin(me.id, "admin.role", id, { email: target.email, from: target.role, to: parsed.data.role });
  if (parsed.data.status) await logAdmin(me.id, "admin.status", id, { email: target.email, status: parsed.data.status });
  return NextResponse.json({ ok: true });
}
