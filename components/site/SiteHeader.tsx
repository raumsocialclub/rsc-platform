"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { Logo } from "./Logo";

const INK_FILTER = "invert(1) brightness(0.15)";

/**
 * 메인 페이지 GNB. 데스크톱: fixed 상단 바 + 메뉴 텍스트. 모바일: 햄버거 → 전체화면 오버레이.
 * deploy/index.html <header> 재현.
 */
export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-[60] flex items-center justify-between gap-[16px] px-[18px] py-[14px] md:px-[40px] md:py-[18px] bg-[rgba(247,243,236,.86)] backdrop-blur-[16px] border-b border-[rgba(33,30,25,.1)]">
        <Logo
          href="/"
          emblemClass="h-[28px] md:h-[39px]"
          textClass="h-[16px] md:h-[18px]"
          textSrc="/images/logo-text-nav.png"
        />
        <div className="flex items-center gap-[20px] ml-auto">
          <nav className="hidden md:flex items-center gap-[34px] text-[13.5px] font-semibold tracking-[.02em] text-brown">
            <Link href="/#about">서비스 소개</Link>
            <Link href="/programs">프로그램 예약</Link>
          </nav>
          <Link href="/login" className="hidden md:flex items-center text-[13px] font-semibold text-brown whitespace-nowrap">
            로그인
          </Link>
          <Link
            href="/fit-check"
            className="inline-flex items-center gap-[6px] md:gap-[9px] px-[14px] py-[9px] md:px-[20px] md:py-[11px] border border-brown rounded-pill text-[11.5px] md:text-[12.5px] whitespace-nowrap bg-brown text-cream font-semibold hover:bg-brownHover hover:border-brownHover hover:text-cream"
          >
            <span className="md:hidden">상담 신청</span>
            <span className="hidden md:inline">RSC 상담 신청</span>
            <span className="opacity-70">→</span>
          </Link>
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
              src="/images/logo-emblem.png"
              alt="RAUM SOCIAL CLUB"
              width={529}
              height={638}
              className="h-[30px] w-auto"
              style={{ filter: INK_FILTER }}
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
            <Link href="/programs">프로그램 예약</Link>
            <Link href="/login" className="text-brown">로그인</Link>
          </nav>
          <Link
            href="/fit-check"
            onClick={close}
            className="mt-auto inline-flex items-center justify-center px-[28px] py-[16px] rounded-pill bg-brown text-cream text-[15px] font-semibold hover:text-cream"
          >
            RSC 상담 신청
          </Link>
        </div>
      )}
    </>
  );
}
