import { SiteHeader } from "./SiteHeader";
import { getCurrentMember, initialOf } from "@/lib/auth/session";
import { getBrand } from "@/lib/cms/get";

/** 서버에서 로그인 상태와 브랜드 설정(CMS)을 읽어 SiteHeader 에 넘긴다. */
export async function Header() {
  let user: { name: string; initial: string } | null = null;
  try {
    const m = await getCurrentMember();
    if (m) user = { name: m.name, initial: initialOf(m) };
  } catch {
    user = null;
  }
  const b = await getBrand();
  return <SiteHeader user={user} brand={{ ctaLabel: b.ctaLabel || "RSC 상담 신청", ctaHref: b.ctaHref || "/fit-check", logoEmblem: b.logoEmblem || "/images/logo-emblem.png", logoText: b.logoText || "/images/logo-text-nav.png" }} />;
}
