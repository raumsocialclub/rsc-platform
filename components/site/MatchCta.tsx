"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

/**
 * 프로필 진단 플로팅 버튼 (2026-11-16, 1:1 매칭 DB 수집). 공개 페이지 아래 가운데에 떠 있고, 위에 말풍선이 붙는다.
 * 「문구 세트」(버튼 문구 + 말풍선 두 줄)가 몇 초마다 함께 바뀐다 — 레퍼런스 문구를 그대로 쓰지 않도록 라움 톤으로 다시 쓴 세트 3개가 기본값(CMS match.cta).
 * 세트에 버튼 문구가 없으면 기본 버튼 문구(label)를 쓴다. 문구·링크·보이기는 CMS(match.cta). 상담 신청·설문·진단 화면, 어드민·로그인·결제 등에서는 보이지 않는다. 스크롤을 조금 내린 뒤 나타난다(첫 화면의 히어로를 가리지 않도록).
 * 채널톡 버튼이 떠 있으면(html[data-chat]) 가운데 배치라 겹치지 않는다. 「맨 위로」 버튼은 오른쪽이라 역시 겹치지 않는다.
 */
export type MatchCtaProps = { visible: boolean; label: string; href: string; hint?: string; hooks: { label?: string; title: string; body: string }[] };

const HIDE = [/^\/match-check/, /^\/fit-check/, /^\/apply/, /^\/admin/, /^\/login/, /^\/admin-invite/, /^\/checkout/, /^\/join/, /^\/auth/, /^\/api/, /^\/partner/];

export function MatchCta({ visible, label, href, hint, hooks }: MatchCtaProps) {
  const pathname = usePathname();
  const [shown, setShown] = useState(false);
  const [i, setI] = useState(0);
  const [fade, setFade] = useState(true);
  const list = hooks.filter((h) => h.label || h.title || h.body);
  const on = visible && !!(label || list.some((h) => h.label)) && !!href && !!pathname && !HIDE.some((re) => re.test(pathname));

  useEffect(() => {
    if (!on) return;
    const onScroll = () => setShown(window.scrollY > 160);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [on]);
  useEffect(() => {
    if (!on || !shown) return;
    document.documentElement.setAttribute("data-match-cta", "");
    return () => document.documentElement.removeAttribute("data-match-cta");
  }, [on, shown]);
  useEffect(() => {
    if (!on || list.length < 2) return;
    const t = window.setInterval(() => {
      setFade(false);
      window.setTimeout(() => { setI((x) => (x + 1) % list.length); setFade(true); }, 260);
    }, 5200);
    return () => window.clearInterval(t);
  }, [on, list.length]);

  if (!on) return null;
  const hook = list[i % Math.max(1, list.length)];
  const text = hook?.label || label;
  return (
    <div className={`match-cta fixed inset-x-0 bottom-0 z-[55] flex justify-center px-[16px] pointer-events-none transition-[opacity,transform] duration-500 ${shown ? "opacity-100 translate-y-0" : "opacity-0 translate-y-[16px]"}`} style={{ paddingBottom: "calc(16px + env(safe-area-inset-bottom))" }} data-testid="match-cta">
      <div className="w-full max-w-[520px] pointer-events-auto">
        {hook && (hook.title || hook.body) && (
          <div className="relative mx-auto w-fit max-w-full mb-[10px]">
            <div className={`flex items-center gap-[12px] bg-white rounded-[18px] px-[16px] py-[11px] shadow-[0_8px_28px_rgba(0,0,0,.14)] border border-lineAlt transition-opacity duration-300 ${fade ? "opacity-100" : "opacity-0"}`} aria-live="polite">
              <span className="flex-none w-[32px] h-[32px] rounded-full bg-[rgba(var(--ds-primary-rgb),.1)] text-primary flex items-center justify-center" aria-hidden>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="12" r="4.5" /><circle cx="15" cy="12" r="4.5" /></svg>
              </span>
              <span className="min-w-0">
                {hook.title && <b className="block t-label-1 font-bold text-label truncate">{hook.title}</b>}
                {hook.body && <span className="block t-caption-1 text-labelAlt truncate">{hook.body}</span>}
              </span>
            </div>
            <span aria-hidden className="absolute left-1/2 -bottom-[7px] -translate-x-1/2 w-[14px] h-[14px] rotate-45 bg-white border-r border-b border-lineAlt" />
          </div>
        )}
        <Link href={href} className="group flex items-center justify-between gap-[12px] h-[60px] pl-[26px] pr-[8px] rounded-full text-white shadow-[0_12px_32px_rgba(var(--ds-primary-rgb),.38)] hover:shadow-[0_14px_36px_rgba(var(--ds-primary-rgb),.5)] hover:-translate-y-[2px] active:scale-[.985] transition-[transform,box-shadow] duration-200" style={{ background: "linear-gradient(100deg, var(--ds-primary) 0%, var(--ds-primary-strong) 55%, var(--c-gold) 130%)" }}>
          <span className={`t-body-1 font-bold text-[18px] tracking-[-0.01em] truncate transition-opacity duration-300 ${fade ? "opacity-100" : "opacity-0"}`}>{text}</span>
          <span className="flex-none w-[44px] h-[44px] rounded-full bg-white/15 border border-white/40 flex items-center justify-center transition-[background-color] duration-200 group-hover:bg-white/25" aria-hidden>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
          </span>
        </Link>
        {hint && <p className="mt-[8px] text-center t-caption-1 text-labelAlt drop-shadow-[0_1px_0_rgba(255,255,255,.8)]">{hint}</p>}
      </div>
    </div>
  );
}
