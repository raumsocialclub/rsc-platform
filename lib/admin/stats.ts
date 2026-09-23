import { paymentBalance } from "@/lib/bookings/cancel";
import { kstParts } from "@/lib/programs/format";
import { createClient } from "@/lib/supabase/server";
import { listOrders, type OrderRow } from "./queries";

/** 대시보드 집계 (한국 시간 기준). range: month(이번 달) | last(지난 달) | year(올해) */
export type Range = "month" | "last" | "year";

type Period = { from: Date; to: Date; label: string; buckets: { key: string; label: string }[]; bucketOf: (iso: string) => string };

const pad = (n: number) => String(n).padStart(2, "0");
const kstDate = (y: number, m: number, d: number) => new Date(`${y}-${pad(m)}-${pad(d)}T00:00:00+09:00`);

export function periodFor(range: Range, now = new Date()): Period {
  const p = kstParts(now.toISOString());
  if (range === "year") {
    const from = kstDate(p.y, 1, 1);
    const to = kstDate(p.y + 1, 1, 1);
    return {
      from, to, label: `${p.y}년`,
      buckets: Array.from({ length: 12 }, (_, i) => ({ key: `${p.y}-${pad(i + 1)}`, label: `${i + 1}월` })),
      bucketOf: (iso) => { const k = kstParts(iso); return `${k.y}-${pad(k.m)}`; },
    };
  }
  let y = p.y, m = p.m;
  if (range === "last") { m -= 1; if (m === 0) { m = 12; y -= 1; } }
  const from = kstDate(y, m, 1);
  const to = m === 12 ? kstDate(y + 1, 1, 1) : kstDate(y, m + 1, 1);
  const days = Math.round((to.getTime() - from.getTime()) / 86_400_000);
  return {
    from, to, label: `${y}년 ${m}월`,
    buckets: Array.from({ length: days }, (_, i) => ({ key: `${y}-${pad(m)}-${pad(i + 1)}`, label: `${m}.${i + 1}` })),
    bucketOf: (iso) => { const k = kstParts(iso); return `${k.y}-${pad(k.m)}-${pad(k.d)}`; },
  };
}

function prevPeriod(range: Range, now: Date): Period {
  const p = periodFor(range, now);
  const before = new Date(p.from.getTime() - 1);
  return periodFor(range === "year" ? "year" : "month", before);
}

export type DashboardStats = {
  label: string;
  range: Range;
  revenue: number;
  prevRevenue: number;
  refunds: number;
  bookings: number;
  prevBookings: number;
  activeMembers: number;
  newMembers: number;
  pendingInquiries: number;
  bars: { label: string; value: number }[];
  shares: { name: string; value: number }[];
  recent: OrderRow[];
  closing: { session_id: string; program_id: string; name: string; starts_at: string; capacity: number; remaining: number }[];
};

type PayRow = { member_id: string; booking_id: string | null; amount: number; status: string; approved_at: string | null; cancelled_at: string | null; raw: { balanceAmount?: number; cancels?: { cancelAmount: number }[] } | null };

export async function dashboardStats(range: Range, now = new Date()): Promise<DashboardStats> {
  const supabase = await createClient();
  const cur = periodFor(range, now);
  const prev = prevPeriod(range, now);
  const lo = new Date(Math.min(cur.from.getTime(), prev.from.getTime())).toISOString();
  const hi = cur.to.toISOString();
  const in14d = new Date(now.getTime() + 14 * 86_400_000).toISOString();

  const [{ data: pays }, { data: books }, active, fresh, pending, { data: avail }, recent] = await Promise.all([
    supabase.from("payments").select("member_id, booking_id, amount, status, approved_at, cancelled_at, raw").in("status", ["paid", "partial_cancelled", "cancelled"]).gte("approved_at", lo).lt("approved_at", hi),
    supabase.from("bookings").select("id, program_id, created_at, status").gte("created_at", lo).lt("created_at", hi),
    supabase.from("members").select("id", { count: "exact", head: true }).eq("status", "active"),
    supabase.from("members").select("id", { count: "exact", head: true }).gte("created_at", cur.from.toISOString()).lt("created_at", hi),
    supabase.from("inquiries").select("id", { count: "exact", head: true }).eq("status", "pending"),
    supabase.from("session_availability").select("session_id, program_id, starts_at, capacity, remaining").gte("starts_at", now.toISOString()).lte("starts_at", in14d).order("starts_at").limit(8),
    listOrders({ limit: 5 }),
  ]);

  const inCur = (iso: string | null) => !!iso && new Date(iso) >= cur.from && new Date(iso) < cur.to;
  const inPrev = (iso: string | null) => !!iso && new Date(iso) >= prev.from && new Date(iso) < prev.to;

  let revenue = 0, prevRevenue = 0, refunds = 0;
  const byBucket = new Map<string, number>();
  const byBooking = new Map<string, number>();
  for (const p of (pays ?? []) as PayRow[]) {
    const net = paymentBalance(p); // 승인 금액 − 환불액
    if (inCur(p.approved_at)) {
      revenue += net;
      byBucket.set(cur.bucketOf(p.approved_at!), (byBucket.get(cur.bucketOf(p.approved_at!)) ?? 0) + net);
      if (p.booking_id) byBooking.set(p.booking_id, (byBooking.get(p.booking_id) ?? 0) + net);
      refunds += p.amount - net;
    } else if (inPrev(p.approved_at)) prevRevenue += net;
  }

  const bookingRows = (books ?? []) as { id: string; program_id: string; created_at: string; status: string }[];
  const counted = (b: { status: string }) => b.status === "confirmed" || b.status === "attended";
  const bookings = bookingRows.filter((b) => counted(b) && inCur(b.created_at)).length;
  const prevBookings = bookingRows.filter((b) => counted(b) && inPrev(b.created_at)).length;

  // 프로그램별 매출
  const progRevenue = new Map<string, number>();
  for (const b of bookingRows) {
    const v = byBooking.get(b.id);
    if (v) progRevenue.set(b.program_id, (progRevenue.get(b.program_id) ?? 0) + v);
  }
  const progIds = [...progRevenue.keys()];
  const closingIds = [...new Set((avail ?? []).map((a) => a.program_id as string))];
  const { data: progs } = progIds.length + closingIds.length
    ? await supabase.from("programs").select("id, name").in("id", [...new Set([...progIds, ...closingIds])])
    : { data: [] as { id: string; name: string }[] };
  const pname = new Map((progs ?? []).map((p) => [p.id as string, p.name as string]));
  const shares = [...progRevenue.entries()].map(([id, value]) => ({ name: pname.get(id) ?? "—", value })).sort((a, b) => b.value - a.value).slice(0, 5);

  return {
    label: cur.label,
    range,
    revenue, prevRevenue, refunds, bookings, prevBookings,
    activeMembers: active.count ?? 0,
    newMembers: fresh.count ?? 0,
    pendingInquiries: pending.count ?? 0,
    bars: cur.buckets.map((b) => ({ label: b.label, value: byBucket.get(b.key) ?? 0 })),
    shares,
    recent,
    closing: ((avail ?? []) as { session_id: string; program_id: string; starts_at: string; capacity: number; remaining: number | null }[]).map((a) => ({
      session_id: a.session_id, program_id: a.program_id, name: pname.get(a.program_id) ?? "—", starts_at: a.starts_at, capacity: a.capacity, remaining: Math.max(0, a.remaining ?? 0),
    })),
  };
}
