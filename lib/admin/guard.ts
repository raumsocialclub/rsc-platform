import { headers } from "next/headers";
import { getCurrentMember, type CurrentMember } from "@/lib/auth/session";
import { getSettings } from "@/lib/settings/get";
import { clientIp, ipMatches, parseList } from "@/lib/settings/ip";

/** Route Handler 용 관리자 확인. 아니면 null. 일반 설정의 관리자 허용 IP 도 검사한다(/api/admin 은 proxy 가 안 거침). */
export async function requireAdmin(): Promise<CurrentMember | null> {
  const me = await getCurrentMember();
  if (!me || me.role !== "admin") return null;
  try {
    const allowed = parseList((await getSettings()).adminAllowedIps);
    if (allowed.length && !ipMatches(clientIp(await headers()), allowed)) return null;
  } catch {}
  return me;
}
