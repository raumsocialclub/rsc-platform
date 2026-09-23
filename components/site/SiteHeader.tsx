"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { Logo } from "./Logo";

const INK_FILTER = "invert(1) brightness(0.15)";

export type HeaderUser = { name: string; initial: string };
export type HeaderBrand = { ctaLabel: string; ctaHref: string; logoEmblem: string; logoText: string };
const DEFAULT_BRAND: HeaderBrand = { ctaLabel: "RSC 상담 신청", ctaHref: "/fit-check", logoEmblem: "/images/logo-emblem.png", logoText: "/images/logo-text-nav.png" };

/**
 * 공통 GNB. 데스크톱: fixed 상단 바 + 메뉴 텍스트. 모바일: 햄버거 → 전체화면 오버레이.
 * deploy/index.html <header> 재현. 로그인 상태(user)면 "프로그램 · 내 예약 · 이니셜 아바타"로 바뀐다.
 * user 는 서버 컴포넌트 <Header /> 가 넣어 준다.
 */
export function SiteHeader({ user = null, brand = DEFAULT_BRAND }: { user?: HeaderUser | null; brand?: HeaderBrand }) {
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);
  const loggedIn = !!user;

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-[60] flex items-center justify-between gap-[16px] px-[18px] py-[14px] md:px-[40px] md:py-[18px] bg-[rgba(247,243,236,.86)] backdrop-blur-[16px] border-b border-[rgba(33,30,25,.1)]">
        <Logo
          href="/"
          emblemClass="h-[28px] md:h-[39px]"
          textClass="h-[16px] md:h-[18px]"
          textSrc={brand.logoText}
          emblemSrc={brand.logoEmblem}
        />
        <div className="flex items-center gap-[20px] ml-auto">
          {loggedIn ? (
            <>
              <nav className="hidden md:flex items-center gap-[34px] text-[13.5px] font-semibold tracking-[.02em] text-brown">
                <Link href="/#about">서비스 소개</Link>
                <Link href="/programs">프로그램</Link>
                <Link href="/news">소식</Link>
                <Link href="/my">내 예약</Link>
              </nav>
              <form action="/auth/signout" method="post" className="hidden md:block">
                <button type="submit" className="bg-transparent border-0 cursor-pointer text-[13px] font-semibold text-brown whitespace-nowrap hover:text-brownHover">
                  로그아웃
                </button>
              </form>
              <Link
                href="/my"
                aria-label={`${user.name || "회원"} 내 예약`}
                className="w-[32px] h-[32px] rounded-full bg-brown text-cream hover:text-cream flex items-center justify-center text-[12px] font-semibold flex-none"
              >
                {user.initial}
              </Link>
            </>
          ) : (
            <>
              <nav className="hidden md:flex items-center gap-[34px] text-[13.5px] font-semibold tracking-[.02em] text-brown">
                <Link href="/#about">서비스 소개</Link>
                <Link href="/programs">프로그램 예약</Link>
                <Link href="/news">소식</Link>
              </nav>
              <Link href="/login" className="hidden md:flex items-center text-[13px] font-semibold text-brown whitespace-nowrap">
                로그인
              </Link>
              <Link
                href={brand.ctaHref}
                className="inline-flex items-center gap-[6px] md:gap-[9px] px-[14px] py-[9px] md:px-[20px] md:py-[11px] border border-brown rounded-pill text-[11.5px] md:text-[12.5px] whitespace-nowrap bg-brown text-cream font-semibold hover:bg-brownHover hover:border-brownHover hover:text-cream"
              >
                <span className="md:hidden">{brand.ctaLabel.replace(/^RSC\s+/, "")}</span>
                <span className="hidden md:inline">{brand.ctaLabel}</span>
                <span className="opacity-70">→</span>
              </Link>
            </>
          )}
          <button
            type="button"
            aria-label="메뉴 열기"
            onClick={() => setOpen(true)}
            className="flex md:hidden items-center justify-center w-[34px] h-[34px] cursor-pointer text-brown text-[24px] flex-none bg-transparent border-0"
          >
            ≡
          </button>
        </div>
      </header>

      {open && (
        <div className="fixed inset-0 z-[90] bg-cream flex flex-col px-[28px] py-[24px]">
          <div className="flex items-center justify-between mb-[56px]">
            <Image
              src={brand.logoEmblem}
              alt="RAUM SOCIAL CLUB"
              width={529}
              height={638}
              className="h-[30px] w-auto"
              style={{ filter: INK_FILTER }}
              unoptimized={brand.logoEmblem.startsWith("http")}
            />
            <button
              type="button"
              aria-label="메뉴 닫기"
              onClick={close}
              className="w-[34px] h-[34px] flex items-center justify-center cursor-pointer text-[24px] text-brown bg-transparent border-0"
            >
              ✕
            </button>
          </div>
          <nav className="flex flex-col gap-[32px] text-[22px] font-semibold text-ink">
            <Link href="/#about" onClick={close}>서비스 소개</Link>
            <Link href="/news" onClick={close}>소식</Link>
            {loggedIn ? (
              <>
                <Link href="/programs" onClick={close}>프로그램</Link>
                <Link href="/my" onClick={close}>내 예약</Link>
                <form action="/auth/signout" method="post">
                  <button type="submit" className="bg-transparent border-0 cursor-pointer p-0 text-[22px] font-semibold text-brown">로그아웃</button>
                </form>
              </>
            ) : (
              <>
                <Link href="/programs">프로그램 예약</Link>
                <Link href="/login" className="text-brown">로그인</Link>
              </>
            )}
          </nav>
          {loggedIn ? (
            <div className="mt-auto flex items-center gap-[12px] text-[14px] text-[rgba(33,30,25,.65)]">
              <span className="w-[32px] h-[32px] rounded-full bg-brown text-cream flex items-center justify-center text-[12px] font-semibold">{user.initial}</span>
              {user.name || "회원"}님
            </div>
          ) : (
            <Link
              href={brand.ctaHref}
              onClick={close}
              className="mt-auto inline-flex items-center justify-center px-[28px] py-[16px] rounded-pill bg-brown text-cream text-[15px] font-semibold hover:text-cream"
            >
              {brand.ctaLabel}
            </Link>
          )}
        </div>
      )}
    </>
  );
}
