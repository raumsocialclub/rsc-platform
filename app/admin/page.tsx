import type { Metadata } from "next";
import { DashboardView } from "@/components/admin/views";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "대시보드 · RSC ADMIN" };

/** M4 자리 대시보드. 매출·예약 KPI 와 차트는 M7 에서 실제 데이터로 채운다. */
export default async function AdminDashboardPage() {
  const supabase = await createClient();
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const [active, fresh, pending] = await Promise.all([
    supabase.from("members").select("id", { count: "exact", head: true }).eq("status", "active"),
    supabase.from("members").select("id", { count: "exact", head: true }).gte("created_at", monthStart),
    supabase.from("inquiries").select("id", { count: "exact", head: true }).eq("status", "pending"),
  ]);
  return (
    <DashboardView
      data={{
        monthLabel: `${now.getFullYear()}년 ${now.getMonth() + 1}월`,
        kpis: { revenue: 0, bookings: 0, activeMembers: active.count ?? 0, newMembers: fresh.count ?? 0, pendingInquiries: pending.count ?? 0 },
      }}
    />
  );
}
