import type { InquiryRow } from "@/components/admin/InquiryDetail";

/**
 * 상담 신청의 「관심 방식」(소셜클럽 · 1:1 매칭 · 상담 후 결정)과 「들어온 경로」(어느 페이지에서 상담 신청으로 넘어왔는지).
 * 간단 상담 신청(/fit-check)이 answers.track · answers.entryTrack · answers.entryPath 로 저장하고, 어드민 목록·상세·필터·CSV 가 같은 규칙으로 읽는다.
 * 2026-11-09 이전 신청은 answers.route 의 한글 라벨만 있으므로 라벨에서 방식을 되짚는다.
 */
export const TRACKS = ["social", "matching", "undecided"] as const;
export type Track = (typeof TRACKS)[number];
export const TRACK_KO: Record<Track, string> = { social: "소셜클럽", matching: "1:1 매칭", undecided: "상담 후 결정" };
/** 어드민 필터 값: "" 전체 · 방식 셋 · "-" 기록 없음(설문형·예전 신청) */
export type TrackFilter = "" | Track | "-";
export const TRACK_FILTERS: { value: TrackFilter; label: string }[] = [
  { value: "", label: "전체 방식" },
  { value: "social", label: "소셜클럽" },
  { value: "matching", label: "1:1 매칭" },
  { value: "undecided", label: "상담 후 결정" },
  { value: "-", label: "방식 기록 없음" },
];

export const parseTrack = (v: unknown): Track | null => (TRACKS as readonly string[]).includes(String(v)) ? (v as Track) : null;
export const parseTrackFilter = (v: string | null | undefined): TrackFilter => (v === "-" || parseTrack(v) ? (v as TrackFilter) : "");

/** 신청에 기록된 관심 방식. 새 신청은 answers.track, 예전 신청은 route 라벨로 되짚고, 설문형(/apply)·그 밖은 null */
export function inquiryTrack(r: Pick<InquiryRow, "answers">): Track | null {
  const a = r.answers ?? {};
  const t = parseTrack(a.track);
  if (t) return t;
  if (a.form === "apply") return null;
  const route = a.route ?? "";
  if (/소셜클럽/.test(route)) return "social";
  if (/1:1/.test(route)) return "matching";
  if (/상담 후/.test(route)) return "undecided";
  return null;
}
export const trackLabel = (r: Pick<InquiryRow, "answers">): string => { const t = inquiryTrack(r); return t ? TRACK_KO[t] : ""; };
export const matchesTrack = (r: Pick<InquiryRow, "answers">, f: TrackFilter): boolean => (f === "" ? true : f === "-" ? inquiryTrack(r) === null : inquiryTrack(r) === f);

/** 사이트 안 경로 → 사람이 읽는 페이지 이름 */
const PAGE_KO: [RegExp, string][] = [
  [/^\/$/, "메인"], [/^\/social/, "소셜클럽 페이지"], [/^\/matching/, "1:1 매칭 페이지"], [/^\/news/, "소식"], [/^\/benefits/, "혜택 안내"], [/^\/pricing/, "멤버십 안내"], [/^\/fit-check/, "상담 신청 화면"],
];
/**
 * 들어온 경로 라벨. entryPath 는 같은 사이트면 "/social" 같은 경로, 다른 사이트에서 바로 왔으면 "ext:instagram.com", 없으면 "".
 * entryTrack 은 /fit-check?track= 으로 미리 선택된 방식(어느 상담 버튼을 눌렀는지).
 */
export function entryLabel(r: Pick<InquiryRow, "answers">): string {
  const a = r.answers ?? {};
  const path = a.entryPath ?? "";
  const btn = parseTrack(a.entryTrack);
  let where = "";
  if (path.startsWith("ext:")) where = `외부 링크 (${path.slice(4)})`;
  else if (path) where = PAGE_KO.find(([re]) => re.test(path))?.[1] ?? path;
  const button = btn && btn !== "undecided" ? `${TRACK_KO[btn]} 상담 버튼` : "";
  if (!where && !button) return a.track ? "직접 접속 · 링크" : "";
  return [where, button].filter(Boolean).join(" · ");
}

/** 브라우저에서 제출 직전에 들어온 경로를 만든다. 같은 사이트 → 경로, 다른 사이트 → ext:호스트, 없으면 "" */
export function entryPathFromReferrer(referrer: string, origin: string): string {
  if (!referrer) return "";
  try {
    const u = new URL(referrer);
    if (u.origin === origin) return u.pathname.slice(0, 120);
    return `ext:${u.hostname.toLowerCase()}`.slice(0, 120);
  } catch {
    return "";
  }
}
/** 서버 저장 전 정리: 사이트 경로("/..."), 외부 호스트("ext:host") 꼴만 허용 */
export const ENTRY_PATH_RE = /^(\/[A-Za-z0-9\-._~/%]*|ext:[a-z0-9.\-]+)$/;
export const cleanEntryPath = (v: unknown): string => (typeof v === "string" && v.length <= 120 && ENTRY_PATH_RE.test(v) ? v : "");
