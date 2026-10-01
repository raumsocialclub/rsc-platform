import { createHash, randomBytes } from "crypto";

/** 부관리자 초대 링크 토큰 (M12). DB 에는 sha256 해시만 저장한다. */
export const ADMIN_INVITE_HOURS = 48;

export function newInviteToken(): { token: string; hash: string } {
  const token = randomBytes(32).toString("hex");
  return { token, hash: hashInviteToken(token) };
}
export function hashInviteToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}
export function inviteLink(token: string): string {
  const base = (process.env.NEXT_PUBLIC_SITE_URL || "https://rsc-platform.vercel.app").replace(/\/+$/, "");
  return `${base}/admin-invite/${token}`;
}
export function isTokenShape(t: string): boolean {
  return /^[0-9a-f]{64}$/.test(t);
}
