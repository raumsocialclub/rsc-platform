"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { APPLY_STATUSES, APPLY_STATUS_KO, type ApplyStatus } from "@/lib/posts/apply";
import { BTN_SECONDARY, FIELD } from "./ui";

/** 프로그램 참여 신청자 목록 필터: 참석 상태 탭 + 이름·연락처 검색 (주소 ?post=&status=&q=) */
export function EventsFilter({ postId, status, q }: { postId: string; status: ApplyStatus | null; q: string }) {
  const router = useRouter();
  const [text, setText] = useState(q);
  const go = (next: { status?: ApplyStatus | null; q?: string }) => {
    const p = new URLSearchParams({ post: postId });
    const s = next.status === undefined ? status : next.status;
    const query = (next.q ?? q).trim();
    if (s) p.set("status", s);
    if (query) p.set("q", query);
    router.push(`/admin/events?${p}`);
  };
  const chip = (on: boolean) => `inline-flex items-center h-[36px] px-[14px] rounded-ds-sm border text-[13px] font-semibold cursor-pointer transition-colors ${on ? "bg-primary border-primary text-white" : "bg-white border-lineNeutral text-labelNeutral hover:border-primary"}`;
  return (
    <div className="flex gap-[8px] flex-wrap items-center">
      <div className="flex gap-[4px]">
        <button type="button" onClick={() => go({ status: null })} className={chip(!status)}>전체</button>
        {APPLY_STATUSES.map((s) => <button key={s} type="button" onClick={() => go({ status: s })} className={chip(status === s)}>{APPLY_STATUS_KO[s]}</button>)}
      </div>
      <form onSubmit={(e) => { e.preventDefault(); go({ q: text }); }} className="flex gap-[6px]">
        <input value={text} onChange={(e) => setText(e.target.value)} placeholder="이름 · 연락처" className={`${FIELD} !w-[180px]`} aria-label="검색" />
        <button type="submit" className={`${BTN_SECONDARY} px-[14px]`}>검색</button>
      </form>
    </div>
  );
}
