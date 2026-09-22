import { SiteHeader } from "./SiteHeader";
import { getCurrentMember, initialOf } from "@/lib/auth/session";

/** 서버에서 로그인 상태를 읽어 SiteHeader 에 넘긴다. Supabase 환경변수가 없으면 비로그인으로 렌더. */
export async function Header() {
  let user: { name: string; initial: string } | null = null;
  try {
    const m = await getCurrentMember();
    if (m) user = { name: m.name, initial: initialOf(m) };
  } catch {
    user = null;
  }
  return <SiteHeader user={user} />;
}
