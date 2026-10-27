import { createHash } from "node:crypto";
import { CHANNEL_KO, emptyByStatus, leadStatus, type CallLead, type CallsSummary, type Channel, type DaySummary, type MemoGroup, type Submission, type TabSummary } from "./types";

/** Apps Script 가 돌려주는 탭 하나: 첫 줄은 머리글, 나머지는 행 (빈 칸은 "" 로 자리 유지). notes 는 셀 노트가 있는 칸만 [행, 열, 내용] */
export type SheetTab = { name: string; rows: string[][]; notes?: [number, number, string][] };

/**
 * 탭 구분. 시트에는 세 종류의 탭이 있다:
 *  - 마스터 탭(DB추출용): 홈페이지·메타 CSV 를 전부 누적하는 원본. 있으면 이 탭의 행을 대표로 삼는다
 *  - 날짜 탭(웹사이트 · ~10/21 · 10/22 …): 예전 방식. 같은 신청이 마스터 탭에도 있으므로 전화번호로 합친다 (노트·콜 결과는 살린다)
 *  - 파생 탭(DB관리 · 일별현황 · 자동정리 · 사용안내): 수식으로 만든 보기용. 읽으면 이중 집계가 되므로 건너뛴다
 */
export const MASTER_TABS = ["DB추출용"];
/** 상태 탭(CRM관리): CRM 팀이 1차·2차·3차 콜 결과와 상담 메모를 적는 한 장. 있으면 콜 결과·메모는 이 탭을 우선한다 */
export const STATUS_TABS = ["CRM관리"];
export const DERIVED_TABS = ["DB관리", "일별현황", "자동정리", "사용안내"];
const DERIVED_HEADER_MARKS = ["입력시트 행", "누적 신청수", "신규 / 재신청", "채널 중복"];
export const isDerivedTab = (tab: { name: string; rows: string[][] }) =>
  DERIVED_TABS.includes(tab.name.trim()) || (tab.rows[0] ?? []).some((h) => DERIVED_HEADER_MARKS.some((m) => String(h ?? "").includes(m)));

