import type { Metadata } from "next";
import { DashboardView } from "@/components/admin/DashboardView";
import { dashboardStats, type Range } from "@/lib/admin/stats";

export const metadata: Metadata = { title: "대시보드" };

/** 대시보드: 실제 결제·예약·회원·상담 데이터 집계 (?range=month|last|year) */
export default async function AdminDashboardPage({ searchParams }: { searchParams: Promise<{ range?: string }> }) {
  const { range } = await searchParams;
  const r: Range = range === "last" || range === "year" ? range : "month";
  const stats = await dashboardStats(r);
  return <DashboardView s={stats} />;
}
