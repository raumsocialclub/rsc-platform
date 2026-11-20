import { requireOwner } from "@/lib/admin/guard";
import { createClient } from "@/lib/supabase/server";
import { surveyDef } from "@/lib/survey/definitions";
import { surveyCsv, type SurveyResponseRow } from "@/lib/survey/export";

const PAGE = 1000;

/**
 * GET /api/admin/surveys/:id/export — 그 설문의 응답 전체를 CSV 로(한 응답 = 한 줄, 순위마다 열). 이름·뒤 4자리가 들어가므로 다른 개인정보 파일과 같이 주관리자 전용(M12). 캐시하지 않는다.
 */
export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const me = await requireOwner();
  if (!me) return new Response("주관리자만 내려받을 수 있습니다.", { status: 403, headers: { "Content-Type": "text/plain; charset=utf-8" } });
  const { id } = await ctx.params;
  const supabase = await createClient();
  const { data: survey } = await supabase.from("surveys").select("id, kind, name").eq("id", id).maybeSingle();
  const def = survey ? surveyDef((survey as { kind: string }).kind) : null;
  if (!survey || !def) return new Response("설문을 찾을 수 없습니다.", { status: 404, headers: { "Content-Type": "text/plain; charset=utf-8" } });
  const all: SurveyResponseRow[] = [];
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await supabase.from("survey_responses").select("id, survey_id, answers, name, phone_last4, consent_at, created_at").eq("survey_id", id).order("created_at", { ascending: false }).range(from, from + PAGE - 1);
    if (error) return new Response("조회 실패", { status: 500 });
    all.push(...((data ?? []) as SurveyResponseRow[]));
    if (!data || data.length < PAGE) break;
  }
  return new Response(surveyCsv(def, all), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="rsc-survey-${def.kind}-${new Date().toISOString().slice(0, 10)}.csv"`,
      "Cache-Control": "private, no-store",
      Pragma: "no-cache",
    },
  });
}
