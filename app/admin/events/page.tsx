import type { Metadata } from "next";
import { EventsView } from "@/components/admin/EventsView";
import { listEventApplications, listEventSummaries } from "@/lib/events/admin";
import { kstToday, parseApplyStatus } from "@/lib/posts/apply";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "프로그램 참여 신청" };

/**
 * /admin/events?post=&status=&q= — 프로그램(소식) 참여 신청자 DB (M24, 2026-11-25).
 * 예전 「프로그램」 탭(예약·결제형 프로그램 관리, /admin/programs)은 소식 게시판과 겹쳐 이 화면으로 바꿨다(옛 화면은 하단 링크로만).
 * 위: 소식별 신청/확정/취소 수와 참여 상태(모집 중·참여 종료·버튼 꺼짐). 아래: 고른 소식의 신청자 목록(참석 상태 변경·메모·CSV). 이름을 누르면 회원 프로필 카드.
 */
export default async function AdminEventsPage({ searchParams }: { searchParams: Promise<{ post?: string; status?: string; q?: string }> }) {
  const sp = await searchParams;
  const supabase = await createClient();
  const today = kstToday();
  const events = await listEventSummaries(supabase, today);
  const selected = events.find((e) => e.id === sp.post) ?? events.find((e) => e.total > 0) ?? events.find((e) => e.state === "open") ?? events[0] ?? null;
  const apps = selected ? await listEventApplications(supabase, selected.id) : [];
  const status = parseApplyStatus(sp.status);
  const q = (sp.q ?? "").trim().toLowerCase().replace(/-/g, "");
  const rows = apps.filter((a) => (!status || a.status === status) && (!q || [a.inquiry?.name ?? "", (a.inquiry?.phone ?? "").replace(/-/g, "")].some((v) => v.toLowerCase().includes(q))));
  return <EventsView events={events} selected={selected} rows={rows} total={apps.length} filter={{ status, q: sp.q ?? "" }} />;
}
