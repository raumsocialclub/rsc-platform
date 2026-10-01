"use client";

import { useRouter } from "next/navigation";
import { BTN_SECONDARY } from "./ui";
import { BOOKING_STATUS_KO } from "@/lib/bookings/types";

const SELECT = "px-[14px] py-[10px] text-[13px] border border-[rgba(33,30,25,.2)] bg-white rounded-none outline-none";

export function OrdersFilter({ programs, filter }: { programs: { id: string; name: string }[]; filter: { program: string; status: string } }) {
  const router = useRouter();
  const go = (next: Partial<typeof filter>) => {
    const f = { ...filter, ...next };
    const p = new URLSearchParams();
    if (f.program) p.set("program", f.program);
    if (f.status) p.set("status", f.status);
    router.push(`/admin/orders${p.toString() ? `?${p}` : ""}`);
  };
  const exportHref = `/api/admin/orders/export?${new URLSearchParams({ ...(filter.program ? { program: filter.program } : {}), ...(filter.status ? { status: filter.status } : {}) })}`;
  return (
    <div className="flex gap-[8px] flex-wrap">
      <select value={filter.program} onChange={(e) => go({ program: e.target.value })} className={SELECT}>
        <option value="">전체 프로그램</option>
        {programs.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
      </select>
      <select value={filter.status} onChange={(e) => go({ status: e.target.value })} className={SELECT}>
        <option value="">전체 상태</option>
        {Object.entries(BOOKING_STATUS_KO).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
      </select>
      <a href={exportHref} className={`${BTN_SECONDARY} px-[16px] py-[10px] text-[12.5px] inline-flex items-center`}>엑셀 다운로드</a>
    </div>
  );
}
