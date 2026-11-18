import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SurveyResults } from "@/components/admin/SurveyResults";
import { getCurrentMember, isOwnerRole } from "@/lib/auth/session";
import { getDoc, s as str } from "@/lib/cms/get";
import { createClient } from "@/lib/supabase/server";
import { surveyDef } from "@/lib/survey/definitions";
import type { SurveyResponseRow } from "@/lib/survey/export";
import { SURVEY_COLUMNS, type SurveyRow } from "@/lib/survey/links";

export const metadata: Metadata = { title: "설문 결과" };
export const dynamic = "force-dynamic";

/** /admin/surveys/:id — 한 설문의 집계(문항별 선택 비율·순위 점수·기타 입력)와 응답 목록(최근 1000건), CSV(주관리자) */
export default async function AdminSurveyDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const supabase = await createClient();
  const [{ data: survey }, { data: resp }, me] = await Promise.all([
    supabase.from("surveys").select(SURVEY_COLUMNS).eq("id", id).maybeSingle(),
    supabase.from("survey_responses").select("id, survey_id, answers, name, phone_last4, consent_at, created_at").eq("survey_id", id).order("created_at", { ascending: false }).limit(1000),
    getCurrentMember(),
  ]);
  const row = survey as SurveyRow | null;
  const def = row ? surveyDef(row.kind) : null;
  if (!row || !def) notFound();
  const sms = str(await getDoc(`survey.${def.kind}`), "sms") || def.sms;
  return <SurveyResults survey={row} def={def} rows={(resp ?? []) as SurveyResponseRow[]} owner={isOwnerRole(me)} sms={sms} />;
}
