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

/**
 * 홈 팝업 (M17). 서버가 "지금 노출 중"인 팝업만 넘겨주고, 여기서 "오늘 하루 보지 않기"로 숨긴 것을 뺀다.
 * 여러 개면 한 장씩 넘겨 본다. 바깥 클릭·ESC·닫기 = 이번에 다 닫기. 미리보기(preview)는 어드민에서 저장 전 확인용(저장하지 않음).
 */
export function SitePopups({ popups, preview = false, onClose }: { popups: Popup[]; preview?: boolean; onClose?: () => void }) {
  const hidden = useSyncExternalStore(noSubscribe, () => readHidden(popups), () => null);
  const [dismissed, setDismissed] = useState<string[]>([]);
  const [closed, setClosed] = useState(false);
  const [i, setI] = useState(0);
  const [hideToday, setHideToday] = useState(false);

  const ready = preview || hidden !== null;
  const hiddenIds = hidden ? hidden.split(",") : [];
  const list = ready ? popups.filter((p) => !dismissed.includes(p.id) && (preview || !hiddenIds.includes(p.id))) : [];
  const open = !closed && list.length > 0;

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setClosed(true); };
    window.addEventListener("keydown", onKey);
    return () => { document.body.style.overflow = prev; window.removeEventListener("keydown", onKey); };
  }, [open]);
  useEffect(() => {
    if (closed) onClose?.();
  }, [closed, onClose]);

  if (!open) return null;
  const cur = list[Math.min(i, list.length - 1)];
  const r = POPUP_RATIOS[cur.ratio] ?? POPUP_RATIOS["1:1"];

  const close = () => {
    if (hideToday && !preview) remember(cur.id);
    setClosed(true);
  };
  /** 현재 장만 오늘 하루 숨기고 다음 장으로 */
  const hideCurrent = () => {
    if (!preview) remember(cur.id);
    setDismissed((d) => [...d, cur.id]);
    setI((x) => Math.min(x, Math.max(0, list.length - 2)));
  };

  const img = (
    <div className="relative w-full bg-[#e7e0d3]" style={{ aspectRatio: `${r.w} / ${r.h}` }}>
      <Image src={cur.image_url} alt={cur.title} fill sizes="(max-width: 640px) 92vw, 480px" className="object-cover" unoptimized={cur.image_url.startsWith("http")} priority />
    </div>
  );
  const linked = cur.link_url
    ? cur.link_url.startsWith("/")
      ? <Link href={cur.link_url} className="block" onClick={close}>{img}</Link>
      : <a href={cur.link_url} target="_blank" rel="noreferrer" className="block">{img}</a>
    : img;

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-[16px] bg-[rgba(33,30,25,.62)]" role="dialog" aria-modal="true" aria-label={cur.title} onClick={close}>
      <div
        className="bg-white shadow-[0_24px_60px_rgba(0,0,0,.35)] overflow-hidden"
        style={{ width: `min(92vw, calc((100vh - 140px) * ${r.w / r.h}), 480px)` }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative">
          {linked}
          {list.length > 1 && (
            <>
              <button type="button" aria-label="이전" onClick={() => setI((x) => (x - 1 + list.length) % list.length)} className="absolute left-[8px] top-1/2 -translate-y-1/2 w-[34px] h-[34px] rounded-full bg-[rgba(255,255,255,.85)] text-ink border-0 cursor-pointer text-[18px] leading-none">‹</button>
              <button type="button" aria-label="다음" onClick={() => setI((x) => (x + 1) % list.length)} className="absolute right-[8px] top-1/2 -translate-y-1/2 w-[34px] h-[34px] rounded-full bg-[rgba(255,255,255,.85)] text-ink border-0 cursor-pointer text-[18px] leading-none">›</button>
              <div className="absolute bottom-[10px] left-0 right-0 flex justify-center gap-[6px]">
                {list.map((p, k) => <span key={p.id} className="w-[7px] h-[7px] rounded-full" style={{ background: k === Math.min(i, list.length - 1) ? "#f7f3ec" : "rgba(247,243,236,.45)" }} />)}
              </div>
            </>
          )}
        </div>
        <div className="flex items-center justify-between gap-[10px] px-[14px] py-[11px] text-[12.5px] border-t border-[rgba(33,30,25,.1)]">
          {list.length > 1 ? (
            <button type="button" onClick={hideCurrent} className="bg-transparent border-0 p-0 cursor-pointer text-[rgba(33,30,25,.6)] hover:text-brown">이 팝업 오늘 하루 보지 않기</button>
          ) : (
            <label className="flex items-center gap-[6px] cursor-pointer text-[rgba(33,30,25,.6)]">
              <input type="checkbox" checked={hideToday} onChange={(e) => setHideToday(e.target.checked)} />오늘 하루 보지 않기
            </label>
          )}
          <button type="button" onClick={close} className="bg-transparent border-0 p-0 cursor-pointer font-semibold text-ink hover:text-brown">닫기 ✕</button>
        </div>
      </div>
    </div>
  );
}
