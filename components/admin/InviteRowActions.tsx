"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

/** 초대 목록 행: 취소 (대기 중일 때만) */
export function InviteRowActions({ id }: { id: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const revoke = async () => {
    if (!confirm("이 초대를 취소할까요? 링크는 더 이상 쓸 수 없습니다.")) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/admins/invite/${id}`, { method: "DELETE" });
      const j = (await res.json().catch(() => null)) as { ok?: boolean; message?: string } | null;
      if (!j?.ok) throw new Error(j?.message ?? "취소하지 못했습니다.");
      router.refresh();
    } catch (e) {
      alert(e instanceof Error ? e.message : "취소하지 못했습니다.");
    } finally {
      setBusy(false);
    }
  };
  return <button type="button" onClick={revoke} disabled={busy} className="bg-transparent border-0 p-0 text-[12px] text-error cursor-pointer hover:opacity-80 disabled:opacity-50">초대 취소</button>;
}
