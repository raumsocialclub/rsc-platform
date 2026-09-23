import { paymentBalance } from "@/lib/bookings/cancel";
import type { BookingStatus } from "@/lib/bookings/types";
import { createClient } from "@/lib/supabase/server";

/** 어드민 조회 (관리자 세션 RLS: is_admin() 이면 전체 조회 가능) */

export type { OrderRow, PaymentInfo, MemberRow, MemberStatus } from "./types";
export { MEMBER_STATUS_KO, PROVIDER_KO } from "./types";
import type { OrderRow, PaymentInfo, MemberRow } from "./types";

type PaymentRaw = Omit<PaymentInfo, "balance"> & { booking_id: string | null; member_id: string; raw: { balanceAmount?: number } | null; created_at: string };

const BOOKING_COLS = "id, order_id, member_id, program_id, session_id, created_at, status, qty, unit_price, amount, cancelled_at, expires_at";
const PAYMENT_COLS = "id, booking_id, member_id, payment_key, method, amount, status, receipt_url, approved_at, cancelled_at, raw, created_at";

type BookingRaw = { id: string; order_id: string; member_id: string; program_id: string; session_id: string; created_at: string; status: BookingStatus; qty: number; unit_price: number; amount: number; cancelled_at: string | null; expires_at: string };

function toPaymentInfo(p: PaymentRaw): PaymentInfo {
  return { id: p.id, payment_key: p.payment_key, method: p.method, amount: p.amount, status: p.status, receipt_url: p.receipt_url, approved_at: p.approved_at, cancelled_at: p.cancelled_at, balance: paymentBalance(p) };
}

async function hydrateOrders(rows: BookingRaw[]): Promise<OrderRow[]> {
  if (rows.length === 0) return [];
  const supabase = await createClient();
  const mids = [...new Set(rows.map((r) => r.member_id))];
  const pids = [...new Set(rows.map((r) => r.program_id))];
  const sids = [...new Set(rows.map((r) => r.session_id))];
  const [{ data: members }, { data: programs }, { data: sessions }, { data: payments }] = await Promise.all([
    supabase.from("members").select("id, name, email, phone").in("id", mids),
    supabase.from("programs").select("id, name, kind, place").in("id", pids),
    supabase.from("sessions").select("id, starts_at").in("id", sids),
    supabase.from("payments").select(PAYMENT_COLS).in("booking_id", rows.map((r) => r.id)).order("created_at", { ascending: false }),
  ]);
  const mm = new Map((members ?? []).map((m) => [m.id as string, m as OrderRow["member"]]));
  const pm = new Map((programs ?? []).map((p) => [p.id as string, p as OrderRow["program"]]));
  const sm = new Map((sessions ?? []).map((s) => [s.id as string, s as OrderRow["session"]]));
  const paym = new Map<string, PaymentInfo>();
  for (const p of (payments ?? []) as PaymentRaw[]) if (p.booking_id && !paym.has(p.booking_id)) paym.set(p.booking_id, toPaymentInfo(p));
  return rows.map((r) => ({
    id: r.id, order_id: r.order_id, created_at: r.created_at, status: r.status, qty: r.qty, unit_price: r.unit_price, amount: r.amount, cancelled_at: r.cancelled_at, expires_at: r.expires_at,
    member: mm.get(r.member_id) ?? null,
    program: pm.get(r.program_id) ?? null,
    session: sm.get(r.session_id) ?? null,
    payment: paym.get(r.id) ?? null,
  }));
}

export type OrderFilter = { program?: string; status?: string; member?: string; limit?: number };

export async function listOrders(f: OrderFilter = {}): Promise<OrderRow[]> {
  const supabase = await createClient();
  let q = supabase.from("bookings").select(BOOKING_COLS).order("created_at", { ascending: false }).limit(f.limit ?? 500);
  if (f.program) q = q.eq("program_id", f.program);
  if (f.status) q = q.eq("status", f.status);
  if (f.member) q = q.eq("member_id", f.member);
  const { data, error } = await q;
  if (error) {
    console.error("[admin/orders]", error);
    return [];
  }
  return hydrateOrders((data ?? []) as BookingRaw[]);
}

export async function getOrder(id: string): Promise<OrderRow | null> {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
  const supabase = await createClient();
  const { data } = await supabase.from("bookings").select(BOOKING_COLS).eq("id", id).maybeSingle();
  if (!data) return null;
  const [row] = await hydrateOrders([data as BookingRaw]);
  return row ?? null;
}

/* ---------- 회원 ---------- */
export async function listMembers(): Promise<MemberRow[]> {
  const supabase = await createClient();
  const [{ data: members }, { data: bookings }, { data: payments }, { data: invites }] = await Promise.all([
    supabase.from("members").select("id, name, email, phone, role, status, provider, memo, created_at, invite_code_id").order("created_at", { ascending: false }).limit(2000),
    supabase.from("bookings").select("member_id, status").in("status", ["confirmed", "attended"]),
    supabase.from("payments").select("member_id, amount, status, raw").in("status", ["paid", "partial_cancelled"]),
    supabase.from("invite_codes").select("id, code"),
  ]);
  const visits = new Map<string, number>();
  for (const b of bookings ?? []) visits.set(b.member_id, (visits.get(b.member_id) ?? 0) + 1);
  const spent = new Map<string, number>();
  for (const p of (payments ?? []) as { member_id: string; amount: number; status: string; raw: { balanceAmount?: number } | null }[]) spent.set(p.member_id, (spent.get(p.member_id) ?? 0) + paymentBalance(p));
  const codes = new Map((invites ?? []).map((i) => [i.id as string, i.code as string]));
  return ((members ?? []) as (Omit<MemberRow, "invite_code" | "visits" | "spent"> & { invite_code_id: string | null })[]).map((m) => ({
    id: m.id, name: m.name, email: m.email, phone: m.phone, role: m.role, status: m.status, provider: m.provider ?? "email", memo: m.memo, created_at: m.created_at,
    invite_code: m.invite_code_id ? codes.get(m.invite_code_id) ?? null : null,
    visits: visits.get(m.id) ?? 0,
    spent: spent.get(m.id) ?? 0,
  }));
}

export function filterMembers(rows: MemberRow[], q: string, status: string): MemberRow[] {
  const needle = q.trim().toLowerCase().replace(/-/g, "");
  return rows.filter((m) => {
    if (status && m.status !== status) return false;
    if (!needle) return true;
    return [m.name, m.email ?? "", (m.phone ?? "").replace(/-/g, "")].some((v) => v.toLowerCase().includes(needle));
  });
}
