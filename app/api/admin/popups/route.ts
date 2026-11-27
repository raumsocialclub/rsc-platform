import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin/guard";
import { logAdmin } from "@/lib/admin/log";
import { revalidateHome, toRow } from "@/lib/popups/admin";
import { PopupInputSchema, firstIssue } from "@/lib/popups/schema";
import { createClient } from "@/lib/supabase/server";

/** POST /api/admin/popups — 새 팝업 (M17) */
export async function POST(req: Request) {
  const me = await requireAdmin();
  if (!me) return NextResponse.json({ ok: false, message: "관리자만 사용할 수 있습니다." }, { status: 403 });
  const parsed = PopupInputSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ ok: false, message: firstIssue(parsed.error) }, { status: 400 });
  const supabase = await createClient();
  const { data, error } = await supabase.from("popups").insert({ ...toRow(parsed.data), created_by: me.id }).select("id").single();
  if (error || !data) {
    console.error("[admin/popups POST]", error);
    return NextResponse.json({ ok: false, message: "저장하지 못했습니다. 잠시 후 다시 시도해 주세요." }, { status: 500 });
  }
  await logAdmin(me.id, "popup.create", data.id, { title: parsed.data.title, ratio: parsed.data.ratio, active: parsed.data.active });
  revalidateHome();
  return NextResponse.json({ ok: true, id: data.id });
}
