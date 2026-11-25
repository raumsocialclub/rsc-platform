"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { APPLY_STATUS_KO, type ApplyStatus } from "@/lib/posts/apply";

/** 참여 신청 한 건의 참석 상태(신청 → 참석 확정 / 취소)·메모 — PATCH /api/admin/events/:id, 저장 뒤 화면 새로고침 */
export function EventStatusButtons({ id, status, memo }: { id: string; status: ApplyStatus; memo: string | null }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const save = async (body: { status?: ApplyStatus; memo?: string }) => {
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/events/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const j = (await res.json().catch(() => null)) as { ok?: boolean; message?: string } | null;
      if (!j?.ok) alert(j?.message ?? "저장하지 못했습니다.");
      router.refresh();
    } finally { setBusy(false); }
  };
  const btn = "h-[26px] px-[8px] rounded-ds-sm border border-lineNeutral bg-white text-[12px] text-labelNeutral hover:border-primary hover:text-primary disabled:opacity-50 cursor-pointer";
  const next: ApplyStatus[] = status === "applied" ? ["confirmed", "cancelled"] : status === "confirmed" ? ["cancelled", "applied"] : ["applied", "confirmed"];
  return (
    <span className="inline-flex gap-[4px]">
      {next.map((s) => <button key={s} type="button" disabled={busy} onClick={() => save({ status: s })} className={btn} title={`${APPLY_STATUS_KO[s]}(으)로 바꾸기`}>{s === "applied" ? "신청으로" : APPLY_STATUS_KO[s]}</button>)}
      <button type="button" disabled={busy} onClick={() => { const m = prompt("메모 (비우면 삭제)", memo ?? ""); if (m !== null) void save({ memo: m }); }} className={btn}>메모</button>
    </span>
  );
}
