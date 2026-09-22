import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/admin/guard";
import { createClient } from "@/lib/supabase/server";

/** PATCH /api/admin/members/[id] { memo?, status? } — 회원 메모·상태 변경 (관리자 RLS) */
const Body = z.object({ memo: z.string().max(2000).optional(), status: z.enum(["active", "paused", "withdrawn"]).optional() });

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const me = await requireAdmin();
  if (!me) return NextResponse.json({ ok: false, message: "관리자만 사용할 수 있습니다." }, { status: 403 });
  const { id } = await ctx.params;
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!/^[0-9a-f-]{36}$/i.test(id) || !parsed.success) return NextResponse.json({ ok: false, message: "잘못된 요청입니다." }, { status: 400 });
  if (id === me.id && parsed.data.status && parsed.data.status !== "active") return NextResponse.json({ ok: false, message: "본인 계정은 휴면·탈퇴 처리할 수 없습니다." }, { status: 400 });
  const supabase = await createClient();
  const { error } = await supabase.from("members").update(parsed.data).eq("id", id);
  if (error) return NextResponse.json({ ok: false, message: "저장하지 못했습니다." }, { status: 500 });
  return NextResponse.json({ ok: true });
}
