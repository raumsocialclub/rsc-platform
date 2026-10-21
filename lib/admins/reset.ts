import type { SupabaseClient } from "@supabase/supabase-js";
import { ADMIN_RESET_HOURS, newInviteToken, resetLink } from "./invite";

/**
 * 관리자 비밀번호 재설정 링크 (M16). admin_invites 에 kind='reset' 행으로 저장(토큰은 해시만), 24시간 · 1회용.
 * 같은 이메일의 대기 중 재설정 링크는 취소하고 새로 만든다. 두 경로가 함께 쓴다:
 *   - 주관리자가 관리자 관리 화면에서 발급 (RLS 클라이언트, 링크를 화면에 표시)
 *   - 로그인 화면 "비밀번호 찾기" (service role 클라이언트, 메일로만 전달)
 */
export type ResetTarget = { id: string; email: string; name?: string | null; role: "admin" | "owner" };

export async function createPasswordReset(db: SupabaseClient, target: ResetTarget, issuedBy: string | null): Promise<{ id: string; link: string; expiresAt: string } | null> {
  const email = target.email.toLowerCase();
  const now = new Date().toISOString();
  await db.from("admin_invites").update({ revoked_at: now }).eq("email", email).eq("kind", "reset").is("used_at", null).is("revoked_at", null);
  const { token, hash } = newInviteToken();
  const expiresAt = new Date(Date.now() + ADMIN_RESET_HOURS * 3600_000).toISOString();
  const { data, error } = await db
    .from("admin_invites")
    .insert({ email, name: target.name ?? "", role: target.role, kind: "reset", token_hash: hash, invited_by: issuedBy, expires_at: expiresAt })
    .select("id")
    .single();
  if (error || !data) {
    console.error("[admins/reset] insert", error);
    return null;
  }
  return { id: data.id as string, link: resetLink(token), expiresAt };
}

/** 재설정 토큰 조회 결과를 사용자 문구로. 유효하면 null. */
export function describeResetState(inv: { kind?: string; used_at: string | null; revoked_at: string | null; expires_at: string } | null): { title: string; body: string } | null {
  if (!inv || inv.kind !== "reset") return { title: "재설정 링크가 올바르지 않습니다", body: "존재하지 않는 링크입니다. 주관리자에게 새 링크를 요청해 주세요." };
  if (inv.used_at) return { title: "이미 사용된 링크입니다", body: "이 링크로 비밀번호를 이미 바꿨습니다. 새 비밀번호로 로그인해 주세요." };
  if (inv.revoked_at) return { title: "취소된 링크입니다", body: "새 링크가 발급되었거나 주관리자가 취소했습니다. 최신 링크를 사용해 주세요." };
  if (new Date(inv.expires_at) < new Date()) return { title: "링크가 만료되었습니다", body: `재설정 링크는 ${ADMIN_RESET_HOURS}시간 동안만 유효합니다. 주관리자에게 새 링크를 요청해 주세요.` };
  return null;
}
