/** 관리자 관리 (M12) — 클라이언트에서도 import 가능 */
export type AdminRow = { id: string; name: string; email: string | null; role: "admin" | "owner"; status: "active" | "paused" | "withdrawn"; created_at: string; last_login_at: string | null };
export type InviteRow = { id: string; email: string; name: string; role: "admin" | "owner"; expires_at: string; used_at: string | null; revoked_at: string | null; created_at: string };

export function inviteState(i: InviteRow, now = new Date()): "pending" | "used" | "revoked" | "expired" {
  if (i.used_at) return "used";
  if (i.revoked_at) return "revoked";
  if (new Date(i.expires_at) < now) return "expired";
  return "pending";
}
export const INVITE_STATE_KO = { pending: "대기 중", used: "가입 완료", revoked: "취소됨", expired: "만료" } as const;
