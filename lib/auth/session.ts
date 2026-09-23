import { createClient } from "@/lib/supabase/server";

export type CurrentMember = {
  id: string;
  email: string | null;
  name: string;
  role: "member" | "admin" | "owner";
  status: "active" | "paused" | "withdrawn";
  /** 초대코드가 연결되지 않은 소셜 가입자는 null → /join 에서 코드 입력 필요 */
  inviteCodeId: string | null;
};

/** 현재 로그인한 회원. 로그인 안 했으면 null. members 행이 아직 없으면 name 빈 값. */
export async function getCurrentMember(): Promise<CurrentMember | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: m } = await supabase
    .from("members")
    .select("id, email, name, role, status, invite_code_id")
    .eq("id", user.id)
    .maybeSingle();

  return {
    id: user.id,
    email: user.email ?? m?.email ?? null,
    name: m?.name ?? (user.user_metadata?.name as string | undefined) ?? "",
    role: (m?.role as CurrentMember["role"]) ?? "member",
    status: (m?.status as CurrentMember["status"]) ?? "active",
    inviteCodeId: m?.invite_code_id ?? null,
  };
}

/** 부관리자 이상 (활동 상태만) */
export function isAdminRole(m: Pick<CurrentMember, "role" | "status"> | null | undefined): boolean {
  return !!m && (m.role === "admin" || m.role === "owner") && m.status === "active";
}
/** 주관리자 */
export function isOwnerRole(m: Pick<CurrentMember, "role" | "status"> | null | undefined): boolean {
  return !!m && m.role === "owner" && m.status === "active";
}
export const ROLE_KO: Record<CurrentMember["role"], string> = { owner: "주관리자", admin: "부관리자", member: "회원" };

/** GNB 아바타용 이니셜 (이름 첫 글자, 없으면 이메일 첫 글자, 없으면 R) */
export function initialOf(m: { name: string; email: string | null }) {
  const src = m.name?.trim() || m.email || "R";
  return src[0].toUpperCase();
}
