/**
 * 콜 현황 대시보드 (M18): 구글 시트(CRM)에 적는 1차·2차·3차 콜 결과와 인터뷰 메모를 어드민 한 화면에서 본다.
 * 시트 셀에 적힌 글을 아래 상태로 분류한다. 분류는 표시용일 뿐 시트는 바꾸지 않는다.
 */
import type { InsightReport } from "./insights";

export type CallStatus = "done" | "callback" | "missed" | "invalid" | "declined" | "other" | "pending";

export const STATUS_ORDER: CallStatus[] = ["done", "callback", "missed", "invalid", "declined", "other", "pending"];
export const STATUS_KO: Record<CallStatus, string> = {
  done: "통화완료",
  callback: "재통화 예정",
  missed: "부재중",
  invalid: "없는 번호",
  declined: "거절·보류",
  other: "기타",
  pending: "미진행",
};

export type CallField = "call1" | "call2" | "call3" | "memo" | "note" | "new";
export const FIELD_KO: Record<CallField, string> = { call1: "1차 콜", call2: "2차 콜", call3: "3차 콜", memo: "인터뷰 내용", note: "인터뷰 노트", new: "새 신청" };

/** 수집 채널: 홈페이지 신청(id 가 UUID, form_id rsc-website) / 메타 리드 폼(id 가 l:…) / 모름 */
export type Channel = "web" | "meta" | "";
export const CHANNEL_KO: Record<Exclude<Channel, "">, string> = { web: "홈페이지", meta: "메타" };

/** 한 사람의 신청 한 건 (같은 사람이 여러 탭·여러 번 신청한 것을 전화번호로 합칠 때 원본 단위) */
export type Submission = { id: string; at: string | null; channel: Channel; tab: string };

export type CallLead = {
  key: string;                       // "p:<전화 sha256 앞 16자>" — 전화번호가 같으면 탭·채널이 달라도 한 사람. DB 에는 이 키와 상태만 저장
  tab: string;                       // 대표 탭 (마스터 탭이 있으면 그 탭, 아니면 가장 최근 신청 탭)
  tabs: string[];                    // 이 사람이 들어 있는 모든 탭
  id: string;
  createdAt: string | null;          // 최초 신청 ISO
  lastAt: string | null;             // 최근 신청 ISO (재신청이 없으면 createdAt 과 같음)
  channel: Channel;                  // 대표 채널
  channels: Channel[];               // 신청한 채널들 (홈페이지·메타 둘 다면 채널 중복)
  subs: Submission[];                // 신청 원본 목록 (같은 신청 id 가 여러 탭에 복사돼 있어도 1건)
  name: string;
  phone: string;
  platform: string;                  // ig · fb · (웹사이트는 비어 있음)
  campaign: string;
  form: string;
  calls: [string, string, string];   // 1차·2차·3차 셀 원문
  memo: string;                      // 「인터뷰 내용」 칸 원문
  note: string;                      // 그 행의 셀에 붙인 노트(노란 말풍선) 원문. 여러 칸이면 줄바꿈으로 이어 붙임
  status: CallStatus;                // 종합 상태 (통화완료가 하나라도 있으면 통화완료, 아니면 마지막 시도 기준)
  attempts: number;                  // 0~3
  last: string;                      // 마지막 시도 셀 원문
};

export type CallEvent = { id: number; key: string; tab: string; field: CallField; before: string; after: string; at: string; name: string };

export type TabSummary = { tab: string; total: number; done: number; missed: number; invalid: number; callback: number; pending: number };
export type DaySummary = { day: string; total: number; web: number; meta: number; fresh: number; again: number }; // 신청 건 단위 (KST 날짜)
export type CallsSummary = {
  total: number;                     // 고유 고객 수 (전화번호 기준 중복 제거 후)
  rows: number;                      // 시트에서 읽은 신청 행 수 (중복 제거 전)
  submissions: number;               // 신청 건수 (같은 id 복사본 제외)
  resubmitted: number;               // 두 번 이상 신청한 고객
  crossChannel: number;              // 홈페이지·메타 양쪽에 신청한 고객
  byStatus: Record<CallStatus, number>;
  attempts: [number, number, number, number];
  withMemo: number;
  byTab: TabSummary[];
  byChannel: TabSummary[];           // tab 칸에 채널 이름(홈페이지·메타·채널 미상)
  byDay: DaySummary[];               // 최근 14일, 최신순
};
export type MemoGroup = { label: string; count: number; names: string[] };

export type CallsData = {
  ok: true;
  fetchedAt: string;                 // 시트를 읽은 시각
  sheetUrl: string | null;
  tabs: string[];
  leads: CallLead[];
  summary: CallsSummary;
  memos: MemoGroup[];
  insights: InsightReport;           // 인터뷰 니즈 분석 (lib/crm/insights.ts)
  events: CallEvent[];               // 최근 변경 (service role 키가 있을 때만 기록)
  eventsEnabled: boolean;
  sheet: { notesSupported: boolean; noteCount: number; scriptVersion: number; updatedAt: string | null; source: "cache" | "live" | ""; masterTab: string | null; statusTab: string | null; ignoredTabs: string[] }; // 연결 진단 + 어떤 탭을 기준/무시했는지
};

/** 셀 한 칸의 글 → 상태. 운영진이 자유롭게 적으므로 키워드로 판단하고, 모르는 글은 "기타"로 두고 원문을 보여준다 */
export function classifyCell(raw: string): CallStatus {
  const t = raw.replace(/\s+/g, "").toLowerCase();
  if (!t) return "pending";
  if (/통화완료|통화됨|연결됨|상담완료|상담진행|통화함/.test(t)) return "done";
  if (/거절|거부|관심없|원치않|차단|보류|취소/.test(t)) return "declined";
  if (/없는번호|결번|번호없음|번호오류|잘못된번호|정지된/.test(t)) return "invalid";
  if (/부재|안받|미응답|응답없|무응답|안받음/.test(t)) return "missed";
  if (/^\d{1,2}시|^\d{3,4}$|^\d{1,2}:\d{2}|오전|오후|재통화|콜백|다시|문자|예정|요청/.test(t)) return "callback";
  if (/완료/.test(t)) return "done";
  return "other";
}

/** 1차·2차·3차 셀 → 종합 상태·시도 횟수·마지막 시도 */
export function leadStatus(calls: [string, string, string]): { status: CallStatus; attempts: number; last: string } {
  const filled = calls.map((c) => c.trim()).filter(Boolean);
  if (filled.length === 0) return { status: "pending", attempts: 0, last: "" };
  const last = filled[filled.length - 1];
  if (filled.some((c) => classifyCell(c) === "done")) return { status: "done", attempts: filled.length, last };
  return { status: classifyCell(last), attempts: filled.length, last };
}

export const emptyByStatus = (): Record<CallStatus, number> => ({ done: 0, callback: 0, missed: 0, invalid: 0, declined: 0, other: 0, pending: 0 });
