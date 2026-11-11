"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { Logo } from "./Logo";
import { ButtonLink, btn } from "@/components/ui/ds";

const INK_FILTER = "invert(1) brightness(0.15)";

export type HeaderUser = { name: string; initial: string };
export type HeaderBrand = { ctaLabel: string; ctaHref: string; logoEmblem: string; logoText: string };
const DEFAULT_BRAND: HeaderBrand = { ctaLabel: "RSC 상담 신청", ctaHref: "/fit-check", logoEmblem: "/images/logo-emblem.png", logoText: "/images/logo-text-nav.png" };
/** 메뉴 이름 (CMS global.nav). 비어 있으면 기본 이름 */
export type NavLabels = Partial<Record<"navSocial" | "navMatching" | "navAbout" | "navPrograms" | "navMembership" | "navNews" | "navFaq" | "navMy" | "navLogin" | "navLogout", string>>;
const DEFAULT_NAV: Required<NavLabels> = { navSocial: "소셜클럽", navMatching: "1:1 매칭", navAbout: "브랜드소개", navPrograms: "프로그램", navMembership: "멤버십", navNews: "소식", navFaq: "FAQ", navMy: "내 예약", navLogin: "로그인", navLogout: "로그아웃" };
const NAV = "link-grow t-label-1 lg:t-body-2 font-semibold text-labelNeutral hover:text-primary py-[4px] whitespace-nowrap";

/**
 * 공통 GNB (Wanted DS). 흰 배경 64px(모바일 56px) 고정 바 · 로고 · 메뉴(브랜드소개 · 소셜클럽 · 1:1 매칭 · 소식 · FAQ, 가운데 정렬 · 넓은 간격) · 주요 버튼. "혜택" 메뉴는 내용 확정 전이라 2026-11 요청으로 뺐다(페이지 /benefits 는 유지). 모바일은 햄버거 → 전체 화면 메뉴.
 * 로그인 상태(user)면 "프로그램 · 내 예약 · 이니셜 아바타". leadMode(리드 모드)면 예약·로그인 링크를 숨기고 상담 신청만 남긴다.
 */
