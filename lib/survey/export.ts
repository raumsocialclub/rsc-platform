import { csvCell, toKstIso } from "@/lib/admin/leads";
import { OTHER, displayOption, otherKey, type SurveyAnswers, type SurveyDef } from "./definitions";

/** 응답 한 행 (survey_responses) */
export type SurveyResponseRow = {
  id: string;
  survey_id: string;
  answers: SurveyAnswers;
  name: string | null;
  phone_last4: string | null;
  consent_at: string | null;
  created_at: string;
};

const FIXED = ["응답 일시", "이름", "휴대폰 뒤 4자리"] as const;
const TAIL = ["동의 시각", "응답 ID"] as const;

/** 열: 순위형은 순위마다 한 열, 복수 선택은 쉼표로 한 열, 「기타」는 별도 열 */
export function surveyCsvColumns(def: SurveyDef): string[] {
  const cols: string[] = [...FIXED];
  for (const q of def.questions) {
    if (q.type === "rank") for (let i = 0; i < (q.ranks ?? 1); i++) cols.push(`${q.label} · ${i + 1}순위`);
    else cols.push(q.label);
    if (q.other) cols.push(`${q.label} · 기타 입력`);
  }
  return [...cols, ...TAIL];
}

/** 한 응답 = 한 줄. 엑셀용 BOM + CRLF, 수식 시작 글자는 ' 로 막는다(csvCell) */
export function surveyCsv(def: SurveyDef, rows: SurveyResponseRow[]): string {
  const head = surveyCsvColumns(def).map((c) => `"${c}"`).join(",");
  const lines = rows.map((r) => {
    const a = r.answers ?? {};
    const cells: string[] = [toKstIso(r.created_at), r.name ?? "", r.phone_last4 ?? ""];
    for (const q of def.questions) {
      const v = a[q.key];
      if (q.type === "rank") {
        const list = Array.isArray(v) ? v : [];
        for (let i = 0; i < (q.ranks ?? 1); i++) cells.push(list[i] ?? "");
      } else if (q.type === "multi") cells.push(Array.isArray(v) ? v.join(", ") : "");
      else cells.push(typeof v === "string" ? v : "");
      if (q.other) {
        const t = a[otherKey(q.key)];
        const picked = Array.isArray(v) ? v.includes(OTHER) : v === OTHER;
        cells.push(picked && typeof t === "string" ? t : "");
      }
    }
    cells.push(r.consent_at ? toKstIso(r.consent_at) : "", r.id);
    return cells.map((c) => csvCell(String(c ?? ""))).join(",");
  });
  return "﻿" + [head, ...lines].join("\r\n");
}

/** 어드민 목록 한 줄 요약: "1순위 TASTE TABLE · 2순위 ART WALK" (첫 문항) */
export function surveySummary(def: SurveyDef, a: SurveyAnswers): string {
  const q = def.questions[0];
  const v = a[q.key];
  if (q.type === "rank" && Array.isArray(v)) return v.map((x, i) => `${i + 1}순위 ${displayOption(q, x, a)}`).join(" · ");
  if (Array.isArray(v)) return v.map((x) => displayOption(q, x, a)).join(", ");
  return typeof v === "string" ? displayOption(q, v, a) : "";
}
