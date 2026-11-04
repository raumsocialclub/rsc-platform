"use client";

import { useEffect, useState } from "react";

/** 우하단 "맨 위로" 버튼. 화면 높이의 60% 이상 스크롤하면 나타난다 (Wanted DS 아이콘 버튼 스타일) */
export function UpButton() {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > window.innerHeight * 0.6);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  return (
    <a href="#top" aria-label="맨 위로" className={`fixed right-[20px] bottom-[20px] md:right-[32px] md:bottom-[32px] z-[60] w-[44px] h-[44px] rounded-full bg-white border border-lineNeutral shadow-md flex items-center justify-center text-label hover:bg-sand transition-opacity duration-200 ${visible ? "opacity-100" : "opacity-0 pointer-events-none"}`}>
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 19V5M5 12l7-7 7 7" /></svg>
    </a>
  );
}