const HEADERS = {
  id: ["id"],
  formId: ["form_id"],
  created: ["created_time", "created", "생성", "신청일", "수집일", "접수"],
  channel: ["수집 채널", "수집채널", "채널"],
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

/** 수집 채널 판정: 메타 리드 id 는 "l:…", 홈페이지 신청 id 는 UUID 이고 form_id 가 rsc-website */
export function channelOf(r: { id: string; formId: string; form: string }): Channel {
  if (/^l:\d+/.test(r.id) || /^f:\d+/.test(r.formId)) return "meta";
  if (r.formId === "rsc-website" || /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-/i.test(r.id) || /웹사이트/.test(r.form)) return "web";
  return "";
}

/** 시트의 「수집 채널」 칸(홈페이지 · 메타 · 인스타그램 …) → 채널 */
export function channelFromLabel(label: string): Channel {
  const t = label.replace(/\s+/g, "").toLowerCase();
  if (!t) return "";
  if (/홈페이지|웹|web|site/.test(t)) return "web";
  if (/메타|meta|인스타|insta|ig|페이스북|facebook|fb/.test(t)) return "meta";
  return "";
}

/** 한국 날짜 YYYY-MM-DD */
export const kstDay = (iso: string | null) => (iso ? new Date(new Date(iso).getTime() + 9 * 3600_000).toISOString().slice(0, 10) : "");

/** 탭 하나를 리드 목록으로. 머리글이 없는 탭·완전히 빈 행은 건너뛴다. 손으로 덧붙인 행(이름,전화만 있는 줄)은 전화 칸을 찾아 살린다 */
export function parseTab(tab: SheetTab): CallLead[] {
  const [header, ...rows] = tab.rows;
  if (!header) return [];
  const col = {
    id: findCol(header, HEADERS.id),
    formId: findCol(header, HEADERS.formId),
    channel: findCol(header, HEADERS.channel),
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
  const notesByRow = new Map<number, string[]>();
  for (const n of tab.notes ?? []) {
    if (!Array.isArray(n) || n.length < 3 || !String(n[2] ?? "").trim()) continue;
    const list = notesByRow.get(Number(n[0])) ?? [];
    list.push(String(n[2]).trim());
    notesByRow.set(Number(n[0]), list);
  }
  const out: CallLead[] = [];
  for (const [ri, row] of rows.entries()) {
    if (!row.some((c) => String(c ?? "").trim())) continue;
    const note = (notesByRow.get(ri + 1) ?? []).join("\n");
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
    const form = shifted ? "" : cell(row, col.form);
    const formId = shifted ? "" : cell(row, col.formId);
    const createdAt = shifted ? null : toIso(cell(row, col.created));
    const channel = channelOf({ id, formId, form }) || (shifted ? "" : channelFromLabel(cell(row, col.channel)));
    out.push({
      key: phoneKey(phone),
      tab: tab.name,
      tabs: [tab.name],
      id,
      createdAt,
      lastAt: createdAt,
      channel,
      channels: channel ? [channel] : [],
      subs: [{ id, at: createdAt, channel, tab: tab.name }],
      name,
      phone,
      platform: shifted ? "" : cell(row, col.platform),
      campaign: shifted ? "" : cell(row, col.campaign),
      form,
      calls,
      memo,
      note,
      status,
      attempts,
      last,
    });
  }
  return out;
}

const byTime = (a: string | null, b: string | null) => (b ?? "").localeCompare(a ?? "");
const uniq = <T,>(xs: T[]) => Array.from(new Set(xs));

/**
 * 같은 전화번호의 행을 한 사람으로 합친다. 대표 행은 마스터 탭(DB추출용) 행, 없으면 가장 최근 신청 행.
 *  - 콜 결과(1·2·3차): 시도가 가장 많이 적힌 행의 것 (어느 탭에 적었든 살린다)
 *  - 인터뷰 내용: 대표 행 것, 비었으면 다른 행 것. 셀 노트: 모든 행의 노트를 겹치지 않게 이어 붙임
 *  - 신청 건(subs): 신청 id 가 같으면 한 건 (마스터 탭과 날짜 탭에 같은 신청이 복사돼 있어도 1건). id 가 없으면 신청 시각으로 구분
 */
export function mergeLeads(rows: CallLead[], masterTab: string | null, statusTab: string | null = null): CallLead[] {
  const groups = new Map<string, CallLead[]>();
  for (const r of rows) {
    const g = groups.get(r.key) ?? [];
    g.push(r);
    groups.set(r.key, g);
  }
  const out: CallLead[] = [];
  for (const g of groups.values()) {
    g.sort((a, b) => Number(b.tab === masterTab) - Number(a.tab === masterTab) || byTime(a.createdAt, b.createdAt));
    const p = g[0];
    if (g.length === 1) { out.push(p); continue; }
    // 콜 결과: 상태 탭(CRM관리) 행에 적힌 것이 있으면 그것 (거기서 고치면 바로 반영), 없으면 시도가 가장 많이 적힌 행
    const st = statusTab ? g.find((r) => r.tab === statusTab) : undefined;
    const best = st && st.attempts > 0 ? st : g.reduce((m, r) => (r.attempts > m.attempts ? r : m), p);
    const calls = best.calls;
    const { status, attempts, last } = leadStatus(calls);
    const subMap = new Map<string, Submission>();
    for (const r of g) for (const sb of r.subs) { const k = sb.id || `t:${sb.at ?? ""}|${sb.tab}`; if (!subMap.has(k)) subMap.set(k, sb); }
    const subs = Array.from(subMap.values()).sort((a, b) => byTime(a.at, b.at));
    const times = subs.map((x) => x.at).filter((x): x is string => !!x).sort();
    const first = (k: "name" | "platform" | "campaign" | "form" | "memo" | "id") => g.map((r) => r[k]).find(Boolean) ?? "";
    const channels = uniq(g.flatMap((r) => r.channels));
    out.push({
      ...p,
      id: first("id"),
      tabs: uniq(g.flatMap((r) => r.tabs)),
      createdAt: times[0] ?? null,
      lastAt: times[times.length - 1] ?? null,
      channel: p.channel || channels[0] || "",
      channels,
      subs,
      name: first("name"),
      platform: first("platform"),
      campaign: first("campaign"),
      form: first("form"),
      calls,
      memo: st?.memo || first("memo"),
      note: uniq(g.flatMap((r) => r.note.split(/\r?\n/)).map((l) => l.trim()).filter(Boolean)).join("\n"),
      status,
      attempts,
      last,
    });
  }
  return out.sort((a, b) => byTime(a.lastAt ?? a.createdAt, b.lastAt ?? b.createdAt));
}

export type ParsedSheet = { leads: CallLead[]; rows: number; masterTab: string | null; statusTab: string | null; ignoredTabs: string[]; tabs: string[] };

/** 모든 탭 → 파생 탭 제외 → 전화번호로 합침 → 최근 신청 순 */
export function buildLeads(tabs: SheetTab[]): ParsedSheet {
  const ignoredTabs = tabs.filter(isDerivedTab).map((t) => t.name);
  const usable = tabs.filter((t) => !isDerivedTab(t));
  const masterTab = usable.find((t) => MASTER_TABS.includes(t.name.trim()))?.name ?? null;
  const statusTab = usable.find((t) => STATUS_TABS.includes(t.name.trim()))?.name ?? null;
  const rows = usable.flatMap(parseTab);
  const leads = mergeLeads(rows, masterTab, statusTab);
  return { leads, rows: rows.length, masterTab, statusTab, ignoredTabs, tabs: uniq(rows.map((r) => r.tab)) };
}

/** (호환) 모든 탭 → 합쳐진 리드 목록 */
export function parseTabs(tabs: SheetTab[]): CallLead[] {
  return buildLeads(tabs).leads;
}

const DAYS = 14;
const channelLabel = (c: Channel) => (c ? CHANNEL_KO[c] : "채널 미상");

export function summarize(leads: CallLead[], rows = leads.length): CallsSummary {
  const byStatus = emptyByStatus();
  const attempts: [number, number, number, number] = [0, 0, 0, 0];
  const tabMap = new Map<string, TabSummary>();
  const chMap = new Map<string, TabSummary>();
  const dayMap = new Map<string, DaySummary>();
  const bump = (m: Map<string, TabSummary>, k: string, l: CallLead) => {
    const t = m.get(k) ?? { tab: k, total: 0, done: 0, missed: 0, invalid: 0, callback: 0, pending: 0 };
    t.total++;
    if (l.status === "done") t.done++;
    else if (l.status === "missed") t.missed++;
    else if (l.status === "invalid") t.invalid++;
    else if (l.status === "callback") t.callback++;
    else if (l.status === "pending") t.pending++;
    m.set(k, t);
  };
  let withMemo = 0, submissions = 0, resubmitted = 0, crossChannel = 0;
  const since = kstDay(new Date(Date.now() - (DAYS - 1) * 86_400_000).toISOString());
  for (const l of leads) {
    byStatus[l.status]++;
    attempts[Math.min(3, l.attempts)]++;
    if (l.memo) withMemo++;
    bump(tabMap, l.tab, l);
    bump(chMap, channelLabel(l.channel), l);
    submissions += l.subs.length;
    if (l.subs.length > 1) resubmitted++;
    if (l.channels.length > 1) crossChannel++;
    const firstAt = l.createdAt;
    for (const sb of l.subs) {
      const day = kstDay(sb.at);
      if (!day || day < since) continue;
      const d = dayMap.get(day) ?? { day, total: 0, web: 0, meta: 0, fresh: 0, again: 0 };
      d.total++;
      if (sb.channel === "web") d.web++;
      else if (sb.channel === "meta") d.meta++;
      if (sb.at === firstAt) d.fresh++;
      else d.again++;
      dayMap.set(day, d);
    }
  }
  return {
    total: leads.length,
    rows,
    submissions,
    resubmitted,
    crossChannel,
    byStatus,
    attempts,
    withMemo,
    byTab: Array.from(tabMap.values()),
    byChannel: Array.from(chMap.values()).sort((a, b) => b.total - a.total),
    byDay: Array.from(dayMap.values()).sort((a, b) => b.day.localeCompare(a.day)),
  };
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
