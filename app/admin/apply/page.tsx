import type { Metadata } from "next";
import { ApplyLinksView, type ApplyLinkRow } from "@/components/admin/ApplyLinksView";
import type { ApplyLink } from "@/lib/apply/links";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "상담 전 설문" };
export const dynamic = "force-dynamic";

/** /admin/apply — 상담 전 설문 비밀 링크 발급·전달·응답 확인 (RLS "admin apply links") */
export default async function AdminApplyPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("apply_links")
    .select("id, token, name, phone, memo, inquiry_id, response_id, created_at, expires_at, used_at, revoked_at")
    .order("created_at", { ascending: false })
    .limit(500);
  const links = (data ?? []) as ApplyLink[];
  const ids = Array.from(new Set(links.flatMap((l) => [l.inquiry_id, l.response_id]).filter((x): x is string => !!x)));
  const { data: inqs } = ids.length
    ? await supabase.from("inquiries").select("id, name, status, created_at").in("id", ids)
    : { data: [] as { id: string; name: string | null; status: string; created_at: string }[] };
  const byId = new Map((inqs ?? []).map((i) => [i.id, i]));
  const { count } = await supabase.from("inquiries").select("id", { count: "exact", head: true }).eq("answers->>form", "apply");

  const rows: ApplyLinkRow[] = links.map((l) => ({
    ...l,
    inquiry_name: l.inquiry_id ? byId.get(l.inquiry_id)?.name ?? null : null,
    response: l.response_id ? byId.get(l.response_id) ?? null : null,
  }));
  return <ApplyLinksView rows={rows} applyCount={count ?? 0} />;
}
