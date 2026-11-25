import type { Metadata } from "next";
import { JoinView, type JoinRow } from "@/components/admin/JoinView";
import { isJoinRequest, joinState, matchesJoin, parseJoinFilter } from "@/lib/inquiries/join";
import { createClient } from "@/lib/supabase/server";
import { attachEvents } from "@/lib/events/admin";

export const metadata: Metadata = { title: "가입 신청" };

/**
 * /admin/join?state=&q= — 가입 신청 목록 (2026-11-23). 프로필 진단(/match-check) 응답 전부 = 라움소셜클럽 가입 요청자.
 * state: pending(승인 대기) · approved(가입완료) · 빈 값 전체. q: 이름·연락처·초대코드. RLS "admin inquiries" 정책으로 조회, 최근 500건.
 */
export default async function AdminJoinPage({ searchParams }: { searchParams: Promise<{ state?: string; q?: string }> }) {
  const sp = await searchParams;
  const state = parseJoinFilter(sp.state);
  const q = sp.q ?? "";
  const supabase = await createClient();
  const { data } = await supabase
    .from("inquiries")
    .select("id, name, phone, email, result_type, status, memo, created_at, answers, utm, approved_at")
    .eq("answers->>form", "match")
    .order("created_at", { ascending: false })
    .limit(500);
  const all = await attachEvents(supabase, ((data ?? []) as JoinRow[]).filter(isJoinRequest));
  const counts = { pending: all.filter((r) => joinState(r) === "pending").length, approved: all.filter((r) => joinState(r) === "approved").length };
  const rows = all.filter((r) => matchesJoin(r, state, q));
  return <JoinView rows={rows} total={all.length} counts={counts} filter={{ state, q }} />;
}
