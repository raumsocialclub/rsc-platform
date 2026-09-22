import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin/guard";
import { ProgramInputSchema, firstIssue } from "@/lib/programs/schema";
import { saveProgram } from "@/lib/programs/admin";
import { createClient } from "@/lib/supabase/server";

/** POST /api/admin/programs — 새 프로그램 + 회차 생성 */
export async function POST(req: Request) {
  const me = await requireAdmin();
  if (!me) return NextResponse.json({ ok: false, message: "관리자만 사용할 수 있습니다." }, { status: 403 });
  const parsed = ProgramInputSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ ok: false, message: firstIssue(parsed.error) }, { status: 400 });

  const supabase = await createClient();
  const result = await saveProgram(supabase, parsed.data);
  if ("error" in result) {
    console.error("[admin/programs POST]", result.error);
    return NextResponse.json({ ok: false, message: "저장하지 못했습니다. 잠시 후 다시 시도해 주세요." }, { status: 500 });
  }
  return NextResponse.json({ ok: true, id: result.id });
}
