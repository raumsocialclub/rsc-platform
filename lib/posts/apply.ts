/**
 * 소식 「참여하기」 (M24, 2026-11-25 사용자 요청) — 클라이언트·서버 공용(의존성 없음).
 * 소식 목록 카드·상세의 「참여하기」 버튼 → 사전등록 설문(/match-check?src=prereg&event=<글 주소>).
 * - 처음인 사람: 3분 프로필 설문을 마치면 POST /api/match 가 event_applications 에 한 건(source=survey) 넣는다.
 * - 이미 설문을 제출한 사람(어드민에 있는 사람): 첫 화면에서 휴대폰 번호만 입력 → POST /api/events/apply 가 기존 행으로 한 건(source=quick).
 * - 글마다 posts.apply_open 으로 버튼을 끌 수 있고(공지 등), 행사 일자(event_date)가 지난 글은 「참여 종료」(비활성)로 보이며 서버도 받지 않는다.
 * 신청자 DB 는 어드민 「프로그램 참여 신청」(/admin/events)에서 참석 확정·취소·CSV 로 관리한다(lib/events/admin.ts).
 */
export const EVENT_PARAM = "event";
export const PREREG_QUERY = "src=prereg";

export type PostEvent = { slug: string; title: string };

export const APPLY_STATUSES = ["applied", "confirmed", "cancelled"] as const;
export type ApplyStatus = (typeof APPLY_STATUSES)[number];
export const APPLY_STATUS_KO: Record<ApplyStatus, string> = { applied: "신청", confirmed: "참석 확정", cancelled: "취소" };
export const APPLY_SOURCE_KO: Record<"quick" | "survey", string> = { quick: "휴대폰 확인(바로 신청)", survey: "설문 제출" };
export const parseApplyStatus = (v: unknown): ApplyStatus | null => (APPLY_STATUSES as readonly string[]).includes(String(v)) ? (v as ApplyStatus) : null;

/** 한 사람의 참여 신청 기록(어드민 가입 신청·프로필 카드 표시용) */
export type EventEntry = PostEvent & { id?: string; at: string; status?: ApplyStatus; source?: "quick" | "survey" };

export const applyHref = (slug: string) => `/match-check?${PREREG_QUERY}&${EVENT_PARAM}=${encodeURIComponent(slug)}`;

/** 오늘(KST) "YYYY-MM-DD" */
export const kstToday = (now = Date.now()) => new Date(now + 9 * 3600_000).toISOString().slice(0, 10);

export type ApplyState = "open" | "closed" | "off";
/**
 * 글의 참여 신청 상태: off = 발행 전이거나 버튼을 끈 글(버튼 없음) · closed = 행사 일자가 오늘(KST)보다 전(「참여 종료」 비활성 버튼) · open = 신청 가능.
 * 행사 일자가 없는 글은 끄기 전까지 열려 있다. 행사 당일까지는 열려 있다.
 */
export function applyState(p: { published: boolean; apply_open?: boolean | null; event_date?: string | null }, today = kstToday()): ApplyState {
  if (!p.published || p.apply_open === false) return "off";
  const d = p.event_date ? p.event_date.slice(0, 10) : "";
  if (/^\d{4}-\d{2}-\d{2}$/.test(d) && d < today) return "closed";
  return "open";
}
/** 지금 신청을 받는 글인지 */
export const canApply = (p: { published: boolean; apply_open?: boolean | null; event_date?: string | null }, today?: string): boolean => applyState(p, today) === "open";

/** ?event= 값 정리(글 주소 규칙과 같은 문자만, 120자) */
export const cleanEventSlug = (v: unknown): string => (typeof v === "string" && v.length <= 120 && /^[\p{L}\p{N}-]+$/u.test(v) ? v : "");

/** 소식 제목을 {event} 자리에 넣는다 */
export const fillEvent = (text: string, title: string) => text.replace(/\{event\}/g, title);
