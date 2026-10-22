"use client";

import { useEffect, useRef, useState } from "react";

export type FamilySite = { label: string; url: string };

/** 푸터의 "Family Site" 드롭다운. 모바일은 아래로, 데스크톱은 위로 목록이 열리고 바깥 클릭·ESC 로 닫힌다. 항목은 CMS(global.brand). */
export function FamilySiteMenu({ sites }: { sites: FamilySite[] }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("mousedown", onDown); document.removeEventListener("keydown", onKey); };
  }, [open]);
  const list = sites.filter((s) => s.label && s.url);
  if (list.length === 0) return null;
  return (
    <div ref={ref} className="relative inline-block w-full md:w-[240px]">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="w-full flex items-center justify-between gap-[16px] px-[18px] py-[12px] border border-[rgba(33,30,25,.25)] bg-transparent cursor-pointer text-[13px] tracking-[.04em] text-ink hover:border-brown"
      >
        <svg aria-hidden width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={`text-[rgba(33,30,25,.6)] transition-transform ${open ? "rotate-180" : ""}`}>
          <polyline points="6 9 12 15 18 9" />
        </svg>
        <span className="flex-1 text-right">Family Site</span>
      </button>
      {open && (
        <ul role="menu" className="absolute left-0 right-0 top-full mt-[-1px] md:top-auto md:mt-0 md:bottom-full md:mb-[-1px] m-0 p-0 list-none border border-[rgba(33,30,25,.25)] bg-cream shadow-[0_8px_24px_rgba(33,30,25,.08)] z-10">
          {list.map((s) => (
            <li key={s.url} role="none">
              <a role="menuitem" href={s.url} target="_blank" rel="noreferrer" onClick={() => setOpen(false)} className="block px-[18px] py-[12px] text-[13px] text-ink hover:bg-sand hover:text-brown border-b border-[rgba(33,30,25,.1)] last:border-b-0">
                {s.label}
              </a>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
