import type { Metadata } from "next";
import { ClosedNotice } from "@/components/apply/ClosedNotice";
import { SurveyForm, type SurveyCopy } from "@/components/survey/SurveyForm";
import { SurveyShell } from "@/components/survey/SurveyShell";
import { getDoc, s } from "@/lib/cms/get";
import { createAdminClient, hasServiceRoleKey } from "@/lib/supabase/admin";
import { surveyDef } from "@/lib/survey/definitions";
import { SURVEY_MESSAGE, findSurvey, surveyStatus } from "@/lib/survey/links";

export const metadata: Metadata = { title: "RSC 설문조사", description: "RAUM SOCIAL CLUB 회원 설문조사", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

/**
 * /s/<토큰> — 관리자가 만든 비밀 링크로만 열리는 회원 설문조사(문자 발송용). 로그인 없이 바로 답하고, 사이트 어디에도 링크가 없다(robots 도 제외).
 * 토큰이 유효하고 열려 있을 때만 설문이 보이고, 마감·기간 종료·잘못된 주소는 안내만 보여준다. 발급·마감·결과: 어드민 → 설문조사(/admin/surveys)
 * 공통 문구는 CMS(survey.form), 설문별 첫 화면·완료 문구는 CMS(survey.<종류>)가 코드 정의(lib/survey/definitions.ts)를 덮어쓴다.
 */
export default async function SurveyTokenPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const survey = hasServiceRoleKey() ? await findSurvey(createAdminClient(), token) : null;
  const def = survey ? surveyDef(survey.kind) : null;
  const status = survey && def ? surveyStatus(survey) : "invalid";
  if (!survey || !def || status !== "open") {
    return (
      <SurveyShell>
        <ClosedNotice message={SURVEY_MESSAGE[status === "open" ? "invalid" : status]} title="설문을 열 수 없습니다" />
      </SurveyShell>
    );
  }
  const [common, own] = await Promise.all([getDoc("survey.form"), getDoc(`survey.${def.kind}`)]);
  const copy: Partial<SurveyCopy> = {};
  for (const [k, v] of Object.entries(common)) if (typeof v === "string" && v) (copy as Record<string, string>)[k] = v;
  const text = { title: s(own, "title") || def.title, eyebrow: s(own, "eyebrow") || def.eyebrow, intro: s(own, "intro") || def.intro, note1: s(own, "note1"), note2: s(own, "note2"), thanksTitle: s(own, "thanksTitle") || def.thanksTitle, thanksBody: s(own, "thanksBody") || def.thanksBody };
  return <SurveyForm token={token} kind={def.kind} closesAt={survey.closes_at} copy={copy} text={text} />;
}
