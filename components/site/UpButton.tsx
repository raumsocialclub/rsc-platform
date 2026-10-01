"use client";

import { useEffect, useState } from "react";

/** 우하단 UP 플로팅 버튼. 화면 높이의 60% 이상 스크롤하면 나타난다. */
export function UpButton() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > window.innerHeight * 0.6);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <a
      href="#top"
      aria-label="맨 위로"
      className={`fixed right-[32px] bottom-[32px] z-[60] w-[52px] h-[52px] rounded-full bg-[rgba(33,30,25,.55)] hover:bg-[rgba(156,107,62,.75)] backdrop-blur-[6px] flex items-center justify-center text-cream hover:text-cream text-[16px] border border-[rgba(247,243,236,.25)] transition-opacity duration-[250ms] ${
        visible ? "opacity-100" : "opacity-0 pointer-events-none"
      }`}
    >
      ↑
    </a>
  );
}
