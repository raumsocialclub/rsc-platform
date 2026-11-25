import type { SupabaseClient } from "@supabase/supabase-js";
import type { InquiryRow } from "@/components/admin/InquiryDetail";
import { applyState, type ApplyStatus, type EventEntry } from "@/lib/posts/apply";

/**
 * 어드민 「프로그램 참여 신청」(/admin/events, M24) 데이터 — 서버 전용(관리자 RLS 로 조회).
 * event_applications(소식 × 가입 신청자) 를 소식별로 모아 신청/확정/취소 수를 세고, 고른 소식의 신청자 목록을 가입 신청 행(inquiries)과 붙여 돌려준다.
 */
export type EventPost = { id: string; slug: string; title: string; event_date: string | null; published: boolean; apply_open: boolean | null; published_at: string | null };
export type EventApplicationRow = {
  id: string; post_id: string; inquiry_id: string; status: ApplyStatus; source: "quick" | "survey"; memo: string | null; status_at: string | null; created_at: string;
  inquiry: (InquiryRow & { approved_at?: string | null }) | null;
};
export type EventSummary = EventPost & { counts: Record<ApplyStatus, number>; total: number; state: ReturnType<typeof applyState> };

const APP_COLS = "id, post_id, inquiry_id, status, source, memo, status_at, created_at";

/** 소식 목록(최근 행사 순) + 소식별 신청 수 */
export async function listEventSummaries(supabase: SupabaseClient, today?: string): Promise<EventSummary[]> {
  const [{ data: posts }, { data: apps }] = await Promise.all([
    supabase.from("posts").select("id, slug, title, event_date, published, apply_open, published_at").order("event_date", { ascending: false, nullsFirst: false }).order("published_at", { ascending: false, nullsFirst: false }).limit(300),
    supabase.from("event_applications").select("post_id, status").limit(5000),
  ]);
  const byPost = new Map<string, Record<ApplyStatus, number>>();
  for (const a of (apps ?? []) as { post_id: string; status: ApplyStatus }[]) {
    const c = byPost.get(a.post_id) ?? { applied: 0, confirmed: 0, cancelled: 0 };
    c[a.status] = (c[a.status] ?? 0) + 1;
    byPost.set(a.post_id, c);
  }
  return ((posts ?? []) as EventPost[]).map((p) => {
    const counts = byPost.get(p.id) ?? { applied: 0, confirmed: 0, cancelled: 0 };
    return { ...p, counts, total: counts.applied + counts.confirmed + counts.cancelled, state: applyState(p, today) };
  });
}

/** 한 소식의 신청자 목록(최근 신청 순). 가입 신청 행이 지워진(180일 보관 만료) 건은 cascade 로 같이 사라지므로 inquiry 는 보통 null 이 아니다 */
export async function listEventApplications(supabase: SupabaseClient, postId: string): Promise<EventApplicationRow[]> {
  const { data, error } = await supabase
    .from("event_applications")
    .select(`${APP_COLS}, inquiry:inquiries(id, name, phone, email, result_type, status, memo, created_at, answers, utm, approved_at)`)
    .eq("post_id", postId)
    .order("created_at", { ascending: false })
    .limit(2000);
  if (error) {
    console.error("[events/admin] list failed:", error);
    return [];
  }
  return (data ?? []) as unknown as EventApplicationRow[];
}

/** 가입 신청 행들에 참여 신청 기록(events)을 붙인다 — 가입 신청 목록·프로필 카드·상세의 「참여 신청 · 제목」 표시용 */
export async function attachEvents<T extends { id: string }>(supabase: SupabaseClient, rows: T[]): Promise<(T & { events: EventEntry[] })[]> {
  if (!rows.length) return rows.map((r) => ({ ...r, events: [] }));
  const ids = rows.map((r) => r.id);
  const { data } = await supabase.from("event_applications").select(`${APP_COLS}, post:posts(slug, title)`).in("inquiry_id", ids).order("created_at", { ascending: true }).limit(5000);
  const map = new Map<string, EventEntry[]>();
  for (const a of (data ?? []) as unknown as (Omit<EventApplicationRow, "inquiry"> & { post: { slug: string; title: string } | null })[]) {
    if (!a.post) continue;
    const list = map.get(a.inquiry_id) ?? [];
    list.push({ id: a.id, slug: a.post.slug, title: a.post.title, at: a.created_at, status: a.status, source: a.source });
    map.set(a.inquiry_id, list);
  }
  return rows.map((r) => ({ ...r, events: map.get(r.id) ?? [] }));
}
