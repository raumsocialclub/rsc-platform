import { createClient } from "@/lib/supabase/server";
import { normalizeFlow, type Program, type ProgramWithSessions, type Session } from "./types";

type ProgramRow = Omit<Program, "flow" | "is_published"> & { flow: unknown; is_published: boolean | null };
type SessionRow = Omit<Session, "remaining" | "status"> & { status: string | null };
type AvailRow = { session_id: string; remaining: number | null };

function toProgram(r: ProgramRow): Program {
  return { ...r, flow: normalizeFlow(r.flow), is_published: !!r.is_published };
}

/**
 * 프로그램 + 회차 + 잔여석. RLS 로 회원은 공개 프로그램만, 관리자는 전부 본다.
 * 회차는 session_availability(잔여석)와 합친다.
 */
async function attachSessions(programs: ProgramRow[]): Promise<ProgramWithSessions[]> {
  if (programs.length === 0) return [];
  const supabase = await createClient();
  const ids = programs.map((p) => p.id);
  const [{ data: sessions }, { data: avail }] = await Promise.all([
    supabase.from("sessions").select("id, program_id, starts_at, ends_at, capacity, seq, status").in("program_id", ids).order("starts_at"),
    supabase.from("session_availability").select("session_id, remaining").in("program_id", ids),
  ]);
  const remaining = new Map<string, number>(((avail ?? []) as AvailRow[]).map((a) => [a.session_id, a.remaining ?? 0]));
  const byProgram = new Map<string, Session[]>();
  for (const s of (sessions ?? []) as SessionRow[]) {
    const list = byProgram.get(s.program_id) ?? [];
    list.push({
      ...s,
      seq: s.seq ?? 1,
      status: (s.status as Session["status"]) ?? "open",
      remaining: Math.max(0, remaining.get(s.id) ?? s.capacity),
    });
    byProgram.set(s.program_id, list);
  }
  return programs.map((p) => ({ ...toProgram(p), sessions: byProgram.get(p.id) ?? [] }));
}

const PROGRAM_COLS = "id, kind, name, subtitle, category, place, short_desc, description, image_url, flow, capacity, price, member_price, is_published, created_at, updated_at";

export async function listPrograms(): Promise<ProgramWithSessions[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("programs").select(PROGRAM_COLS).order("created_at", { ascending: false });
  if (error) {
    console.error("[programs/list]", error);
    return [];
  }
  return attachSessions((data ?? []) as ProgramRow[]);
}

export async function getProgram(id: string): Promise<ProgramWithSessions | null> {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
  const supabase = await createClient();
  const { data, error } = await supabase.from("programs").select(PROGRAM_COLS).eq("id", id).maybeSingle();
  if (error || !data) return null;
  const [p] = await attachSessions([data as ProgramRow]);
  return p ?? null;
}

/** 회원 목록용: 공개 + 아직 남은 회차가 있는 프로그램을 첫 회차 순으로 */
export function upcomingOnly(list: ProgramWithSessions[], now = new Date()): ProgramWithSessions[] {
  const t = now.getTime();
  return list
    .filter((p) => p.is_published && p.sessions.some((s) => s.status !== "cancelled" && new Date(s.starts_at).getTime() >= t))
    .sort((a, b) => firstStart(a).localeCompare(firstStart(b)));
}

export function firstStart(p: ProgramWithSessions): string {
  return p.sessions.length ? p.sessions[0].starts_at : "9999";
}

/** 예약 대상 회차: 단일은 그 회차, 시즌은 1주차(시즌권 = 1회 결제). 잔여석은 시즌이면 전 회차 최소값. */
export function bookingTarget(p: ProgramWithSessions): { session: Session | null; remaining: number } {
  const live = p.sessions.filter((s) => s.status !== "cancelled");
  if (live.length === 0) return { session: null, remaining: 0 };
  const remaining = Math.min(...live.map((s) => s.remaining));
  return { session: live[0], remaining };
}
