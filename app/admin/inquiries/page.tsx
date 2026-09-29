import type { Metadata } from "next";
import { InquiriesView } from "@/components/admin/views";
import type { InquiryRow } from "@/components/admin/InquiryDetail";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "상담 신청" };

/**
 * /admin/inquiries?id=&source=&campaign= — 좌 목록 / 우 상세. RLS "admin inquiries" 정책으로 조회.
 * source·campaign 은 광고 유입(UTM) 필터. 선택지는 최근 200건에 실제로 있는 값으로 만든다.
 */
export default async function AdminInquiriesPage({ searchParams }: { searchParams: Promise<{ id?: string; source?: string; campaign?: string }> }) {
  const { id, source = "", campaign = "" } = await searchParams;
  const supabase = await createClient();
  const { data } = await supabase
    .from("inquiries")
    .select("id, name, phone, email, result_type, status, memo, created_at, answers, utm")
    .order("created_at", { ascending: false })
    .limit(200);
  const all = (data ?? []) as InquiryRow[];
  const uniq = (k: "utm_source" | "utm_campaign") => Array.from(new Set(all.map((r) => r.utm?.[k]).filter((v): v is string => !!v))).sort();
  const options = { sources: uniq("utm_source"), campaigns: uniq("utm_campaign") };
  const rows = all.filter((r) => (!source || (source === "-" ? !r.utm?.utm_source : r.utm?.utm_source === source)) && (!campaign || r.utm?.utm_campaign === campaign));
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

  return <InquiriesView rows={rows} selected={selected} filter={{ source, campaign }} options={options} />;
}
