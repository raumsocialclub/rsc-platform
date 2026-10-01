/**
 * 광고 유입(UTM) 값을 브라우저에 잠시 기억했다가 상담 신청에 붙인다. (개인정보 아님: 광고 매개변수만)
 * - 랜딩 시 주소에 utm_* 가 있으면 localStorage 에 저장 (마지막 유입 기준, 30일 보관)
 * - 상담 신청 제출 시 readUtm() 으로 꺼내 /api/inquiries 에 함께 보낸다
 */
export const UTM_KEYS = ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term"] as const;
export type Utm = Partial<Record<(typeof UTM_KEYS)[number], string>>;

const STORE = "rsc_utm";
const TTL_MS = 30 * 24 * 60 * 60 * 1000;

/** 주소의 검색 문자열에서 utm_* 만 뽑는다 (값은 100자까지). */
export function parseUtm(search: string): Utm {
  const sp = new URLSearchParams(search);
  const out: Utm = {};
  for (const k of UTM_KEYS) {
    const v = sp.get(k)?.trim().slice(0, 100);
    if (v) out[k] = v;
  }
  return out;
}

/** 현재 주소에 utm_* 가 있으면 저장한다. 없으면 이전 값을 그대로 둔다. */
export function captureUtm(search = typeof window !== "undefined" ? window.location.search : ""): void {
  const utm = parseUtm(search);
  if (Object.keys(utm).length === 0) return;
  try {
    localStorage.setItem(STORE, JSON.stringify({ ...utm, at: Date.now() }));
  } catch {}
}

/** 저장된 utm_* (30일 이내) 또는 현재 주소의 값. 없으면 null. */
export function readUtm(): Utm | null {
  const now = parseUtm(typeof window !== "undefined" ? window.location.search : "");
  if (Object.keys(now).length) return now;
  try {
    const raw = localStorage.getItem(STORE);
    if (!raw) return null;
    const j = JSON.parse(raw) as Utm & { at?: number };
    if (!j.at || Date.now() - j.at > TTL_MS) return null;
    const out: Utm = {};
    for (const k of UTM_KEYS) if (typeof j[k] === "string" && j[k]) out[k] = j[k];
    return Object.keys(out).length ? out : null;
  } catch {
    return null;
  }
}
