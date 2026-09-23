import { createClient } from "@/lib/supabase/server";
import type { AdminRow, InviteRow } from "./types";

/** 관리자 목록 (owner 먼저, 그다음 이름순). RLS: 관리자는 회원 전체를 읽을 수 있다 */
export async function listAdmins(): Promise<AdminRow[]> {
  const supabase = await createClient();
  const { data } = await supabase.from("members").select("id, name, email, role, status, created_at, last_login_at").in("role", ["admin", "owner"]).order("created_at");
  const rows = ((data ?? []) as AdminRow[]).filter((r) => r.status !== "withdrawn");
  return rows.sort((a, b) => (a.role === b.role ? a.name.localeCompare(b.name, "ko") : a.role === "owner" ? -1 : 1));
}

/** 초대 목록 (최근 50). RLS: 주관리자만 */
export async function listInvites(): Promise<InviteRow[]> {
  const supabase = await createClient();
  const { data } = await supabase.from("admin_invites").select("id, email, name, role, expires_at, used_at, revoked_at, created_at").order("created_at", { ascending: false }).limit(50);
  return (data ?? []) as InviteRow[];
}
