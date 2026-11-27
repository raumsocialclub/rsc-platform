import Link from "next/link";
import { CopyButton } from "./CopyButton";
import { SurveyToggleButton } from "./SurveyAdminForm";
import { CARD, TH, TD, Badge, EmptyRow, PageTitle } from "./ui";
import { badgeStyle, fmtDate } from "@/lib/admin/format";
import { OTHER, displaySurveyAnswer, summarizeSurvey, type SurveyDef } from "@/lib/survey/definitions";
import type { SurveyResponseRow } from "@/lib/survey/export";
import { SURVEY_STATUS_KO, fillSms, surveyStatus, surveyUrl, type SurveyRow } from "@/lib/survey/links";

const pct = (n: number, d: number) => (d ? Math.round((n / d) * 100) : 0);

/**
 * 설문 결과: 문항별 선택 비율(막대) · 순위형은 1순위·2순위 수와 점수(1순위 2점·2순위 1점) 순 · 「기타」 직접 입력 목록 · 응답 목록(이름·뒤 4자리는 적은 경우만).
 * 같은 이름+뒤 4자리가 두 번 이상이면 「중복?」 표시로 가려낼 수 있게 한다. CSV 는 주관리자만.
 */
export function SurveyResults({ survey, def, rows, owner, sms }: { survey: SurveyRow; def: SurveyDef; rows: SurveyResponseRow[]; owner: boolean; sms: string }) {
  const s = surveyStatus(survey);
  const url = surveyUrl(survey.token);
  const stats = summarizeSurvey(def, rows.map((r) => r.answers ?? {}));
  const n = rows.length;
  const idCount = new Map<string, number>();
  for (const r of rows) { const k = `${r.name ?? ""}|${r.phone_last4 ?? ""}`; if (k !== "|") idCount.set(k, (idCount.get(k) ?? 0) + 1); }
  const named = rows.filter((r) => r.name || r.phone_last4).length;

  return (
    <>
      <Link href="/admin/surveys" className="inline-block text-[13px] text-[rgba(55,56,60,.61)] mb-[16px]">← 설문조사 목록</Link>
      <PageTitle overline="SURVEY RESULT" title={survey.name || def.name} aside={<Badge style={badgeStyle(s === "open" ? "ok" : s === "closed" ? "mute" : "warn")}>{SURVEY_STATUS_KO[s]}</Badge>}>
        <div className="flex flex-wrap gap-[8px] items-center">
          <CopyButton text={url} label="링크 복사" />
          <CopyButton text={fillSms(sms, url)} label="문자 문구 복사" />
          {owner && n > 0 && <a href={`/api/admin/surveys/${survey.id}/export`} className="border border-[rgba(112,115,124,.22)] px-[10px] py-[5px] text-[12px] hover:border-primary hover:text-primaryStrong whitespace-nowrap">응답 CSV</a>}
          <SurveyToggleButton id={survey.id} closed={s !== "open"} />
        </div>
      </PageTitle>
      <div className="text-[13px] leading-[1.7] text-[rgba(55,56,60,.61)] mb-[20px]">
        {def.name} · {def.questions.length}문항 · 만든 날 {fmtDate(survey.created_at)} · 마감 {survey.closes_at ? fmtDate(survey.closes_at) : "없음"}{survey.memo ? ` · ${survey.memo}` : ""}
        <br />응답 <b className="text-label">{n}건</b>{def.identify && <> · 이름/뒤 4자리를 남긴 응답 {named}건</>}{n >= 1000 && " · 최근 1000건만 표시(CSV 는 전체)"}
      </div>

      <div className="grid gap-[16px] lg:grid-cols-2 mb-[24px]">
        {stats.map(({ q, options, others, answered }) => {
          const max = Math.max(1, ...options.map((o) => (q.type === "rank" ? o.score : o.count)));
          return (
            <section key={q.key} className={`${CARD} p-[18px]`}>
              <div className="text-[11px] font-semibold tracking-[.04em] text-primary mb-[4px]">{q.part} · {q.no}</div>
              <h2 className="text-[15px] font-bold text-label leading-[1.5] mb-[4px]">{q.title}</h2>
              <div className="text-[12px] text-[rgba(55,56,60,.61)] mb-[14px]">
                {q.type === "rank" ? `순위형 · 점수 = 1순위 ${q.ranks}점 … ${q.ranks}순위 1점 · 응답 ${answered}명` : q.type === "multi" ? `복수 선택(최대 ${q.max}개) · 응답 ${answered}명 · 비율은 응답자 기준` : `단일 선택 · 응답 ${answered}명`}
              </div>
              <ol className="grid gap-[8px]">
                {options.map((o) => {
                  const v = q.type === "rank" ? o.score : o.count;
                  return (
                    <li key={o.value}>
                      <div className="flex items-baseline justify-between gap-[10px] text-[13px]">
                        <span className="font-semibold text-label truncate">{o.value}</span>
                        <span className="flex-none text-[rgba(55,56,60,.61)] tabular-nums">
                          {q.type === "rank" ? <>{o.byRank.map((c, i) => <span key={i} className="ml-[8px]">{i + 1}순위 <b className="text-label">{c}</b></span>)}<span className="ml-[8px]">점수 <b className="text-primary">{o.score}</b></span></> : <><b className="text-label">{o.count}</b>명 · {pct(o.count, answered)}%</>}
                        </span>
                      </div>
                      <div className="h-[6px] rounded-full bg-fill mt-[4px]" aria-hidden><div className="h-full rounded-full bg-primary" style={{ width: `${pct(v, max)}%` }} /></div>
                    </li>
                  );
                })}
              </ol>
              {q.other && others.length > 0 && (
                <div className="mt-[14px] border-t border-lineAlt pt-[10px]">
                  <div className="text-[12px] font-semibold text-labelNeutral mb-[6px]">{OTHER} 직접 입력 ({others.length})</div>
                  <ul className="grid gap-[4px] text-[13px] text-labelNeutral">{others.map((t, i) => <li key={i} className="whitespace-normal">· {t}</li>)}</ul>
                </div>
              )}
            </section>
          );
        })}
      </div>

      <div className={CARD}>
        <div className="px-[14px] py-[12px] border-b border-lineAlt text-[13px] font-semibold text-label">응답 목록</div>
        <div className="overflow-x-auto">
          <table className="border-collapse w-full">
            <thead><tr>{["응답 일시", ...(def.identify ? ["이름", "뒤 4자리"] : []), ...def.questions.map((q) => q.label), "동의"].map((h, i) => <th key={i} className={TH}>{h}</th>)}</tr></thead>
            <tbody>
              {rows.length === 0 && <EmptyRow colSpan={def.questions.length + 4}>아직 응답이 없습니다. 링크를 문자로 보내면 여기에 모입니다.</EmptyRow>}
              {rows.map((r) => {
                const k = `${r.name ?? ""}|${r.phone_last4 ?? ""}`;
                const dup = k !== "|" && (idCount.get(k) ?? 0) > 1;
                return (
                  <tr key={r.id} className="hover:bg-[rgba(112,115,124,.05)] align-top">
                    <td className={`${TD} text-[rgba(55,56,60,.61)]`}>{fmtDate(r.created_at, true)}</td>
                    {def.identify && <td className={TD}>{r.name || <span className="text-[rgba(55,56,60,.28)]">무기명</span>}{dup && <Badge style={badgeStyle("warn")}>중복?</Badge>}</td>}
                    {def.identify && <td className={`${TD} tabular-nums`}>{r.phone_last4 ? `****-${r.phone_last4}` : "—"}</td>}
                    {def.questions.map((q) => <td key={q.key} className={`${TD} whitespace-normal min-w-[160px] max-w-[320px] text-[13px]`}>{displaySurveyAnswer(q, r.answers ?? {}) || <span className="text-[rgba(55,56,60,.28)]">—</span>}</td>)}
                    <td className={`${TD} text-[12px] text-[rgba(55,56,60,.61)]`}>{r.consent_at ? fmtDate(r.consent_at, true) : "—"}</td>
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
