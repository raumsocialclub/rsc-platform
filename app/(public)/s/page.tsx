import type { Metadata } from "next";
import { SurveyShell } from "@/components/survey/SurveyShell";
import { ClosedNotice } from "@/components/apply/ClosedNotice";
import { SURVEY_MESSAGE } from "@/lib/survey/links";

export const metadata: Metadata = { title: "RSC 설문조사", robots: { index: false, follow: false } };

/** /s (토큰 없음) — 설문은 /s/<토큰> 비밀 링크로만 열린다. 주소만 치고 들어오면 안내만 보여준다 */
export default function SurveyIndexPage() {
  return (
    <SurveyShell>
      <ClosedNotice message={SURVEY_MESSAGE.invalid} />
    </SurveyShell>
  );
}
