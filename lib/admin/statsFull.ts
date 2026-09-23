import { paymentBalance } from "@/lib/bookings/cancel";
import { kstParts } from "@/lib/programs/format";
import { createClient } from "@/lib/supabase/server";

/** 통계·리포트 집계 (M9). 기간은 KST 날짜(YYYY-MM-DD) 시작~끝(포함). */
export type Range = { from: string; to: string };
const pad = (n: number) => String(n).padStart(2, "0");
export const dayKey = (iso: string) => { const p = kstParts(iso); return `${p.y}-${pad(p.m)}-${pad(p.d)}`; };
export const todayKst = () => dayKey(new Date().toISOString());
export function shiftDay(day: string, n: number): string {
  const d = new Date(`${day}T00:00:00+09:00`);
  d.setUTCDate(d.getUTCDate() + n);
  return dayKey(d.toISOString());
}
export function rangeBounds(r: Range) {
  return { fromIso: new Date(`${r.from}T00:00:00+09:00`).toISOString(), toIso: new Date(`${shiftDay(r.to, 1)}T00:00:00+09:00`).toISOString() };
}
export function daysBetween(r: Range): string[] {
  const out: string[] = [];
  for (let d = r.from; d <= r.to && out.length < 400; d = shiftDay(d, 1)) out.push(d);
  return out;
}

export type Stats = {
  range: Range;
  revenue: { daily: { day: string; paid: number; refunded: number; net: number; count: number }[]; byProgram: { name: string; net: number; count: number }[]; byMethod: { method: string; net: number; count: number }[]; totals: { paid: number; refunded: number; net: number; count: number } };
  bookings: { byStatus: { status: string; count: number }[]; total: number };
  members: { daily: { day: string; count: number }[]; byProvider: { provider: string; count: number }[]; totals: { total: number; active: number; paused: number; withdrawn: number; inRange: number } };
  inquiries: { total: number; byStatus: { status: string; count: number }[] };
  traffic: { totals: { pv: number; uv: number; members: number }; daily: { day: string; pv: number; uv: number }[]; paths: { path: string; pv: number; uv: number }[]; referrers: { host: string; pv: number }[]; devices: { device: string; pv: number }[]; countries: { country: string; pv: number }[] } | null;
  funnel: { visitors: number; inquiries: number; signups: number; payers: number };
  logs: { id: number; ts: string; admin: string; action: string; target: string | null; detail: Record<string, unknown> | null }[];
};

const count = <T,>(rows: T[], key: (r: T) => string) => {
  const m = new Map<string, number>();
  for (const r of rows) m.set(key(r), (m.get(key(r)) ?? 0) + 1);
  return [...m.entries()].map(([k, v]) => ({ k, v })).sort((a, b) => b.v - a.v);
};

