import type { Metadata } from "next";
import { MarketingView } from "@/components/admin/MarketingView";
import type { MarketingConsentRow } from "@/lib/inquiries/marketing";
import { isOwnerRole, getCurrentMember } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "마케팅 수신 동의" };

/** /admin/marketing?state=active|withdrawn — 상담 신청 때 받은 마케팅 정보 수신 동의(선택) 목록·철회·CSV. RLS "admin marketing consents". 최근 500건. */
export default async function AdminMarketingPage({ searchParams }: { searchParams: Promise<{ state?: string }> }) {
  const sp = await searchParams;
  const state = sp.state === "active" || sp.state === "withdrawn" ? sp.state : "";
  const [me, supabase] = await Promise.all([getCurrentMember(), createClient()]);
  let q = supabase.from("marketing_consents").select("*").order("consent_at", { ascending: false }).limit(500);
  if (state === "active") q = q.is("withdrawn_at", null);
  if (state === "withdrawn") q = q.not("withdrawn_at", "is", null);
  const { data } = await q;
  return <MarketingView rows={(data ?? []) as MarketingConsentRow[]} state={state} owner={!!me && isOwnerRole(me)} />;
}
