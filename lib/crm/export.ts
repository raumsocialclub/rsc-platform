import { THEMES, type ThemeKey } from "./insights";
import { kstDay } from "./parse";
import { CHANNEL_KO, STATUS_KO, type CallLead, type CallsData } from "./types";

/**
 * 콜 현황 CSV 내려받기 (런칭 전 전략 분석용). 개인정보 최소화:
 *   - 이름은 가운데를 가린다 (박채령 → 박x령, 지운 → 지x). 전화번호는 넣지 않는다
 *   - 고객 구분은 전화 해시 키 앞 8자(ID)로 — 같은 사람은 내려받을 때마다 같은 ID
 * 두 가지 파일:
 *   interviews — 고객별 인터뷰: 한 사람 한 줄. 채널·신청·콜 결과 + 주제별 태그 + 노트 원문
 *   needs      — 인터뷰 니즈 분석 집계: 주제 × 태그 × 고객 수·비율 + 예시 문장, 맨 위에 전체 요약
 */
export type ExportKind = "interviews" | "needs";
export const EXPORT_KINDS: { kind: ExportKind; label: string; desc: string }[] = [
  { kind: "interviews", label: "고객별 인터뷰", desc: "한 사람 한 줄 · 이름 가림 · 콜 결과 · 주제별 태그 · 노트 원문" },
  { kind: "needs", label: "인터뷰 니즈 분석 집계", desc: "원하는 것 · 관심 활동 · 일정 · 결정사 경험 · 금액 · 프로필 · 후속 요청 태그별 고객 수" },
];

/** 가운데 글자를 x 로. 2글자는 뒷글자, 1글자는 전부 */
export function maskName(name: string): string {
  const s = name.trim();
  if (!s) return "";
  const chars = Array.from(s);
  if (chars.length === 1) return "x";
  if (chars.length === 2) return chars[0] + "x";
  return chars[0] + "x".repeat(chars.length - 2) + chars[chars.length - 1];
}

/** 엑셀용 셀: 숫자는 그대로, 글은 따옴표로 감싸고 수식 시작 문자는 무력화 */
export function cell(v: string | number | null | undefined): string {
  if (typeof v === "number") return String(v);
  const s = String(v ?? "");
  const safe = /^[=+\-@\t\r]/.test(s) ? `'${s}` : s;
  return `"${safe.replace(/"/g, '""')}"`;
}
const line = (cells: (string | number | null | undefined)[]) => cells.map(cell).join(",");
const BOM = "\ufeff";
const join = (rows: string[]) => BOM + rows.join("\r\n");
const shortId = (key: string) => key.replace(/^p:/, "").slice(0, 8);
const channelKo = (l: Pick<CallLead, "channel">) => (l.channel ? CHANNEL_KO[l.channel] : "채널 미상");

/** 고객별 인터뷰 CSV — 노트·인터뷰 내용이 있는 고객만(화면의 「고객별 인터뷰」와 같은 범위) */
export function interviewsCsv(data: Pick<CallsData, "leads" | "insights">): string {
  const byKey = new Map(data.leads.map((l) => [l.key, l]));
  const head = ["ID", "이름", "채널", "채널 중복", "재신청 횟수", "최초 신청일", "최근 신청일", "콜 결과", "시도 횟수", "1차 콜", "2차 콜", "3차 콜", ...THEMES.map((t) => t.label), "분류 안 된 문장", "인터뷰 노트", "상담 메모"];
  const rows = data.insights.customers.map((c) => {
    const l = byKey.get(c.key);
    const tagsOf = (theme: ThemeKey) => c.tags.filter((t) => t.theme === theme).map((t) => t.tag).join(" | ");
    return line([
      shortId(c.key), maskName(c.name), l ? channelKo(l) : c.tab, l && l.channels.length > 1 ? "Y" : "", l ? l.subs.length : "", l ? kstDay(l.createdAt) : "", l ? kstDay(l.lastAt) : "",
      STATUS_KO[c.status], l ? l.attempts : "", l?.calls[0] ?? "", l?.calls[1] ?? "", l?.calls[2] ?? "",
      ...THEMES.map((t) => tagsOf(t.key)),
      c.untagged.join(" / "), c.lines.join(" / "), c.memo,
    ]);
  });
  return join([line(head), ...rows]);
}

/** 니즈 분석 집계 CSV — 맨 위 요약 몇 줄 + 주제별 태그 표 */
export function needsCsv(data: Pick<CallsData, "summary" | "insights" | "fetchedAt">): string {
  const { summary: s, insights: r } = data;
  const pct = (n: number, d: number) => (d ? Math.round((n / d) * 1000) / 10 : 0);
  const out: string[] = [
    line(["요약", "값", "비고"]),
    line(["기준 시각", kstDay(data.fetchedAt), "시트를 읽은 날짜 (한국)"]),
    line(["전체 신청(명)", s.total, `신청 ${s.submissions}건 · 재신청 ${s.resubmitted}명 · 채널 중복 ${s.crossChannel}명`]),
    line(["통화완료(명)", s.byStatus.done, `${pct(s.byStatus.done, s.total)}%`]),
    line(["재통화 예정(명)", s.byStatus.callback, ""]),
    line(["부재중(명)", s.byStatus.missed, ""]),
    line(["없는 번호·거절(명)", s.byStatus.invalid + s.byStatus.declined, `없는 번호 ${s.byStatus.invalid} · 거절 ${s.byStatus.declined}`]),
    line(["미진행(명)", s.byStatus.pending, ""]),
    line(["인터뷰 내용 있는 고객(명)", r.interviewed, `문장 ${r.lineCount}개`]),
    ...s.byChannel.map((c) => line([`채널 · ${c.tab}(명)`, c.total, `통화완료 ${c.done} · 부재 ${c.missed} · 없는 번호 ${c.invalid} · 재통화 ${c.callback} · 미진행 ${c.pending}`])),
    "",
    line(["주제", "태그", "고객 수", "인터뷰 고객 대비 %", "예시 1", "예시 2", "예시 3"]),
  ];
  for (const t of r.themes) {
    for (const tag of t.tags) out.push(line([t.label, tag.tag, tag.count, pct(tag.count, r.interviewed), tag.samples[0] ?? "", tag.samples[1] ?? "", tag.samples[2] ?? ""]));
  }
  out.push("", line(["분류 안 된 문장", "이름", "문장"]));
  for (const u of r.untagged) out.push(line(["", maskName(u.name), u.line]));
  return join(out);
}

export function callsCsv(kind: ExportKind, data: CallsData): { csv: string; filename: string } {
  const day = kstDay(data.fetchedAt);
  return kind === "needs"
    ? { csv: needsCsv(data), filename: `rsc-calls-needs-${day}.csv` }
    : { csv: interviewsCsv(data), filename: `rsc-calls-interviews-${day}.csv` };
}
