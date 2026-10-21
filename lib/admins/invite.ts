import { createHash, randomBytes } from "crypto";

/** 부관리자 초대 링크 토큰 (M12). DB 에는 sha256 해시만 저장한다. 비밀번호 재설정 링크(M16)도 같은 토큰 방식. */
export const ADMIN_INVITE_HOURS = 48;
/** 비밀번호 재설정 링크는 24시간 · 1회용 */
export const ADMIN_RESET_HOURS = 24;

export function newInviteToken(): { token: string; hash: string } {
  const token = randomBytes(32).toString("hex");
  return { token, hash: hashInviteToken(token) };
}
export function hashInviteToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}
function siteBase(): string {
  return (process.env.NEXT_PUBLIC_SITE_URL || "https://rsc-platform.vercel.app").replace(/\/+$/, "");
}
export function inviteLink(token: string): string {
  return `${siteBase()}/admin-invite/${token}`;
}
export function resetLink(token: string): string {
  return `${siteBase()}/admin-reset/${token}`;
}
export function isTokenShape(t: string): boolean {
  return /^[0-9a-f]{64}$/.test(t);
}
