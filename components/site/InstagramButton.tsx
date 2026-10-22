import Link from "next/link";

const IG_URL = "https://www.instagram.com/raum_socialclub/";

/** 인스타그램으로 가는 알약 버튼. 상담 신청 완료 화면·푸터에서 쓴다. href 를 비우면 기본 계정 주소. */
export function InstagramButton({ href, size = "md", shape = "pill", className = "" }: { href?: string; size?: "sm" | "md"; shape?: "pill" | "square"; className?: string }) {
  const pad = size === "sm" ? "px-[18px] py-[9px] text-[12.5px]" : "px-[34px] py-[16px] text-[13.5px]";
  const radius = shape === "pill" ? "rounded-pill" : "rounded-none";
  return (
    <Link
      href={href || IG_URL}
      target="_blank"
      rel="noreferrer"
      className={`inline-flex items-center gap-[8px] border border-brown text-brown font-semibold whitespace-nowrap hover:bg-brown hover:text-cream ${radius} ${pad} ${className}`}
    >
      <svg aria-hidden width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="18" height="18" rx="5" />
        <circle cx="12" cy="12" r="4" />
        <circle cx="17.3" cy="6.7" r="0.9" fill="currentColor" stroke="none" />
      </svg>
      인스타그램 보기
    </Link>
  );
}
