import type { Metadata } from "next";
import { CouponsView, type InviteRow } from "@/components/admin/views";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "쿠폰 · 초대권 · RSC ADMIN" };

export default async function AdminCouponsPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("invite_codes")
    .select("id, code, issued_to_name, issued_to_phone, created_at, expires_at, used_at, used_by, inquiry_id")
    .order("created_at", { ascending: false })
    .limit(500);
  const raw = data ?? [];

  // 사용 회원 이름·상담 이름을 붙인다 (관리자 RLS)
  const memberIds = raw.map((r) => r.used_by).filter((x): x is string => !!x);
  const inquiryIds = raw.map((r) => r.inquiry_id).filter((x): x is string => !!x);
  const [members, inquiries] = await Promise.all([
    memberIds.length ? supabase.from("members").select("id, name").in("id", memberIds) : Promise.resolve({ data: [] as { id: string; name: string }[] }),
    inquiryIds.length ? supabase.from("inquiries").select("id, name").in("id", inquiryIds) : Promise.resolve({ data: [] as { id: string; name: string | null }[] }),
  ]);
  const mName = new Map((members.data ?? []).map((m) => [m.id, m.name]));
  const iName = new Map((inquiries.data ?? []).map((i) => [i.id, i.name]));

  const invites: InviteRow[] = raw.map((r) => ({
    id: r.id,
    code: r.code,
    issued_to_name: r.issued_to_name,
    issued_to_phone: r.issued_to_phone,
    created_at: r.created_at,
    expires_at: r.expires_at,
    used_at: r.used_at,
    used_by_name: r.used_by ? mName.get(r.used_by) ?? null : null,
    inquiry_name: r.inquiry_id ? iName.get(r.inquiry_id) ?? null : null,
  }));

  return <CouponsView invites={invites} />;
}
