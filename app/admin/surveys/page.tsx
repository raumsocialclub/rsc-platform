import type { Metadata } from "next";
import { SurveysView } from "@/components/admin/SurveysView";
import { getDoc, s as str } from "@/lib/cms/get";
import { createClient } from "@/lib/supabase/server";
import { SURVEY_DEFS } from "@/lib/survey/definitions";
import { SURVEY_COLUMNS, type SurveyRow } from "@/lib/survey/links";

export const metadata: Metadata = { title: "설문조사" };
export const dynamic = "force-dynamic";

/** /admin/surveys — 회원 설문조사 비밀 링크 만들기·문자 문구·마감·응답 수 (RLS "admin surveys"). 응답 수는 survey_responses 에서 센다 */
export default async function AdminSurveysPage() {
  const supabase = await createClient();
  const [{ data }, { data: resp }] = await Promise.all([
    supabase.from("surveys").select(SURVEY_COLUMNS).order("created_at", { ascending: false }).limit(200),
    supabase.from("survey_responses").select("survey_id").limit(10000),
  ]);
  const count = new Map<string, number>();
  for (const r of (resp ?? []) as { survey_id: string }[]) count.set(r.survey_id, (count.get(r.survey_id) ?? 0) + 1);
  const rows = ((data ?? []) as SurveyRow[]).map((s) => ({ ...s, responses: count.get(s.id) ?? 0 }));
  // 문자 문구 초안은 CMS(survey.<종류>)의 값이 코드 기본값보다 우선
  const docs = await Promise.all(SURVEY_DEFS.map((d) => getDoc(`survey.${d.kind}`)));
  const smsByKind = Object.fromEntries(SURVEY_DEFS.map((d, i) => [d.kind, str(docs[i], "sms") || d.sms]));
  return <SurveysView rows={rows} smsByKind={smsByKind} />;
}
