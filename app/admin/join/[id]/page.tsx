import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { InquiryDetail, type InquiryRow } from "@/components/admin/InquiryDetail";
import { JoinProfileCard } from "@/components/admin/JoinProfileCard";
import { PageTitle } from "@/components/admin/ui";
import { isJoinRequest, profileCard } from "@/lib/inquiries/join";
import { createClient } from "@/lib/supabase/server";
import { attachEvents } from "@/lib/events/admin";

export const metadata: Metadata = { title: "회원 프로필 카드" };

/**
 * /admin/join/:id — 회원 프로필 카드 (2026-11-23). 왼쪽 큰 카드(사진 + 설문 답 섹션 + 가입 승인 버튼), 오른쪽 상담 메모·상태·초대코드 발급(기존 상세 패널).
 * 가입완료 회원도 같은 화면에서 언제든 본다. 프로필 진단 응답이 아니면 404.
 */
export default async function AdminJoinDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data } = await supabase
    .from("inquiries")
    .select("id, name, phone, email, result_type, status, memo, created_at, answers, utm, approved_at, approved_by, crm_status, crm_attempts, crm_applied")
    .eq("id", id)
    .maybeSingle();
  const row0 = data as (InquiryRow & { approved_at?: string | null; approved_by?: string | null }) | null;
  if (!row0 || !isJoinRequest(row0)) notFound();
  const [row] = await attachEvents(supabase, [row0]);

  const [{ data: inv }, approver] = await Promise.all([
    supabase.from("invite_codes").select("code, expires_at, used_at").eq("inquiry_id", row.id).order("created_at", { ascending: false }).limit(1).maybeSingle(),
    row.approved_by ? supabase.from("members").select("name").eq("id", row.approved_by).maybeSingle() : Promise.resolve({ data: null as { name: string } | null }),
  ]);
  const card = profileCard(row);
  return (
    <>
      <PageTitle overline="MEMBERSHIP" title="회원 프로필 카드" />
      <div className="grid grid-cols-1 min-[1201px]:grid-cols-[minmax(0,1fr)_minmax(0,380px)] gap-[20px] items-start">
        <JoinProfileCard id={row.id} card={card} approvedByName={approver.data?.name ?? null} />
        <InquiryDetail key={row.id} inquiry={{ ...row, invite: inv ?? null }} />
      </div>
    </>
  );
}
