import { createHash } from "node:crypto";
import { emptyByStatus, leadStatus, type CallLead, type CallsSummary, type MemoGroup, type TabSummary } from "./types";

/** Apps Script 가 돌려주는 탭 하나: 첫 줄은 머리글, 나머지는 행 (빈 칸은 "" 로 자리 유지) */
export type SheetTab = { name: string; rows: string[][] };

const HEADERS = {
  id: ["id"],
  created: ["created_time", "created", "생성", "신청일", "접수"],
  name: ["full_name", "name", "이름", "성함"],
  phone: ["phone_number", "phone", "전화", "휴대폰", "연락처"],
  platform: ["platform", "플랫폼"],
  campaign: ["campaign_name", "캠페인"],
  form: ["form_name", "폼"],
  c1: ["1차"],
  c2: ["2차"],
  c3: ["3차"],
  memo: ["인터뷰", "메모", "비고"],
} as const;

const norm = (s: string) => s.trim().toLowerCase();
function findCol(headers: string[], keys: readonly string[]): number {
  const hs = headers.map(norm);
  for (const k of keys) {
    const exact = hs.indexOf(k);
    if (exact >= 0) return exact;
  }
  for (const k of keys) {
    const i = hs.findIndex((h) => h.includes(k));
    if (i >= 0) return i;
  }
  return -1;
}

const PHONE_RE = /^\+?\d{2,3}[-. ]?\d{3,4}[-. ]?\d{4}$/;
const isPhone = (s: string) => PHONE_RE.test(s.trim());
const cell = (row: string[], i: number) => (i >= 0 && i < row.length ? String(row[i] ?? "").trim() : "");

/** 전화번호를 DB 키로 쓸 때는 해시만 (원문 저장 안 함) */
export function phoneKey(phone: string): string {
  return "p:" + createHash("sha256").update(phone.replace(/\D/g, "")).digest("hex").slice(0, 16);
}

function toIso(s: string): string | null {
  if (!s) return null;
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

/** 탭 하나를 리드 목록으로. 머리글이 없는 탭·완전히 빈 행은 건너뛴다. 손으로 덧붙인 행(이름,전화만 있는 줄)은 전화 칸을 찾아 살린다 */
export function parseTab(tab: SheetTab): CallLead[] {
  const [header, ...rows] = tab.rows;
  if (!header) return [];
  const col = {
    id: findCol(header, HEADERS.id),
    created: findCol(header, HEADERS.created),
    name: findCol(header, HEADERS.name),
    phone: findCol(header, HEADERS.phone),
    platform: findCol(header, HEADERS.platform),
    campaign: findCol(header, HEADERS.campaign),
    form: findCol(header, HEADERS.form),
    c1: findCol(header, HEADERS.c1),
    c2: findCol(header, HEADERS.c2),
    c3: findCol(header, HEADERS.c3),
    memo: findCol(header, HEADERS.memo),
  };
  if (col.phone < 0 && col.name < 0) return [];
  const out: CallLead[] = [];
  for (const row of rows) {
    if (!row.some((c) => String(c ?? "").trim())) continue;
    let name = cell(row, col.name);
    let phone = cell(row, col.phone);
    let id = cell(row, col.id);
    let shifted = false;
    if (!isPhone(phone)) {
      // 열이 밀린 행: 전화번호처럼 생긴 칸을 찾고 그 앞 칸을 이름으로
      const pi = row.findIndex((c) => isPhone(String(c ?? "")));
      if (pi < 0) continue;
      phone = String(row[pi]).trim();
      name = cell(row, pi - 1) || name;
      id = isPhone(id) || id === name ? "" : id;
      shifted = true;
    }
    const calls: [string, string, string] = shifted ? ["", "", ""] : [cell(row, col.c1), cell(row, col.c2), cell(row, col.c3)];
    const memo = shifted ? "" : cell(row, col.memo);
    const { status, attempts, last } = leadStatus(calls);
    out.push({
      key: `${tab.name}|${id || phoneKey(phone)}`,
      tab: tab.name,
      id,
      createdAt: shifted ? null : toIso(cell(row, col.created)),
      name,
      phone,
      platform: shifted ? "" : cell(row, col.platform),
      campaign: shifted ? "" : cell(row, col.campaign),
      form: shifted ? "" : cell(row, col.form),
      calls,
      memo,
      status,
      attempts,
      last,
    });
  }
  return out;
}

/** 모든 탭 → 최신 신청 순 (신청일 없는 행은 뒤로) */
export function parseTabs(tabs: SheetTab[]): CallLead[] {
  const all = tabs.flatMap(parseTab);
  return all.sort((a, b) => (b.createdAt ?? "").localeCompare(a.createdAt ?? ""));
}

export function summarize(leads: CallLead[]): CallsSummary {
  const byStatus = emptyByStatus();
  const attempts: [number, number, number, number] = [0, 0, 0, 0];
  const tabMap = new Map<string, TabSummary>();
  let withMemo = 0;
  for (const l of leads) {
    byStatus[l.status]++;
    attempts[Math.min(3, l.attempts)]++;
    if (l.memo) withMemo++;
    const t = tabMap.get(l.tab) ?? { tab: l.tab, total: 0, done: 0, missed: 0, invalid: 0, callback: 0, pending: 0 };
    t.total++;
    if (l.status === "done") t.done++;
    else if (l.status === "missed") t.missed++;
    else if (l.status === "invalid") t.invalid++;
    else if (l.status === "callback") t.callback++;
    else if (l.status === "pending") t.pending++;
    tabMap.set(l.tab, t);
  }
  return { total: leads.length, byStatus, attempts, withMemo, byTab: Array.from(tabMap.values()) };
}

/** 인터뷰 메모를 같은 글끼리 묶어 많이 나온 순으로 (요약). 이름은 8명까지 */
export function memoGroups(leads: CallLead[]): MemoGroup[] {
  const m = new Map<string, MemoGroup>();
  for (const l of leads) {
    const label = l.memo.replace(/\s+/g, " ").trim();
    if (!label) continue;
    const g = m.get(label) ?? { label, count: 0, names: [] };
    g.count++;
    if (g.names.length < 8 && l.name) g.names.push(l.name);
    m.set(label, g);
  }
  return Array.from(m.values()).sort((a, b) => b.count - a.count || a.label.localeCompare(b.label));
}
