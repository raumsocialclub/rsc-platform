"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { JOIN_FILTERS, type JoinFilter as JoinFilterValue } from "@/lib/inquiries/join";
import { BTN_SECONDARY, FIELD } from "./ui";

/** 가입 신청 목록 필터: 승인 상태 탭 + 이름·연락처·초대코드 검색 */
export function JoinFilter({ state, q }: { state: JoinFilterValue; q: string }) {
  const router = useRouter();
  const [text, setText] = useState(q);
  const go = (next: { state?: JoinFilterValue; q?: string }) => {
    const p = new URLSearchParams();
    const s = next.state ?? state, query = (next.q ?? q).trim();
    if (s) p.set("state", s);
    if (query) p.set("q", query);
    router.push(`/admin/join${p.toString() ? `?${p}` : ""}`);
  };
  return (
    <div className="flex gap-[8px] flex-wrap items-center">
      <div className="flex gap-[4px]">
        {JOIN_FILTERS.map((f) => (
          <button key={f.value} type="button" onClick={() => go({ state: f.value })} className={`inline-flex items-center h-[36px] px-[14px] rounded-ds-sm border text-[13px] font-semibold cursor-pointer transition-colors ${state === f.value ? "bg-primary border-primary text-white" : "bg-white border-lineNeutral text-labelNeutral hover:border-primary"}`}>{f.label}</button>
        ))}
      </div>
      <form onSubmit={(e) => { e.preventDefault(); go({ q: text }); }} className="flex gap-[6px]">
        <input value={text} onChange={(e) => setText(e.target.value)} placeholder="이름 · 연락처 · 초대코드" className={`${FIELD} !w-[220px]`} aria-label="검색" />
        <button type="submit" className={`${BTN_SECONDARY} px-[14px]`}>검색</button>
      </form>
    </div>
  );
}
