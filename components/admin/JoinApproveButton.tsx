"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { BTN_PRIMARY, BTN_SECONDARY } from "./ui";

/** 가입 신청 프로필 카드의 「가입 승인」 / 「승인 취소」 버튼 → POST /api/admin/inquiries/:id/approve (2026-11-23) */
export function JoinApproveButton({ id, approved, name }: { id: string; approved: boolean; name: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const run = async (approve: boolean) => {
    if (!approve && !window.confirm(`${name} 님의 가입 승인을 취소할까요? 「승인 대기」로 돌아갑니다.`)) return;
    if (approve && !window.confirm(`${name} 님을 가입 승인할까요? 「가입완료」로 바뀌고 회원 프로필 카드로 관리됩니다.`)) return;
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch(`/api/admin/inquiries/${id}/approve`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ approve }) });
      const j = (await res.json().catch(() => null)) as { ok?: boolean; message?: string } | null;
      if (!j?.ok) throw new Error(j?.message ?? "저장하지 못했습니다.");
      router.refresh();
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "저장하지 못했습니다.");
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="flex items-center gap-[8px] flex-wrap">
      {approved ? (
        <button type="button" onClick={() => run(false)} disabled={busy} className={`${BTN_SECONDARY} px-[16px]`}>{busy ? "처리 중…" : "승인 취소"}</button>
      ) : (
        <button type="button" onClick={() => run(true)} disabled={busy} className={`${BTN_PRIMARY} px-[20px]`} data-testid="join-approve">{busy ? "처리 중…" : "가입 승인"}</button>
      )}
      {msg && <span className="text-[13px] text-[#e52222]">{msg}</span>}
    </div>
  );
}
