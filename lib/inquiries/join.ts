import type { InquiryRow } from "@/components/admin/InquiryDetail";
import { fmtDate } from "@/lib/admin/format";
import { entryLabel, eventsOf, isPrereg } from "@/lib/inquiries/track";
import { QUESTION_BY_KEY, PRIORITY_DESC, ageOf, displayMatchAnswer, type MatchAnswers } from "@/lib/match/schema";

/**
 * 가입 신청 (2026-11-23 사용자 요청) — 프로필 진단 설문(/match-check)으로 들어온 응답은 모두 「라움소셜클럽 가입 요청자」로 본다:
 * 플로팅 버튼(소셜클럽 사전등록하기, /match-check?src=prereg)·초대코드를 적은 응답·그 전(2026-11-20 이전)의 /match-check 직접 제출까지 같은 설문이므로 한 묶음.
 * 상담 신청(/fit-check)·상담 전 설문(/apply)은 어드민 「상담 신청」에, 가입 신청은 어드민 「가입 신청」(/admin/join)에 따로 보인다.
 * - 승인: 관리자가 「가입 승인」을 누르면 inquiries.approved_at·approved_by 가 적히고 「가입완료」로 바뀐다(되돌리기 가능). 상담 상태(status)와는 별개.
 * - 프로필 카드: 설문 답(answers.match)과 사진으로 만든 회원 카드(/admin/join/:id). 가입완료 회원도 언제든 같은 화면에서 본다.
 */
export const isJoinRequest = (r: Pick<InquiryRow, "answers">): boolean => r.answers?.form === "match";

export type JoinState = "pending" | "approved";
export type JoinRowFields = Pick<InquiryRow, "answers"> & { approved_at?: string | null; approved_by?: string | null };
export const joinState = (r: { approved_at?: string | null }): JoinState => (r.approved_at ? "approved" : "pending");
export const JOIN_STATE_KO: Record<JoinState, string> = { pending: "승인 대기", approved: "가입완료" };

export type JoinFilter = "" | JoinState;
export const JOIN_FILTERS: { value: JoinFilter; label: string }[] = [
  { value: "", label: "전체" },
  { value: "pending", label: "승인 대기" },
  { value: "approved", label: "가입완료" },
];
export const parseJoinFilter = (v: string | null | undefined): JoinFilter => (v === "pending" || v === "approved" ? v : "");

/** 어떤 경로로 들어온 가입 신청인지 (목록 배지) */
export function joinSourceLabel(r: Pick<InquiryRow, "answers">): string {
  const code = r.answers?.inviteCode;
  const evs = eventsOf(r);
  if (evs.length) {
    const last = evs[evs.length - 1];
    const more = evs.length > 1 ? ` 외 ${evs.length - 1}건` : "";
    return `참여 신청 · ${last.title}${more}${code ? ` · 초대코드 ${code}` : ""}`;
  }
  if (isPrereg(r)) return code ? `사전등록 · 초대코드 ${code}` : "사전등록";
  return code ? `초대코드 ${code}` : "프로필 진단";
}

/** 목록 필터: 승인 상태 + 이름·연락처 검색 */
export function matchesJoin(r: JoinRowFields & Pick<InquiryRow, "name" | "phone">, state: JoinFilter, q: string): boolean {
  if (!isJoinRequest(r)) return false;
  if (state && joinState(r) !== state) return false;
  const needle = q.trim().toLowerCase().replace(/-/g, "");
  if (!needle) return true;
  return [r.name ?? "", (r.phone ?? "").replace(/-/g, ""), r.answers?.inviteCode ?? "", ...eventsOf(r).map((e) => e.title)].some((v) => v.toLowerCase().includes(needle));
}

/** 설문 원본(answers.match). 원본이 없는 옛 행은 평탄화 목록(answers.answers[])에서 키별 답을 되살린다 */
export function matchAnswersOf(r: Pick<InquiryRow, "answers">): MatchAnswers {
  const a = r.answers;
  if (!a) return {};
  if (a.match && typeof a.match === "object") return a.match;
  const out: MatchAnswers = {};
  for (const x of a.answers ?? []) if (x.key && x.answer) out[x.key] = x.answer;
  return out;
}

export type CardRow = { label: string; value: string };
export type CardSection = { title: string; rows: CardRow[] };
export type ProfileCard = {
  name: string;
  /** "남성 · 만 36세 (1989-01-06)" 같은 한 줄 */
  headline: string;
  phone: string;
  email: string;
  photos: number;
  state: JoinState;
  approvedAt: string | null;
  sections: CardSection[];
};

