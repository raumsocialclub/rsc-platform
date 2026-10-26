/**
 * 콜 현황 대시보드 (M18): 구글 시트(CRM)에 적는 1차·2차·3차 콜 결과와 인터뷰 메모를 어드민 한 화면에서 본다.
 * 시트 셀에 적힌 글을 아래 상태로 분류한다. 분류는 표시용일 뿐 시트는 바꾸지 않는다.
 */
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

export type CallField = "call1" | "call2" | "call3" | "memo" | "new";
export const FIELD_KO: Record<CallField, string> = { call1: "1차 콜", call2: "2차 콜", call3: "3차 콜", memo: "인터뷰 메모", new: "새 신청" };

export type CallLead = {
  key: string;                       // "<탭>|<id>" 또는 "<탭>|p:<전화 해시>" — DB 에는 이 키와 상태만 저장
  tab: string;                       // 시트 탭 이름 (웹사이트 · 10/22 …)
  id: string;
  createdAt: string | null;          // ISO
  name: string;
  phone: string;
  platform: string;                  // ig · fb · (웹사이트는 비어 있음)
  campaign: string;
  form: string;
  calls: [string, string, string];   // 1차·2차·3차 셀 원문
  memo: string;                      // 인터뷰 내용 원문
  status: CallStatus;                // 종합 상태 (통화완료가 하나라도 있으면 통화완료, 아니면 마지막 시도 기준)
  attempts: number;                  // 0~3
  last: string;                      // 마지막 시도 셀 원문
};

export type CallEvent = { id: number; key: string; tab: string; field: CallField; before: string; after: string; at: string; name: string };

export type TabSummary = { tab: string; total: number; done: number; missed: number; invalid: number; callback: number; pending: number };
export type CallsSummary = { total: number; byStatus: Record<CallStatus, number>; attempts: [number, number, number, number]; withMemo: number; byTab: TabSummary[] };
export type MemoGroup = { label: string; count: number; names: string[] };

export type CallsData = {
  ok: true;
  fetchedAt: string;                 // 시트를 읽은 시각
  sheetUrl: string | null;
  tabs: string[];
  leads: CallLead[];
  summary: CallsSummary;
  memos: MemoGroup[];
  events: CallEvent[];               // 최근 변경 (service role 키가 있을 때만 기록)
  eventsEnabled: boolean;
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
