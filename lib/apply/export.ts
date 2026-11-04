import type { InquiryRow } from "@/components/admin/InquiryDetail";
import { csvCell, toKstIso } from "@/lib/admin/leads";
import { INQUIRY_STATUS } from "@/lib/admin/format";
import { STEPS, displayAnswer, type Answers } from "@/lib/apply/schema";

/**
 * 상담 신청 목록의 「종류」 필터 + 상담 전 설문(/apply) 응답 CSV.
 * kind: "" 전체 · "apply" 상담 전 설문 응답만 · "fit" 홈 상담 신청(핏체크)만
 */
export type InquiryKind = "" | "apply" | "fit";
export const INQUIRY_KINDS: { value: InquiryKind; label: string }[] = [
  { value: "", label: "전체 종류" },
  { value: "apply", label: "상담 전 설문(/apply)" },
  { value: "fit", label: "홈 상담 신청" },
];
export const parseKind = (v: string | null | undefined): InquiryKind => (v === "apply" || v === "fit" ? v : "");
export const isApply = (r: Pick<InquiryRow, "answers">): boolean => r.answers?.form === "apply";
export const matchesKind = (r: Pick<InquiryRow, "answers">, kind: InquiryKind): boolean => (kind === "" ? true : kind === "apply" ? isApply(r) : !isApply(r));

/** 설문 응답 원본(answers.apply). 원본이 없는 옛 행은 평탄화 목록(answers.answers[])에서 키별 답을 되살린다 */
export function applyAnswers(r: Pick<InquiryRow, "answers">): Answers {
  const a = r.answers;
  if (!a) return {};
  if (a.apply && typeof a.apply === "object") return a.apply;
  const out: Answers = {};
  for (const x of a.answers ?? []) if (x.key && x.answer) out[x.key] = x.answer;
  return out;
}

/** 목록의 한 줄 요약: "남성 · 1989년생" */
export function applySummary(r: Pick<InquiryRow, "answers">): string {
  const a = applyAnswers(r);
  const gender = String(a.gender ?? "").trim();
  const year = String(a.birth ?? "").slice(0, 4);
  return [gender, /^\d{4}$/.test(year) ? `${year}년생` : ""].filter(Boolean).join(" · ");
}

const FIXED = ["신청일", "상태", "이름", "휴대폰", "이메일"] as const;
const TAIL = ["utm_source", "utm_medium", "utm_campaign", "동의 시각", "동의문 버전", "신청 ID"] as const;
/** 설문 열: 이름·휴대폰·이메일은 고정 열에 있으니 빼고, 나머지는 단계 순서대로 「단계 · 문항」 */
const SURVEY = STEPS.flatMap((s) => s.fields.filter((f) => !["name", "phone", "email"].includes(f.key)).map((f) => ({ f, head: `${s.title} · ${f.label}` })));
export const APPLY_CSV_COLUMNS = [...FIXED, ...SURVEY.map((c) => c.head), ...TAIL];

/** 한 응답 = 한 줄. 답이 없는 칸은 빈 문자열. 엑셀용 BOM + CRLF, 수식 시작 글자는 ' 로 막는다(csvCell) */
export function applyCsv(rows: InquiryRow[]): string {
  const head = APPLY_CSV_COLUMNS.map((c) => `"${c}"`).join(",");
  const lines = rows.map((r) => {
    const a = applyAnswers(r);
    const cells = [
      toKstIso(r.created_at),
      INQUIRY_STATUS[r.status] ?? r.status,
      r.name ?? "",
      r.phone ?? "",
      r.email ?? "",
      ...SURVEY.map((c) => displayAnswer(c.f, a)),
      r.utm?.utm_source ?? "",
      r.utm?.utm_medium ?? "",
      r.utm?.utm_campaign ?? "",
      r.answers?.consentAt ? toKstIso(r.answers.consentAt) : "",
      r.answers?.consentVersion ?? "",
      r.id,
    ];
    return cells.map((v) => csvCell(String(v ?? ""))).join(",");
  });
  return "﻿" + [head, ...lines].join("\r\n");
}
