"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { BTN_PRIMARY, BTN_SECONDARY } from "./ui";

const SELECT = "px-[14px] py-[10px] text-[13px] border border-[rgba(33,30,25,.2)] bg-white rounded-none outline-none";
const DATE = "px-[10px] py-[8px] text-[12.5px] border border-[rgba(33,30,25,.2)] bg-white rounded-none outline-none";

/** 한국 날짜 YYYY-MM-DD (브라우저 시간대와 무관하게 서울 기준) */
function kstDay(d = new Date()): string {
  return d.toLocaleDateString("sv-SE", { timeZone: "Asia/Seoul" });
}
function shift(day: string, n: number): string {
  const d = new Date(`${day}T00:00:00+09:00`);
  d.setUTCDate(d.getUTCDate() + n);
  return kstDay(d);
}
type Preset = { k: string; l: string; range: () => { from: string; to: string } | null };
const PRESETS: Preset[] = [
  { k: "today", l: "오늘", range: () => { const t = kstDay(); return { from: t, to: t }; } },
  { k: "yesterday", l: "어제", range: () => { const y = shift(kstDay(), -1); return { from: y, to: y }; } },
  { k: "7d", l: "최근 7일", range: () => { const t = kstDay(); return { from: shift(t, -6), to: t }; } },
  { k: "month", l: "이번 달", range: () => { const t = kstDay(); return { from: `${t.slice(0, 7)}-01`, to: t }; } },
  { k: "last", l: "지난 달", range: () => { const first = `${kstDay().slice(0, 7)}-01`; const end = shift(first, -1); return { from: `${end.slice(0, 7)}-01`, to: end }; } },
  { k: "all", l: "전체", range: () => null },
];

/**
 * 상담 신청 목록의 유입 광고(UTM) 필터 + 메타 리드 양식 CSV 내려받기(주관리자만). 선택지는 실제 신청에 있는 값만.
 * CSV 는 버튼을 누르면 기간 패널이 열리고(기본 최근 7일), 빠른 선택이나 날짜 입력으로 범위를 정한 뒤 내려받는다. 기간은 한국 날짜, 양 끝 포함.
 */
export function InquiriesFilter({ filter, options, canExport = false }: { filter: { source: string; campaign: string }; options: { sources: string[]; campaigns: string[] }; canExport?: boolean }) {
  const router = useRouter();
  const go = (next: Partial<typeof filter>) => {
    const f = { ...filter, ...next };
    const p = new URLSearchParams();
    if (f.source) p.set("source", f.source);
    if (f.campaign) p.set("campaign", f.campaign);
    router.push(`/admin/inquiries${p.toString() ? `?${p}` : ""}`);
  };

  const [open, setOpen] = useState(false);
  const [preset, setPreset] = useState("7d");
  const [range, setRange] = useState<{ from: string; to: string }>(() => PRESETS[2].range()!);
  const panel = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => { if (panel.current && !panel.current.contains(e.target as Node)) setOpen(false); };
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("mousedown", onDown); document.removeEventListener("keydown", onKey); };
  }, [open]);

  const pick = (p: Preset) => {
    setPreset(p.k);
    const r = p.range();
    if (r) setRange(r);
  };
  const setDay = (k: "from" | "to", v: string) => { setPreset("custom"); setRange((r) => ({ ...r, [k]: v })); };
  const all = preset === "all";
  const invalid = !all && (!range.from || !range.to || range.from > range.to);
  const exportHref = `/api/admin/inquiries/export?${new URLSearchParams({
    ...(filter.source ? { source: filter.source } : {}),
    ...(filter.campaign ? { campaign: filter.campaign } : {}),
    ...(all ? {} : { from: range.from, to: range.to }),
  })}`;
  const label = all ? "전체 기간" : range.from === range.to ? range.from : `${range.from} ~ ${range.to}`;

  return (
    <div className="flex gap-[8px] flex-wrap">
      <select value={filter.source} onChange={(e) => go({ source: e.target.value })} className={SELECT} aria-label="유입 매체">
        <option value="">전체 유입</option>
        <option value="-">UTM 기록 없음</option>
        {options.sources.map((v) => <option key={v} value={v}>{v}</option>)}
      </select>
      <select value={filter.campaign} onChange={(e) => go({ campaign: e.target.value })} className={SELECT} aria-label="캠페인">
        <option value="">전체 캠페인</option>
        {options.campaigns.map((v) => <option key={v} value={v}>{v}</option>)}
      </select>
      {canExport && (
        <div className="relative" ref={panel}>
          <button type="button" onClick={() => setOpen((o) => !o)} aria-expanded={open} className={`${BTN_SECONDARY} px-[16px] py-[10px] text-[12.5px] inline-flex items-center gap-[6px]`} title="메타 광고 관리자 리드 파일과 같은 열 (주관리자만)">
            CSV 다운로드 <span aria-hidden className="text-[10px]">{open ? "▲" : "▼"}</span>
          </button>
          {open && (
            <div className="absolute right-0 top-[calc(100%+6px)] z-20 w-[320px] bg-white border border-[rgba(33,30,25,.15)] shadow-[0_8px_24px_rgba(33,30,25,.12)] p-[16px]">
              <div className="text-[11.5px] tracking-[.08em] text-[rgba(33,30,25,.5)] font-semibold mb-[10px]">내려받을 기간 (신청일, 한국 시간)</div>
              <div className="flex flex-wrap gap-[6px] mb-[12px]">
                {PRESETS.map((p) => (
                  <button key={p.k} type="button" onClick={() => pick(p)} className="border border-[rgba(33,30,25,.2)] px-[10px] py-[6px] text-[12px] cursor-pointer hover:border-brownHover" style={{ background: preset === p.k ? "#fff7e3" : "transparent", fontWeight: preset === p.k ? 600 : 400 }}>{p.l}</button>
                ))}
              </div>
              <div className="flex items-center gap-[6px] mb-[12px]">
                <input type="date" value={all ? "" : range.from} max={all ? undefined : range.to || undefined} onChange={(e) => setDay("from", e.target.value)} className={`${DATE} flex-1 min-w-0`} aria-label="시작일" />
                <span className="text-[12px] text-[rgba(33,30,25,.5)]">~</span>
                <input type="date" value={all ? "" : range.to} min={all ? undefined : range.from || undefined} onChange={(e) => setDay("to", e.target.value)} className={`${DATE} flex-1 min-w-0`} aria-label="종료일" />
              </div>
              <div className="flex items-center justify-between gap-[10px]">
                <span className="text-[12px] text-[rgba(33,30,25,.6)]">{invalid ? "시작일이 종료일보다 늦습니다" : label}{filter.source || filter.campaign ? " · 현재 유입 필터 적용" : ""}</span>
                {invalid ? (
                  <span className={`${BTN_PRIMARY} px-[14px] py-[9px] text-[12.5px] opacity-60 cursor-not-allowed`}>내려받기</span>
                ) : (
                  <a href={exportHref} onClick={() => setOpen(false)} className={`${BTN_PRIMARY} px-[14px] py-[9px] text-[12.5px] inline-flex items-center hover:text-cream`}>내려받기</a>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
