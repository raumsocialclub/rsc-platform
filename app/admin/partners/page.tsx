import type { Metadata } from "next";
import { PartnersView } from "@/components/admin/PartnersView";
import { PARTNER_STATUSES, type PartnerInquiryRow, type PartnerStatus } from "@/lib/partner/types";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "제휴문의" };

/** /admin/partners?status=&id= — 제휴문의(/partner 양식) 목록·상세. RLS "admin partner inquiries" 정책으로 조회. 최근 200건. */
export default async function AdminPartnersPage({ searchParams }: { searchParams: Promise<{ id?: string; status?: string }> }) {
  const sp = await searchParams;
  const status = (PARTNER_STATUSES as readonly string[]).includes(sp.status ?? "") ? (sp.status as PartnerStatus) : "";
  const supabase = await createClient();
  let q = supabase.from("partner_inquiries").select("*").order("created_at", { ascending: false }).limit(200);
  if (status) q = q.eq("status", status);
  const { data } = await q;
  const rows = (data ?? []) as PartnerInquiryRow[];
  const selected = (sp.id && rows.find((r) => r.id === sp.id)) || rows[0] || null;
  return <PartnersView rows={rows} selected={selected} status={status} />;
}
