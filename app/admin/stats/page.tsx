import type { Metadata } from "next";
import { StatsView } from "@/components/admin/StatsView";
import { fullStats, parseRange } from "@/lib/admin/statsFull";

export const metadata: Metadata = { title: "통계 · 리포트" };

export default async function AdminStatsPage({ searchParams }: { searchParams: Promise<{ from?: string; to?: string; preset?: string }> }) {
  const sp = await searchParams;
  const range = parseRange(sp);
  const stats = await fullStats(range);
  const preset = sp.from && sp.to ? "" : sp.preset ?? "30d";
  return <StatsView s={stats} preset={preset} />;
}
