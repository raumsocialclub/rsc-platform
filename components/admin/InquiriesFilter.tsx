"use client";

import { useRouter } from "next/navigation";

const SELECT = "px-[14px] py-[10px] text-[13px] border border-[rgba(33,30,25,.2)] bg-white rounded-none outline-none";

/** 상담 신청 목록의 유입 광고(UTM) 필터. 선택지는 실제 신청에 있는 값만. */
export function InquiriesFilter({ filter, options }: { filter: { source: string; campaign: string }; options: { sources: string[]; campaigns: string[] } }) {
  const router = useRouter();
  const go = (next: Partial<typeof filter>) => {
    const f = { ...filter, ...next };
    const p = new URLSearchParams();
    if (f.source) p.set("source", f.source);
    if (f.campaign) p.set("campaign", f.campaign);
    router.push(`/admin/inquiries${p.toString() ? `?${p}` : ""}`);
  };
  return (
    <div className="flex gap-[8px] flex-wrap">
      <select value={filter.source} onChange={(e) => go({ source: e.target.value })} className={SELECT} aria-label="유입 매체">
        <option value="">전체 유입</option>
        <option value="-">직접 (광고 아님)</option>
        {options.sources.map((v) => <option key={v} value={v}>{v}</option>)}
      </select>
      <select value={filter.campaign} onChange={(e) => go({ campaign: e.target.value })} className={SELECT} aria-label="캠페인">
        <option value="">전체 캠페인</option>
        {options.campaigns.map((v) => <option key={v} value={v}>{v}</option>)}
      </select>
    </div>
  );
}