export async function fullStats(range: Range): Promise<Stats> {
  const supabase = await createClient();
  const { fromIso, toIso } = rangeBounds(range);
  const days = daysBetween(range);

  const [{ data: pays }, { data: books }, { data: members }, { data: inqs }, traffic, { data: logs }] = await Promise.all([
    supabase.from("payments").select("booking_id, member_id, amount, status, method, approved_at, raw").in("status", ["paid", "partial_cancelled", "cancelled"]).gte("approved_at", fromIso).lt("approved_at", toIso),
    supabase.from("bookings").select("id, program_id, member_id, status, created_at").gte("created_at", fromIso).lt("created_at", toIso),
    supabase.from("members").select("id, status, provider, created_at"),
    supabase.from("inquiries").select("id, status, created_at").gte("created_at", fromIso).lt("created_at", toIso),
    supabase.rpc("stats_page_views", { p_from: fromIso, p_to: toIso }),
    supabase.from("admin_logs").select("id, ts, admin_id, action, target, detail").order("ts", { ascending: false }).limit(50),
  ]);

  type Pay = { booking_id: string | null; member_id: string; amount: number; status: string; method: string | null; approved_at: string | null; raw: { balanceAmount?: number } | null };
  const payRows = (pays ?? []) as Pay[];
  const dailyMap = new Map(days.map((d) => [d, { day: d, paid: 0, refunded: 0, net: 0, count: 0 }]));
  const byBooking = new Map<string, number>();
  const byMethod = new Map<string, { net: number; count: number }>();
  let paid = 0, refunded = 0, net = 0;
  const payers = new Set<string>();
  for (const p of payRows) {
    const bal = paymentBalance(p);
    const d = dailyMap.get(dayKey(p.approved_at!));
    if (d) { d.paid += p.amount; d.refunded += p.amount - bal; d.net += bal; d.count += 1; }
    paid += p.amount; refunded += p.amount - bal; net += bal;
    if (p.booking_id) byBooking.set(p.booking_id, (byBooking.get(p.booking_id) ?? 0) + bal);
    const m = byMethod.get(p.method ?? "기타") ?? { net: 0, count: 0 };
    m.net += bal; m.count += 1; byMethod.set(p.method ?? "기타", m);
    if (bal > 0) payers.add(p.member_id);
  }
  // 프로그램별 (결제 기간 기준, 예약은 기간 밖일 수 있어 별도 조회)
  const bids = [...byBooking.keys()];
  const { data: bProg } = bids.length ? await supabase.from("bookings").select("id, program_id").in("id", bids) : { data: [] as { id: string; program_id: string }[] };
  const progNet = new Map<string, { net: number; count: number }>();
  for (const b of (bProg ?? []) as { id: string; program_id: string }[]) {
    const v = byBooking.get(b.id) ?? 0;
    const cur = progNet.get(b.program_id) ?? { net: 0, count: 0 };
    cur.net += v; cur.count += 1; progNet.set(b.program_id, cur);
  }
  const { data: progs } = progNet.size ? await supabase.from("programs").select("id, name").in("id", [...progNet.keys()]) : { data: [] as { id: string; name: string }[] };
  const pname = new Map((progs ?? []).map((p) => [p.id as string, p.name as string]));

  type Book = { id: string; status: string; member_id: string };
  const bookRows = (books ?? []) as Book[];
  type Mem = { id: string; status: string; provider: string | null; created_at: string };
  const memRows = (members ?? []) as Mem[];
  const memInRange = memRows.filter((m) => m.created_at >= fromIso && m.created_at < toIso);
  const memDaily = new Map(days.map((d) => [d, 0]));
  for (const m of memInRange) memDaily.set(dayKey(m.created_at), (memDaily.get(dayKey(m.created_at)) ?? 0) + 1);

  const tr = (traffic.data ?? null) as Stats["traffic"];
  const adminIds = [...new Set((logs ?? []).map((l) => l.admin_id as string).filter(Boolean))];
  const { data: admins } = adminIds.length ? await supabase.from("members").select("id, name").in("id", adminIds) : { data: [] as { id: string; name: string }[] };
  const aname = new Map((admins ?? []).map((a) => [a.id as string, a.name as string]));

  return {
    range,
    revenue: {
      daily: [...dailyMap.values()],
      byProgram: [...progNet.entries()].map(([id, v]) => ({ name: pname.get(id) ?? "—", ...v })).sort((a, b) => b.net - a.net),
      byMethod: [...byMethod.entries()].map(([method, v]) => ({ method, ...v })).sort((a, b) => b.net - a.net),
      totals: { paid, refunded, net, count: payRows.length },
    },
    bookings: { byStatus: count(bookRows, (b) => b.status).map((x) => ({ status: x.k, count: x.v })), total: bookRows.length },
    members: {
      daily: days.map((d) => ({ day: d, count: memDaily.get(d) ?? 0 })),
      byProvider: count(memInRange, (m) => m.provider ?? "email").map((x) => ({ provider: x.k, count: x.v })),
      totals: { total: memRows.length, active: memRows.filter((m) => m.status === "active").length, paused: memRows.filter((m) => m.status === "paused").length, withdrawn: memRows.filter((m) => m.status === "withdrawn").length, inRange: memInRange.length },
    },
    inquiries: { total: (inqs ?? []).length, byStatus: count((inqs ?? []) as { status: string }[], (i) => i.status).map((x) => ({ status: x.k, count: x.v })) },
    traffic: tr,
    funnel: { visitors: tr?.totals?.uv ?? 0, inquiries: (inqs ?? []).length, signups: memInRange.length, payers: payers.size },
    logs: ((logs ?? []) as { id: number; ts: string; admin_id: string | null; action: string; target: string | null; detail: Record<string, unknown> | null }[]).map((l) => ({ id: l.id, ts: l.ts, admin: (l.admin_id && aname.get(l.admin_id)) || "—", action: l.action, target: l.target, detail: l.detail })),
  };
}

/** 쿼리스트링 → 기간. 기본 최근 30일 */
export function parseRange(sp: { from?: string; to?: string; preset?: string }): Range {
  const today = todayKst();
  const ok = (v?: string) => !!v && /^\d{4}-\d{2}-\d{2}$/.test(v);
  if (ok(sp.from) && ok(sp.to) && sp.from! <= sp.to!) return { from: sp.from!, to: sp.to! };
  const p = kstParts(new Date().toISOString());
  switch (sp.preset) {
    case "7d": return { from: shiftDay(today, -6), to: today };
    case "90d": return { from: shiftDay(today, -89), to: today };
    case "month": return { from: `${p.y}-${pad(p.m)}-01`, to: today };
    case "last": { const y = p.m === 1 ? p.y - 1 : p.y; const m = p.m === 1 ? 12 : p.m - 1; const first = `${y}-${pad(m)}-01`; return { from: first, to: shiftDay(`${p.y}-${pad(p.m)}-01`, -1) }; }
    case "year": return { from: `${p.y}-01-01`, to: today };
    default: return { from: shiftDay(today, -29), to: today };
  }
}
