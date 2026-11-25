/**
 * 소식 「참여하기」 (M24, 2026-11-25 사용자 요청) — 클라이언트·서버 공용(의존성 없음).
 * 소식 목록 카드·상세의 「참여하기」 버튼 → 사전등록 설문(/match-check?src=prereg&event=<글 주소>).
 * - 처음인 사람: 3분 프로필 설문을 마치면 POST /api/match 가 answers.events[] 에 이 소식을 붙여 저장 → 어드민 「가입 신청」에 「참여 신청 · 글 제목」.
 * - 이미 설문을 제출한 사람(어드민에 있는 사람): 첫 화면에서 휴대폰 번호만 입력 → POST /api/events/apply 가 기존 행의 answers.events[] 에 붙인다(설문 다시 안 함).
 * 글마다 posts.apply_open 으로 버튼을 끌 수 있다(공지 등).
 */
export const EVENT_PARAM = "event";
export const PREREG_QUERY = "src=prereg";

export type PostEvent = { slug: string; title: string };
/** 참여 신청 기록 한 건(inquiries.answers.events[] 원소) */
export type EventEntry = PostEvent & { at: string };

export const applyHref = (slug: string) => `/match-check?${PREREG_QUERY}&${EVENT_PARAM}=${encodeURIComponent(slug)}`;

/** 공개 화면에 「참여하기」 버튼을 보일 글인지 */
export const canApply = (p: { published: boolean; apply_open?: boolean | null }): boolean => p.published && p.apply_open !== false;

/** ?event= 값 정리(글 주소 규칙과 같은 문자만, 120자) */
export const cleanEventSlug = (v: unknown): string => (typeof v === "string" && v.length <= 120 && /^[\p{L}\p{N}-]+$/u.test(v) ? v : "");

/** 소식 제목을 {event} 자리에 넣는다 */
export const fillEvent = (text: string, title: string) => text.replace(/\{event\}/g, title);
