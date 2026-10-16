import { headers } from "next/headers";
import { getCurrentMember, isAdminRole, isOwnerRole, type CurrentMember } from "@/lib/auth/session";
import { getSettings } from "@/lib/settings/get";
import { clientIp, ipMatches, parseList } from "@/lib/settings/ip";

/**
 * Route Handler 용 관리자 확인(부관리자 이상, 활동 상태). 아니면 null.
 * 일반 설정의 관리자 허용 IP 도 검사한다(/api/admin 은 proxy 가 안 거침).
 */
export async function requireAdmin(): Promise<CurrentMember | null> {
  const me = await getCurrentMember();
  if (!isAdminRole(me)) return null;
  try {
    const allowed = parseList((await getSettings()).adminAllowedIps);
    if (allowed.length && !ipMatches(clientIp(await headers()), allowed)) return null;
  } catch {}
  return me;
}

/** 주관리자 전용 (M12): 관리자 관리 · 일반 설정 · SEO 설정 저장 · 회원 목록 CSV */
export async function requireOwner(): Promise<CurrentMember | null> {
  const me = await requireAdmin();
  return me && isOwnerRole(me) ? me : null;
}

export const OWNER_ONLY_MESSAGE = "주관리자만 할 수 있는 작업입니다.";
