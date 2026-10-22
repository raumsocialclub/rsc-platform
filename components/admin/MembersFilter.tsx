"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { MEMBER_STATUS_KO } from "@/lib/admin/types";

const SELECT = "px-[14px] py-[10px] text-[13px] border border-[rgba(33,30,25,.2)] bg-white rounded-none outline-none";

export function MembersFilter({ filter }: { filter: { q: string; status: string } }) {
  const router = useRouter();
  const [q, setQ] = useState(filter.q);
  const go = (next: { q?: string; status?: string }) => {
    const f = { ...filter, q, ...next };
    const p = new URLSearchParams();
    if (f.q) p.set("q", f.q);
    if (f.status) p.set("status", f.status);
    router.push(`/admin/members${p.toString() ? `?${p}` : ""}`);
  };
  return (
    <form onSubmit={(e) => { e.preventDefault(); go({ q }); }} className="flex gap-[8px] flex-wrap">
      <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="이름 · 연락처 · 이메일 검색" className={`${SELECT} min-w-[240px]`} />
      <select value={filter.status} onChange={(e) => go({ status: e.target.value })} className={SELECT}>
        <option value="">전체 상태</option>
        {Object.entries(MEMBER_STATUS_KO).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
      </select>
      <Link href="/admin/coupons" className="border-0 bg-brown text-cream hover:text-cream px-[18px] py-[10px] text-[13px] font-semibold inline-flex items-center">초대코드 발급</Link>
    </form>
  );
}