export function SiteHeader({ user = null, brand = DEFAULT_BRAND, leadMode = false, labels }: { user?: HeaderUser | null; brand?: HeaderBrand; leadMode?: boolean; labels?: NavLabels }) {
  const L = { ...DEFAULT_NAV, ...Object.fromEntries(Object.entries(labels ?? {}).filter(([, v]) => !!v)) } as Required<NavLabels>;
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const close = () => setOpen(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);
  const loggedIn = !!user && !leadMode;

  return (
    <>
      <header className={`fixed top-0 left-0 right-0 z-[60] h-[56px] md:h-[64px] bg-white/95 backdrop-blur-[12px] border-b transition-[box-shadow,border-color] duration-300 ${scrolled ? "border-lineNeutral shadow-sm" : "border-lineAlt"}`}>
        <div className="h-full max-w-[1200px] mx-auto px-[20px] md:px-[32px] flex items-center justify-between gap-[16px]">
          <Logo href="/" emblemClass="h-[26px] md:h-[32px]" textClass="h-[14px] md:h-[16px]" textSrc={brand.logoText} emblemSrc={brand.logoEmblem} className="gap-[10px] flex-none" />
          <nav className="hidden md:flex items-center gap-[24px] lg:gap-[48px] mx-auto px-[16px] lg:px-[24px]">
            <Link href="/#about" className={NAV}>{L.navAbout}</Link>
            <Link href="/social" className={NAV}>{L.navSocial}</Link>
            <Link href="/matching" className={NAV}>{L.navMatching}</Link>
            {!leadMode && <Link href="/programs" className={NAV}>{L.navPrograms}</Link>}
            {!leadMode && <Link href="/pricing" className={NAV}>{L.navMembership}</Link>}
            <Link href="/news" className={NAV}>{L.navNews}</Link>
            <Link href="/#faq" className={NAV}>{L.navFaq}</Link>
          </nav>
          <div className="flex items-center gap-[8px] md:gap-[12px]">
            {loggedIn ? (
              <>
                <Link href="/my" className={`hidden md:inline-flex ${NAV}`}>{L.navMy}</Link>
                <form action="/auth/signout" method="post" className="hidden md:block">
                  <button type="submit" className={btn("text", "sm")}>{L.navLogout}</button>
                </form>
                <Link href="/my" aria-label={`${user.name || "회원"} ${L.navMy}`} className="w-[32px] h-[32px] rounded-full bg-primary text-white hover:text-white flex items-center justify-center t-label-2 font-semibold flex-none">{user.initial}</Link>
              </>
            ) : (
              <>
                {leadMode && user ? (
                  <form action="/auth/signout" method="post" className="hidden md:block"><button type="submit" className={btn("text", "sm")}>{L.navLogout}</button></form>
                ) : !leadMode ? (
                  <Link href="/login" className={`max-md:hidden ${btn("assistive", "md")}`}>{L.navLogin}</Link>
                ) : null}
                <ButtonLink href={brand.ctaHref} variant="solid" size="md" className="!h-[36px] !px-[14px] !text-[14px] md:!h-[40px] md:!px-[20px] md:!text-[15px]">
                  <span className="md:hidden">{brand.ctaLabel.replace(/^RSC\s+/, "")}</span>
                  <span className="hidden md:inline">{brand.ctaLabel}</span>
                </ButtonLink>
              </>
            )}
            <button type="button" aria-label="메뉴 열기" onClick={() => setOpen(true)} className="flex md:hidden items-center justify-center w-[36px] h-[36px] rounded-ds-sm cursor-pointer text-label bg-transparent border-0 hover:bg-fillAlt">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M4 7h16M4 12h16M4 17h16" /></svg>
            </button>
          </div>
        </div>
      </header>

      {open && (
        <div className="fixed inset-0 z-[90] bg-white flex flex-col px-[20px] py-[12px] anim-pop overflow-y-auto">
          <div className="h-[44px] flex items-center justify-between mb-[24px]">
            <Image src={brand.logoEmblem} alt="RAUM SOCIAL CLUB" width={529} height={638} className="h-[26px] w-auto" style={{ filter: INK_FILTER }} unoptimized={brand.logoEmblem.startsWith("http")} />
            <button type="button" aria-label="메뉴 닫기" onClick={close} className="w-[36px] h-[36px] rounded-ds-sm flex items-center justify-center cursor-pointer text-label bg-transparent border-0 hover:bg-fillAlt">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M6 6l12 12M18 6L6 18" /></svg>
            </button>
          </div>
          <nav className="flex flex-col">
            {[
              { href: "/#about", label: L.navAbout },
              { href: "/social", label: L.navSocial },
              { href: "/matching", label: L.navMatching },
              ...(!leadMode ? [{ href: "/programs", label: loggedIn ? L.navPrograms : `${L.navPrograms} 예약` }] : []),
              ...(!leadMode ? [{ href: "/pricing", label: L.navMembership }] : []),
              { href: "/news", label: L.navNews },
              { href: "/#faq", label: L.navFaq },
              ...(loggedIn ? [{ href: "/my", label: L.navMy }] : []),
            ].map((n, i) => (
              <Link key={n.href} href={n.href} onClick={close} style={{ animationDelay: `${60 + i * 40}ms` }} className="anim-up t-heading-2 text-label py-[14px] border-b border-lineAlt flex items-center justify-between active:text-primary">{n.label}<span className="text-labelAssist" aria-hidden>→</span></Link>
            ))}
            {!leadMode && !loggedIn && <Link href="/login" onClick={close} className="t-heading-2 text-labelAlt py-[14px] border-b border-lineAlt">{L.navLogin}</Link>}
            {(loggedIn || (leadMode && user)) && (
              <form action="/auth/signout" method="post"><button type="submit" className="bg-transparent border-0 cursor-pointer p-0 t-heading-2 text-labelAlt py-[14px] w-full text-left">{L.navLogout}</button></form>
            )}
          </nav>
          {loggedIn ? (
            <div className="mt-auto flex items-center gap-[12px] t-body-2 text-labelAlt">
              <span className="w-[32px] h-[32px] rounded-full bg-primary text-white flex items-center justify-center t-label-2 font-semibold">{user.initial}</span>
              {user.name || "회원"}님
            </div>
          ) : (
            <ButtonLink href={brand.ctaHref} variant="solid" size="lg" className="mt-auto w-full" onClick={close}>{brand.ctaLabel}</ButtonLink>
          )}
        </div>
      )}
    </>
  );
}
