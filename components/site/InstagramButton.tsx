import { btn } from "@/components/ui/ds";

const IG_URL = "https://www.instagram.com/raum_socialclub/";

/** 인스타그램 링크 버튼 (Outlined). href 를 비우면 기본 계정 */
export function InstagramButton({ href, size = "md", className = "" }: { href?: string; size?: "sm" | "md"; shape?: "pill" | "square"; className?: string }) {
  return (
    <a href={href || IG_URL} target="_blank" rel="noreferrer" className={btn("assistive", size === "sm" ? "sm" : "lg", className)}>
      <svg aria-hidden width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="18" height="18" rx="5" /><circle cx="12" cy="12" r="4" /><circle cx="17.3" cy="6.7" r="0.9" fill="currentColor" stroke="none" />
      </svg>
      인스타그램
    </a>
  );
}
