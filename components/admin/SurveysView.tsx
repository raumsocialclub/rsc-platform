import Link from "next/link";
import { CopyButton } from "./CopyButton";
import { SurveyCreateForm, SurveyToggleButton } from "./SurveyAdminForm";
import { CARD, TH, TD, Badge, EmptyRow, PageTitle } from "./ui";
import { badgeStyle, fmtDate } from "@/lib/admin/format";
import { surveyDef } from "@/lib/survey/definitions";
import { SURVEY_STATUS_KO, fillSms, surveyStatus, surveyUrl, type SurveyRow } from "@/lib/survey/links";

export type SurveyListRow = SurveyRow & { responses: number };

const statusBadge = (s: ReturnType<typeof surveyStatus>) => badgeStyle(s === "open" ? "ok" : s === "closed" ? "mute" : "warn");

/**
 * /admin/surveys — 회원 설문조사(문자 발송용 비밀 링크) 관리. 흐름: 「설문 링크 만들기」 → 「문자 문구 복사」로 발송 → 회원이 로그인 없이 응답 → 「결과 보기」에서 집계·응답 목록·CSV.
 * 사이트 어디에도 링크가 노출되지 않는다. 마감하면 그 링크는 닫히고 응답은 남는다.
 */
export function SurveysView({ rows, smsByKind }: { rows: SurveyListRow[]; smsByKind: Record<string, string> }) {
  const open = rows.filter((r) => surveyStatus(r) === "open").length;
  const total = rows.reduce((n, r) => n + r.responses, 0);
  return (
    <>
      <PageTitle overline="MEMBER SURVEY" title="설문조사" aside={<span className="text-[16px] text-[rgba(55,56,60,.61)]">진행 중 {open}개 · 응답 {total}건</span>}>
        <SurveyCreateForm />
      </PageTitle>
      <div className="text-[13px] leading-[1.7] text-[rgba(55,56,60,.61)] mb-[16px]">
        회원에게 문자로 보내는 설문입니다. 사이트에는 노출되지 않고 여기서 만든 비밀 링크(/s/…)로만 열립니다. 받은 분은 로그인 없이 한 화면에 한 질문씩 답하고, 마지막에 이름·휴대폰 뒤 4자리를 선택으로 남길 수 있습니다.
        「문자 문구 복사」는 (광고) 표기·수신거부 번호가 들어간 발송 문구 초안에 링크를 넣어 줍니다 — <b>수신거부 번호(080-000-0000 자리)는 실제 번호로 바꿔 보내세요</b>. 문구는 사이트 관리 → 회원 설문조사에서 고칠 수 있습니다.
      </div>
      <div className={CARD}>
        <div className="overflow-x-auto">
          <table className="border-collapse w-full">
            <thead><tr>{["만든 날", "설문", "메모", "마감", "상태", "응답", "링크", "문자", ""].map((h, i) => <th key={i} className={TH}>{h}</th>)}</tr></thead>
            <tbody>
              {rows.length === 0 && <EmptyRow colSpan={9}>아직 만든 설문이 없습니다. 「설문 링크 만들기」로 시작하세요.</EmptyRow>}
              {rows.map((r) => {
                const s = surveyStatus(r);
                const def = surveyDef(r.kind);
                const url = surveyUrl(r.token);
                return (
                  <tr key={r.id} className="hover:bg-[rgba(112,115,124,.05)]">
                    <td className={`${TD} text-[rgba(55,56,60,.61)]`}>{fmtDate(r.created_at)}</td>
                    <td className={TD}><Link href={`/admin/surveys/${r.id}`} className="font-bold text-label hover:text-primary">{r.name || def?.name || r.kind}</Link><div className="text-[12px] text-[rgba(55,56,60,.61)] mt-[2px]">{def?.name ?? r.kind} · {def?.questions.length ?? "?"}문항</div></td>
                    <td className={`${TD} whitespace-normal max-w-[220px] text-[13px] text-[rgba(55,56,60,.61)]`}>{r.memo || "—"}</td>
                    <td className={`${TD} text-[rgba(55,56,60,.61)]`}>{r.closes_at ? `~ ${fmtDate(r.closes_at)}` : "없음"}</td>
                    <td className={TD}><Badge style={statusBadge(s)}>{SURVEY_STATUS_KO[s]}</Badge></td>
                    <td className={TD}><Link href={`/admin/surveys/${r.id}`} className={r.responses ? "text-primary font-semibold" : "text-[rgba(55,56,60,.61)]"}>{r.responses}건 · 결과 보기 →</Link>{r.last_response_at && <div className="text-[12px] text-[rgba(55,56,60,.61)] mt-[2px]">최근 {fmtDate(r.last_response_at, true)}</div>}</td>
                    <td className={TD}><CopyButton text={url} label="링크 복사" /></td>
                    <td className={TD}>{def ? <CopyButton text={fillSms(smsByKind[r.kind] ?? def.sms, url)} label="문자 문구 복사" /> : "—"}</td>
                    <td className={TD}><SurveyToggleButton id={r.id} closed={s !== "open"} /></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
