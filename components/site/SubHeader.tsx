import Link from "next/link";
import { Logo } from "./Logo";

type Props = {
  /** 좌측 텍스트 링크 (예: { label: "홈으로", href: "/" }) */
  link: { label: string; href: string };
  textSrc?: string;
};

/** 가격·혜택 페이지의 sticky GNB. deploy/pricing.html, benefits.html <header> 재현. */
export function SubHeader({ link, textSrc }: Props) {
  return (
    <header className="sticky top-0 z-50 flex items-center justify-between gap-[16px] px-[18px] py-[14px] md:px-[40px] md:py-[16px] bg-[rgba(247,243,236,.9)] backdrop-blur-[14px] border-b border-[rgba(33,30,25,.1)]">
      <Logo href="/" emblemClass="h-[32px]" textClass="h-[15px]" textSrc={textSrc} className="gap-[12px]" />
      <div className="flex items-center gap-[10px]">
        <Link href={link.href} className="text-[13px] font-semibold text-brown px-[12px] py-[8px]">
          {link.label}
        </Link>
        <Link
          href="/fit-check"
          className="inline-flex items-center px-[20px] py-[10px] rounded-pill bg-brown text-cream text-[12.5px] font-semibold hover:bg-brownHover hover:text-cream"
        >
          RSC 상담 신청하기
        </Link>
      </div>
    </header>
  );
}
