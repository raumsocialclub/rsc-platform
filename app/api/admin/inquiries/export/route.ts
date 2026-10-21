import { requireAdmin } from "@/lib/admin/guard";
import { leadsCsv, matchesUtmFilter, type LeadSource } from "@/lib/admin/leads";
import { createClient } from "@/lib/supabase/server";

/**
 * GET /api/admin/inquiries/export?source=&campaign= — 현재 유입 필터의 상담 신청을
 * 메타 광고 관리자 리드 CSV 양식(id, created_time, ad_id … full_name, phone_number)으로 내려준다. (lib/admin/leads.ts)
 */
export async function GET(req: Request) {
  const me = await requireAdmin();
  if (!me) return new Response("forbidden", { status: 403 });
  const sp = new URL(req.url).searchParams;
  const filter = { source: sp.get("source") ?? "", campaign: sp.get("campaign") ?? "" };
  const supabase = await createClient();
  const { data } = await supabase.from("inquiries").select("id, name, phone, created_at, utm").order("created_at", { ascending: false }).limit(5000);
  const rows = ((data ?? []) as LeadSource[]).filter((r) => matchesUtmFilter(r, filter));
  const csv = leadsCsv(rows);
  return new Response(csv, { headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="rsc-leads-${new Date().toISOString().slice(0, 10)}.csv"` } });
}
