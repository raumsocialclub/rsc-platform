/**
 * 소식 게시판의 연도·월 탭 (M16). 클라이언트에서도 import 가능 — 서버 전용 모듈을 넣지 않는다.
 * 글의 "달"은 행사 일자(event_date, KST 날짜)가 있으면 그것, 없으면 발행일(published_at, KST 변환) 기준.
 */
import type { Post } from "./types";

export type YM = { y: number; m: number };
export type MonthLite = Pick<Post, "event_date" | "published_at">;

const TZ = "Asia/Seoul";

/** ISO 시각 → KST 날짜 "YYYY-MM-DD" */
export function kstDate(iso: string): string {
  const p = new Intl.DateTimeFormat("en-CA", { timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(new Date(iso));
  const g = (t: string) => p.find((x) => x.type === t)?.value ?? "";
  return `${g("year")}-${g("month")}-${g("day")}`;
}

/** 글의 기준 날짜 "YYYY-MM-DD" (행사 일자 우선). 둘 다 없으면 null */
export function postDate(p: MonthLite): string | null {
  if (p.event_date && /^\d{4}-\d{2}-\d{2}/.test(p.event_date)) return p.event_date.slice(0, 10);
  if (p.published_at) return kstDate(p.published_at);
  return null;
}

export function postMonth(p: MonthLite): YM | null {
  const d = postDate(p);
  if (!d) return null;
  return { y: Number(d.slice(0, 4)), m: Number(d.slice(5, 7)) };
}

/** 글이 있는 달 목록 (연도 내림차순, 월 오름차순) */
export function monthsOf(posts: MonthLite[]): YM[] {
  const seen = new Map<string, YM>();
  for (const p of posts) {
    const ym = postMonth(p);
    if (ym) seen.set(`${ym.y}-${ym.m}`, ym);
  }
  return [...seen.values()].sort((a, b) => b.y - a.y || a.m - b.m);
}

/** 오늘(KST) */
export function todayYM(now = new Date()): YM {
  const d = kstDate(now.toISOString());
  return { y: Number(d.slice(0, 4)), m: Number(d.slice(5, 7)) };
}

/**
 * 주소에 연도·월이 없을 때 기본으로 보여줄 달.
 * 이번 달에 글이 있으면 이번 달, 아니면 이번 달과 가장 가까운 달(같은 거리면 다가오는 달 우선). 글이 하나도 없으면 이번 달.
 */
export function pickDefaultMonth(months: YM[], today: YM): YM {
  if (months.length === 0) return today;
  const idx = (ym: YM) => ym.y * 12 + ym.m;
  const t = idx(today);
  let best = months[0];
  let bestScore = Infinity;
  for (const ym of months) {
    const diff = idx(ym) - t;
    const score = Math.abs(diff) * 2 + (diff < 0 ? 1 : 0); // 같은 거리면 미래(diff>0)를 우선
    if (score < bestScore) { best = ym; bestScore = score; }
  }
  return best;
}

/** 주소의 y·m 값을 정리. 잘못된 값이면 null */
export function parseYM(y?: string, m?: string): YM | null {
  const yy = Number(y), mm = Number(m);
  if (!Number.isInteger(yy) || !Number.isInteger(mm) || yy < 2000 || yy > 2100 || mm < 1 || mm > 12) return null;
  return { y: yy, m: mm };
}

/** 연도 선택지: 글이 있는 연도 + 올해 (내림차순) */
export function yearOptions(months: YM[], today: YM): number[] {
  return [...new Set([today.y, ...months.map((x) => x.y)])].sort((a, b) => b - a);
}

/** 그 달의 글만, 행사 일자 순(오름차순) */
export function filterMonth<T extends MonthLite>(posts: T[], ym: YM): T[] {
  return posts
    .filter((p) => { const x = postMonth(p); return !!x && x.y === ym.y && x.m === ym.m; })
    .sort((a, b) => (postDate(a) ?? "").localeCompare(postDate(b) ?? ""));
}

const DOW = ["일", "월", "화", "수", "목", "금", "토"];
/** "2026.10.02 (금)" — 행사 일자가 있으면 그 날, 없으면 발행일 */
export function fmtPostDate(p: MonthLite): string {
  const d = postDate(p);
  if (!d) return "";
  const dt = new Date(`${d}T00:00:00+09:00`);
  const wd = new Intl.DateTimeFormat("en-US", { timeZone: TZ, weekday: "short" }).format(dt);
  const dow = DOW[["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(wd)] ?? "";
  return `${d.replace(/-/g, ".")}${dow ? ` (${dow})` : ""}`;
}
