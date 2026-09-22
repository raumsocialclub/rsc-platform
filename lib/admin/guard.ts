import { getCurrentMember, type CurrentMember } from "@/lib/auth/session";

/** Route Handler 용 관리자 확인. 아니면 null. */
export async function requireAdmin(): Promise<CurrentMember | null> {
  const me = await getCurrentMember();
  if (!me || me.role !== "admin") return null;
  return me;
}
