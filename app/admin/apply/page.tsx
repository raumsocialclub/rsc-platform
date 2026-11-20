import type { Metadata } from "next";
import { ApplyLinksView, type ApplyLinkRow } from "@/components/admin/ApplyLinksView";
import { LINK_COLUMNS, type ApplyLink } from "@/lib/apply/links";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "상담 전 설문" };
export const dynamic = "force-dynamic";

/** /admin/apply — 상담 전 설문 공용 비밀 링크 만들기·전달·응답 수 확인 (RLS "admin apply links"). 응답 수는 상담 신청에서 실제로 센다 */
export default async function AdminApplyPage() {
  const supabase = await createClient();
  const [{ data }, { data: resp }] = await Promise.all([
    supabase.from("apply_links").select(LINK_COLUMNS).order("created_at", { ascending: false }).limit(500),
    supabase.from("inquiries").select("answers").eq("answers->>form", "apply").limit(5000),
  ]);
  const links = (data ?? []) as ApplyLink[];
  const byLink = new Map<string, number>();
  for (const r of (resp ?? []) as { answers: { linkId?: string } | null }[]) {
    const k = r.answers?.linkId ?? "";
    byLink.set(k, (byLink.get(k) ?? 0) + 1);
  }
  const rows: ApplyLinkRow[] = links.map((l) => ({ ...l, responses: byLink.get(l.id) ?? 0 }));
  return <ApplyLinksView rows={rows} applyCount={(resp ?? []).length} />;
}
