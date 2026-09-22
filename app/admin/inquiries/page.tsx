import type { Metadata } from "next";
import { InquiriesView } from "@/components/admin/views";
import type { InquiryRow } from "@/components/admin/InquiryDetail";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "상담 신청 · RSC ADMIN" };

/** /admin/inquiries?id= — 좌 목록 / 우 상세. RLS "admin inquiries" 정책으로 조회. */
export default async function AdminInquiriesPage({ searchParams }: { searchParams: Promise<{ id?: string }> }) {
  const { id } = await searchParams;
  const supabase = await createClient();
  const { data } = await supabase
    .from("inquiries")
    .select("id, name, phone, email, result_type, status, memo, created_at, answers")
    .order("created_at", { ascending: false })
    .limit(200);
  const rows = (data ?? []) as InquiryRow[];
  const selectedBase = (id && rows.find((r) => r.id === id)) || rows[0] || null;

  let selected: InquiryRow | null = selectedBase;
  if (selectedBase) {
    const { data: inv } = await supabase
      .from("invite_codes")
      .select("code, expires_at, used_at")
      .eq("inquiry_id", selectedBase.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    selected = { ...selectedBase, invite: inv ?? null };
  }

  return <InquiriesView rows={rows} selected={selected} />;
}
