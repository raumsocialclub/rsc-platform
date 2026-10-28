import type { Metadata } from "next";
import { InquiriesView } from "@/components/admin/views";
import type { InquiryRow } from "@/components/admin/InquiryDetail";
import { matchesUtmFilter } from "@/lib/admin/leads";
import { getCurrentMember, isOwnerRole } from "@/lib/auth/session";
import { matchInquiries, syncInquiriesFromSheet, type InquiryCrm } from "@/lib/crm/inquiries";
import { loadCallsDataSafe } from "@/lib/crm/load";
import { crmConfigured } from "@/lib/crm/sheet";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "상담 신청" };
/** 시트(Apps Script) 응답을 최대 25초 기다리므로 서버 함수 한도를 넉넉히 */
export const maxDuration = 30;

/**
 * /admin/inquiries?id=&source=&campaign= — 좌 목록 / 우 상세. RLS "admin inquiries" 정책으로 조회.
 * source·campaign 은 광고 유입(UTM) 필터. 선택지는 최근 200건에 실제로 있는 값으로 만든다.
 * CSV 내려받기(주관리자만)는 같은 필터 + 기간(from/to, 한국 날짜)으로 /api/admin/inquiries/export — 화면의 200건 제한 없음.
 * CRM 시트 연동: 화면을 열 때 CRM관리 탭의 콜 결과를 읽어 같은 전화번호 신청의 상태를 맞추고(lib/crm/inquiries.ts), 콜 결과·메모를 목록·상세에 보여준다.
 */
export default async function AdminInquiriesPage({ searchParams }: { searchParams: Promise<{ id?: string; source?: string; campaign?: string }> }) {
  const { id, source = "", campaign = "" } = await searchParams;
  const supabase = await createClient();

  // 1) 시트 → 상태 연동 (목록을 읽기 전에). 시트가 느리거나 실패해도 화면은 뜬다
  let crm: { leads: Parameters<typeof matchInquiries>[1]; at: string | null; error: string | null } = { leads: [], at: null, error: null };
  if (crmConfigured()) {
    const { data: calls, error } = await loadCallsDataSafe();
    if (calls) {
      if (!calls.eventsEnabled) await syncInquiriesFromSheet(supabase, calls.leads); // service role 이 없으면 관리자 세션으로
      crm = { leads: calls.leads, at: calls.sheet.updatedAt ?? calls.fetchedAt, error: error ?? null };
    } else crm = { leads: [], at: null, error: error ?? "시트를 읽지 못했습니다." };
  }

  const { data } = await supabase
    .from("inquiries")
    .select("id, name, phone, email, result_type, status, memo, created_at, answers, utm, crm_status, crm_attempts, crm_applied")
    .order("created_at", { ascending: false })
    .limit(200);
  const all = (data ?? []) as InquiryRow[];
  const uniq = (k: "utm_source" | "utm_campaign") => Array.from(new Set(all.map((r) => r.utm?.[k]).filter((v): v is string => !!v))).sort();
  const options = { sources: uniq("utm_source"), campaigns: uniq("utm_campaign") };
  const rows = all.filter((r) => matchesUtmFilter(r, { source, campaign }));
  const crmById: Record<string, InquiryCrm> = Object.fromEntries(matchInquiries(rows, crm.leads));
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

  return (
    <InquiriesView
      rows={rows}
      selected={selected}
      filter={{ source, campaign }}
      options={options}
      canExport={isOwnerRole(await getCurrentMember())}
      crm={crmById}
      crmInfo={crmConfigured() ? { at: crm.at, error: crm.error } : null}
    />
  );
}
