"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState, useSyncExternalStore } from "react";
import { POPUP_RATIOS, type Popup } from "@/lib/popups/types";

/** 오늘(한국 날짜) 하루 보지 않기 저장 키 */
const HIDE_KEY = (id: string) => `rsc_popup_hide:${id}`;
const todayKst = () => new Date(Date.now() + 9 * 3600_000).toISOString().slice(0, 10);
const noSubscribe = () => () => {};

/** 오늘 숨긴 팝업 id 들 (쉼표 연결, 서버 렌더에서는 null → 아직 안 그림) */
function readHidden(popups: Popup[]): string {
  try {
    const today = todayKst();
    return popups.filter((p) => localStorage.getItem(HIDE_KEY(p.id)) === today).map((p) => p.id).join(",");
  } catch {
    return "";
  }
}
function remember(id: string) {
  try { localStorage.setItem(HIDE_KEY(id), todayKst()); } catch {}
}

/** 데스크톱 한 장 너비: 화면 너비의 26% (300~440px), 세로가 화면을 넘지 않게 비율로 제한 */
const cardWidth = (w: number, h: number) => `min(clamp(300px, 26vw, 440px), calc((100vh - 70px) * ${w / h}))`;

/**
 * 홈 팝업 (M17). 서버가 "지금 노출 중"인 팝업만 넘겨주고, 여기서 "오늘 하루 보지 않기"로 숨긴 것을 뺀다.
 * - 데스크톱(768px~): 화면 왼쪽 위에 붙여 가로로 나란히(여러 개면 왼쪽부터). 장마다 「오늘 하루 보지 않음」·✕
 * - 모바일: 가운데 한 장씩 넘겨 보기
 * 바깥 클릭·ESC = 이번에 다 닫기. 미리보기(preview)는 어드민에서 저장 전 확인용(저장하지 않음).
 */
export function SitePopups({ popups, preview = false, onClose }: { popups: Popup[]; preview?: boolean; onClose?: () => void }) {
  const hidden = useSyncExternalStore(noSubscribe, () => readHidden(popups), () => null);
  const [dismissed, setDismissed] = useState<string[]>([]);
  const [closed, setClosed] = useState(false);
  const [i, setI] = useState(0);

  const ready = preview || hidden !== null;
  const hiddenIds = hidden ? hidden.split(",") : [];
  const list = ready ? popups.filter((p) => !dismissed.includes(p.id) && (preview || !hiddenIds.includes(p.id))) : [];
  const open = !closed && list.length > 0;

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setClosed(true); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);
  useEffect(() => {
    if (closed || (ready && list.length === 0)) onClose?.();
  }, [closed, ready, list.length, onClose]);

  if (!open) return null;

  /** 한 장 닫기 (hide: 오늘 하루 기억) */
  const dismiss = (id: string, hide: boolean) => {
    if (hide && !preview) remember(id);
    setDismissed((d) => [...d, id]);
    setI((x) => Math.min(x, Math.max(0, list.length - 2)));
  };

  const card = (p: Popup, mobile: boolean) => {
    const r = POPUP_RATIOS[p.ratio] ?? POPUP_RATIOS["1:1"];
    const img = (
      <div className="relative w-full bg-[#e7e0d3]" style={{ aspectRatio: `${r.w} / ${r.h}` }}>
        <Image src={p.image_url} alt={p.title} fill sizes="(max-width: 767px) 92vw, 440px" className="object-cover" unoptimized={p.image_url.startsWith("http")} priority />
      </div>
    );
    const linked = p.link_url
      ? p.link_url.startsWith("/")
        ? <Link href={p.link_url} className="block" onClick={() => setClosed(true)}>{img}</Link>
        : <a href={p.link_url} target="_blank" rel="noreferrer" className="block">{img}</a>
      : img;
    return (
      <div
        key={p.id}
        className="bg-white shadow-[0_24px_60px_rgba(0,0,0,.35)] overflow-hidden flex-none"
        style={{ width: mobile ? `min(92vw, calc((100vh - 140px) * ${r.w / r.h}))` : cardWidth(r.w, r.h) }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative">
          {linked}
          {mobile && list.length > 1 && (
            <>
              <button type="button" aria-label="이전" onClick={() => setI((x) => (x - 1 + list.length) % list.length)} className="absolute left-[8px] top-1/2 -translate-y-1/2 w-[34px] h-[34px] rounded-full bg-[rgba(255,255,255,.85)] text-ink border-0 cursor-pointer text-[18px] leading-none">‹</button>
              <button type="button" aria-label="다음" onClick={() => setI((x) => (x + 1) % list.length)} className="absolute right-[8px] top-1/2 -translate-y-1/2 w-[34px] h-[34px] rounded-full bg-[rgba(255,255,255,.85)] text-ink border-0 cursor-pointer text-[18px] leading-none">›</button>
              <div className="absolute bottom-[10px] left-0 right-0 flex justify-center gap-[6px]">
                {list.map((q, k) => <span key={q.id} className="w-[7px] h-[7px] rounded-full" style={{ background: k === Math.min(i, list.length - 1) ? "#f7f3ec" : "rgba(247,243,236,.45)" }} />)}
              </div>
            </>
          )}
        </div>
        <div className="flex items-center justify-between gap-[10px] px-[14px] py-[11px] text-[12.5px] border-t border-[rgba(33,30,25,.1)]">
          <button type="button" onClick={() => dismiss(p.id, true)} className="bg-transparent border-0 p-0 cursor-pointer text-[rgba(33,30,25,.6)] hover:text-brown">오늘 하루 보지 않음</button>
          <button type="button" onClick={() => dismiss(p.id, false)} aria-label="닫기" className="bg-transparent border-0 p-0 cursor-pointer font-semibold text-ink hover:text-brown text-[16px] leading-none">✕</button>
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-[1000] bg-[rgba(33,30,25,.55)]" role="dialog" aria-modal="true" aria-label="안내 팝업" onClick={() => setClosed(true)}>
      {/* 데스크톱: 왼쪽 위에 가로로 나란히 */}
      <div className="hidden md:flex absolute top-0 left-[16px] right-[16px] gap-[12px] items-start overflow-x-auto pb-[12px]">
        {list.map((p) => card(p, false))}
      </div>
      {/* 모바일: 가운데 한 장씩 */}
      <div className="md:hidden absolute inset-0 flex items-center justify-center p-[16px]">
        {card(list[Math.min(i, list.length - 1)], true)}
      </div>
    </div>
  );
}
