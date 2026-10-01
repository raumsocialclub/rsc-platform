import type { ProgramKind, Session } from "./types";

/** 모든 날짜 표시는 한국 시간(Asia/Seoul) 기준. Vercel 서버는 UTC 라서 반드시 timeZone 을 지정한다. */
const TZ = "Asia/Seoul";
const DOW = ["일", "월", "화", "수", "목", "금", "토"];

type Parts = { y: number; m: number; d: number; hh: number; mm: number; dow: number };

export function kstParts(iso: string): Parts {
  const f = new Intl.DateTimeFormat("en-US", {
    timeZone: TZ,
    year: "numeric",
    month: "numeric",
    day: "numeric",
    hour: "numeric",
    minute: "numeric",
    hour12: false,
    weekday: "short",
  });
  const map: Record<string, string> = {};
  for (const p of f.formatToParts(new Date(iso))) map[p.type] = p.value;
  const dowIdx = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(map.weekday);
  return {
    y: Number(map.year),
    m: Number(map.month),
    d: Number(map.day),
    hh: Number(map.hour) % 24,
    mm: Number(map.minute),
    dow: dowIdx < 0 ? 0 : dowIdx,
  };
}

const pad = (n: number) => String(n).padStart(2, "0");

/** "9.20 (토)" */
export function fmtDay(iso: string): string {
  const p = kstParts(iso);
  return `${p.m}.${p.d} (${DOW[p.dow]})`;
}

/** "10:00" */
export function fmtTime(iso: string): string {
  const p = kstParts(iso);
  return `${pad(p.hh)}:${pad(p.mm)}`;
}

/** "2026.09.20 (토) 10:00" */
export function fmtFull(iso: string): string {
  const p = kstParts(iso);
  return `${p.y}.${pad(p.m)}.${pad(p.d)} (${DOW[p.dow]}) ${pad(p.hh)}:${pad(p.mm)}`;
}

/** 목록 카드·테이블용 일정 문구. 단일: "9.20 (토)" / "10:00", 시즌: "10.4 ~ 11.8" / "매주 토 19:30" */
export function scheduleText(kind: ProgramKind, sessions: Pick<Session, "starts_at">[]): { date: string; time: string } {
  const sorted = [...sessions].sort((a, b) => a.starts_at.localeCompare(b.starts_at));
  if (sorted.length === 0) return { date: "일정 미정", time: "" };
  const first = sorted[0];
  if (kind === "season" && sorted.length > 1) {
    const last = sorted[sorted.length - 1];
    const a = kstParts(first.starts_at);
    const b = kstParts(last.starts_at);
    const sameDow = sorted.every((s) => kstParts(s.starts_at).dow === a.dow);
    return {
      date: `${a.m}.${a.d} ~ ${b.m}.${b.d}`,
      time: `${sameDow ? `매주 ${DOW[a.dow]} ` : `${sorted.length}회 `}${fmtTime(first.starts_at)}`,
    };
  }
  return { date: fmtDay(first.starts_at), time: fmtTime(first.starts_at) };
}

/** <input type=date> + <input type=time> 값 → KST ISO 문자열 */
export function toKstIso(date: string, time: string): string | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !/^\d{2}:\d{2}$/.test(time)) return null;
  const d = new Date(`${date}T${time}:00+09:00`);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

/** ISO → { date: "2026-09-20", time: "10:00" } (KST) */
export function fromKstIso(iso: string): { date: string; time: string } {
  const p = kstParts(iso);
  return { date: `${p.y}-${pad(p.m)}-${pad(p.d)}`, time: `${pad(p.hh)}:${pad(p.mm)}` };
}

/** date 문자열에 n일 더하기 (시즌 6주 자동 채움용) */
export function addDays(date: string, n: number): string {
  const d = new Date(`${date}T00:00:00+09:00`);
  d.setUTCDate(d.getUTCDate() + n);
  const p = kstParts(d.toISOString());
  return `${p.y}-${pad(p.m)}-${pad(p.d)}`;
}

export function won(n: number): string {
  return n.toLocaleString("ko-KR") + "원";
}
