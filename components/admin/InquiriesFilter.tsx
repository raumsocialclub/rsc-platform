"use client";

import { useRouter } from "next/navigation";
import { BTN_SECONDARY } from "./ui";

const SELECT = "px-[14px] py-[10px] text-[13px] border border-[rgba(33,30,25,.2)] bg-white rounded-none outline-none";

/** 상담 신청 목록의 유입 광고(UTM) 필터 + 현재 필터 그대로 메타 리드 양식 CSV 내려받기(주관리자만). 선택지는 실제 신청에 있는 값만. */
export function InquiriesFilter({ filter, options, canExport = false }: { filter: { source: string; campaign: string }; options: { sources: string[]; campaigns: string[] }; canExport?: boolean }) {
  const router = useRouter();
  const go = (next: Partial<typeof filter>) => {
    const f = { ...filter, ...next };
    const p = new URLSearchParams();
    if (f.source) p.set("source", f.source);
    if (f.campaign) p.set("campaign", f.campaign);
    router.push(`/admin/inquiries${p.toString() ? `?${p}` : ""}`);
  };
  const exportHref = `/api/admin/inquiries/export?${new URLSearchParams({ ...(filter.source ? { source: filter.source } : {}), ...(filter.campaign ? { campaign: filter.campaign } : {}) })}`;
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
      {canExport && <a href={exportHref} className={`${BTN_SECONDARY} px-[16px] py-[10px] text-[12.5px] inline-flex items-center`} title="메타 광고 관리자 리드 파일과 같은 열 (주관리자만)">CSV 다운로드</a>}
    </div>
  );
}
