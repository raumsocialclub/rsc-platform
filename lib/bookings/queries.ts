import { createClient } from "@/lib/supabase/server";
import type { Booking, BookingDetail } from "./types";

const COLS = "id, order_id, member_id, program_id, session_id, qty, unit_price, amount, status, expires_at, cancelled_at, created_at";

type ProgramRow = BookingDetail["program"];
type SessionRow = BookingDetail["session"];
type PaymentRow = NonNullable<BookingDetail["payment"]>;

/** 본인 예약을 프로그램·회차·결제와 함께 (RLS: own bookings) */
export async function getMyBooking(id: string): Promise<BookingDetail | null> {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
  const supabase = await createClient();
  const { data: b } = await supabase.from("bookings").select(COLS).eq("id", id).maybeSingle();
  if (!b) return null;
  const [list] = await attach([b as Booking]);
  return list ?? null;
}

export async function listMyBookings(): Promise<BookingDetail[]> {
  const supabase = await createClient();
  const { data } = await supabase.from("bookings").select(COLS).order("created_at", { ascending: false }).limit(200);
  return attach((data ?? []) as Booking[]);
}

/** /my 용: 목록 + 조회 시각(서버 컴포넌트 렌더 중 Date.now() 호출을 피한다) */
export async function listMyBookingsWithNow(): Promise<{ bookings: BookingDetail[]; now: number }> {
  const bookings = await listMyBookings();
  return { bookings, now: Date.now() };
}

async function attach(bookings: Booking[]): Promise<BookingDetail[]> {
  if (bookings.length === 0) return [];
  const supabase = await createClient();
  const pids = [...new Set(bookings.map((b) => b.program_id))];
  const sids = [...new Set(bookings.map((b) => b.session_id))];
  const bids = bookings.map((b) => b.id);
  const [{ data: programs }, { data: sessions }, { data: payments }] = await Promise.all([
    supabase.from("programs").select("id, kind, name, subtitle, place, image_url, category").in("id", pids),
    supabase.from("sessions").select("id, starts_at, seq, status").in("id", sids),
    supabase.from("payments").select("id, booking_id, payment_key, method, amount, status, receipt_url, approved_at").in("booking_id", bids).order("created_at", { ascending: false }),
  ]);
  const pm = new Map(((programs ?? []) as ProgramRow[]).map((p) => [p.id, p]));
  const sm = new Map(((sessions ?? []) as SessionRow[]).map((s) => [s.id, s]));
  const paym = new Map<string, PaymentRow>();
  for (const p of (payments ?? []) as (PaymentRow & { booking_id: string })[]) if (!paym.has(p.booking_id)) paym.set(p.booking_id, p);
  return bookings
    .map((b) => {
      const program = pm.get(b.program_id);
      const session = sm.get(b.session_id);
      if (!program || !session) return null;
      return { ...b, program, session, payment: paym.get(b.id) ?? null };
    })
    .filter((x): x is BookingDetail => !!x);
}
