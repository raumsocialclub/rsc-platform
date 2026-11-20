import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/admin/guard";
import { logAdmin } from "@/lib/admin/log";
import { createClient } from "@/lib/supabase/server";
import { DEFAULT_SURVEY_KIND, surveyDef } from "@/lib/survey/definitions";
import { newToken, surveyUrl } from "@/lib/survey/links";

/**
 * POST /api/admin/surveys { kind?, name, memo?, days? } → { ok, survey: { id, token, url, closesAt } }
 * 회원 설문조사 비밀 링크 만들기(관리자). days 를 비우면 마감일 없음(관리자가 직접 마감). RLS "admin surveys".
 */
const Body = z.object({
  kind: z.string().trim().max(40).optional().default(DEFAULT_SURVEY_KIND),
  name: z.string().trim().min(1, "설문 이름을 적어 주세요.").max(80),
  memo: z.string().trim().max(500).optional().default(""),
  days: z.number().int().min(1).max(365).nullable().optional().default(null),
});

export async function POST(req: Request) {
  const me = await requireAdmin();
  if (!me) return NextResponse.json({ ok: false, message: "관리자만 사용할 수 있습니다." }, { status: 403 });
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ ok: false, message: parsed.error.issues[0]?.message ?? "입력값을 확인해 주세요." }, { status: 400 });
  const { kind, name, memo, days } = parsed.data;
  if (!surveyDef(kind)) return NextResponse.json({ ok: false, message: "알 수 없는 설문 종류입니다." }, { status: 400 });

  const supabase = await createClient();
  const token = newToken();
  const closesAt = days ? new Date(Date.now() + days * 86_400_000).toISOString() : null;
  const { data, error } = await supabase
    .from("surveys")
    .insert({ kind, token, name, memo: memo || null, created_by: me.id, closes_at: closesAt })
    .select("id, token, closes_at")
    .single();
  if (error || !data) {
    console.error("[admin/surveys]", error);
    return NextResponse.json({ ok: false, message: "설문 링크를 만들지 못했습니다." }, { status: 500 });
  }
  const row = data as { id: string; token: string; closes_at: string | null };
  await logAdmin(me.id, "survey.create", row.id, { kind, name, days });
  return NextResponse.json({ ok: true, survey: { id: row.id, token: row.token, url: surveyUrl(row.token), closesAt: row.closes_at } });
}