const val = (m: MatchAnswers, key: string): string => {
  const q = QUESTION_BY_KEY[key];
  return q ? displayMatchAnswer(q, m) : String(m[key] ?? "").trim();
};
const row = (label: string, value: string): CardRow[] => (value ? [{ label, value }] : []);

/** 회원 프로필 카드 — 섹션별 (답이 있는 항목만). 민감정보(종교·건강)는 별도 동의가 있어 저장된 경우에만 값이 있다 */
export function profileCard(r: InquiryRow & { approved_at?: string | null }): ProfileCard {
  const m = matchAnswersOf(r);
  const a = r.answers ?? {};
  const birth = String(m.birth ?? "").trim();
  const age = birth ? ageOf(birth) : null;
  const headline = [val(m, "gender"), age != null ? `만 ${age}세` : "", birth ? `(${birth})` : ""].filter(Boolean).join(" · ").replace(" · (", " (");
  const home = [val(m, "homeSido"), val(m, "homeGugun")].filter(Boolean).join(" ");
  const active = [val(m, "idealRegions"), val(m, "idealGugun") ? `(${val(m, "idealGugun")})` : ""].filter(Boolean).join(" ");
  const pri = Array.isArray(m.priorities) ? m.priorities : [];
  const sections: CardSection[] = [
    { title: "기본 정보", rows: [...row("성별", val(m, "gender")), ...row("생년월일", val(m, "birth")), ...row("혼인 상태", val(m, "marital")), ...row("자녀 유무", val(m, "children")), ...row("키", val(m, "height")), ...row("체중", val(m, "weight")), ...row("MBTI", val(m, "mbti"))] },
    { title: "거주 · 활동", rows: [...row("거주지역", home), ...row("활동 가능 지역", active)] },
    { title: "학력 · 직업 · 경제", rows: [...row("학력", val(m, "education")), ...row("대학명", val(m, "univName")), ...row("직업", val(m, "jobCategory")), ...row("직업 상세", val(m, "jobDetail")), ...row("고용형태", val(m, "employment")), ...row("연 소득", val(m, "income")), ...row("본인 자산", val(m, "assets"))] },
    { title: "생활", rows: [...row("흡연", val(m, "smoking")), ...row("주량", val(m, "drinking")), ...row("외모 자기평가", val(m, "look")), ...row("종교 (민감정보)", val(m, "religion")), ...row("신체적 특이사항 (민감정보)", val(m, "health"))] },
    { title: "만남에서 중요하게 생각하는 항목", rows: pri.map((p, i) => ({ label: `${i + 1}순위`, value: PRIORITY_DESC[p] ? `${p} — ${PRIORITY_DESC[p]}` : p })) },
    {
      title: "접수 정보",
      rows: [
        ...eventsOf(r).map((e) => ({ label: "참여 신청 행사", value: `${e.title}${e.at ? ` · ${fmtDate(e.at, true)}` : ""}` })),
        ...row("알게 된 경로", val(m, "source")),
        ...row("초대코드", a.inviteCode ?? ""),
        ...row("들어온 경로", entryLabel(r)),
        ...row("접수일", fmtDate(r.created_at, true)),
        ...row("개인정보 동의", a.consentAt ? `${fmtDate(a.consentAt, true)}${a.consentVersion ? ` · 동의문 ${a.consentVersion}` : ""}` : ""),
        ...row("민감정보 동의", a.sensitiveConsentAt ? fmtDate(a.sensitiveConsentAt, true) : ""),
        ...(a.marketing === true ? row("마케팅 수신", `동의${a.marketingAt ? ` · ${fmtDate(a.marketingAt, true)}` : ""}`) : a.marketing === false ? row("마케팅 수신", "미동의") : []),
        ...row("유입 광고", r.utm?.utm_source ? [r.utm.utm_source, r.utm.utm_medium, r.utm.utm_campaign].filter(Boolean).join(" / ") : ""),
      ],
    },
  ].filter((s) => s.rows.length > 0);
  return {
    name: r.name || String(m.name ?? "") || "이름 없음",
    headline,
    phone: r.phone || String(m.phone ?? ""),
    email: r.email ?? "",
    photos: a.photos?.length ?? (a.photo ? 1 : 0),
    state: joinState(r),
    approvedAt: r.approved_at ?? null,
    sections,
  };
}
