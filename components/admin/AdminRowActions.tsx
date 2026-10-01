"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type Props = { id: string; email: string | null; status: "active" | "paused" | "withdrawn"; isSelf: boolean; isOwner: boolean };

/** 관리자 목록 행: 정지/해제 · 권한 해제 (주관리자 전용, M12) */
export function AdminRowActions({ id, email, status, isSelf, isOwner }: Props) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  if (isSelf || isOwner) return <span className="text-[11.5px] text-[rgba(33,30,25,.4)]">{isSelf ? "본인" : "주관리자"}</span>;

  const patch = async (body: Record<string, string>, confirmText: string) => {
    if (!confirm(confirmText)) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/admins/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const j = (await res.json().catch(() => null)) as { ok?: boolean; message?: string } | null;
      if (!j?.ok) throw new Error(j?.message ?? "변경하지 못했습니다.");
      router.refresh();
    } catch (e) {
      alert(e instanceof Error ? e.message : "변경하지 못했습니다.");
    } finally {
      setBusy(false);
    }
  };
  const who = email ?? "이 계정";
  return (
    <div className="flex gap-[10px] flex-wrap">
      {status === "paused" ? (
        <button type="button" disabled={busy} onClick={() => patch({ status: "active" }, `${who} 의 정지를 해제할까요?`)} className="bg-transparent border-0 p-0 text-[12px] text-brown cursor-pointer hover:text-brownHover disabled:opacity-50">정지 해제</button>
      ) : (
        <button type="button" disabled={busy} onClick={() => patch({ status: "paused" }, `${who} 를 정지할까요?\n정지 즉시 관리자 화면에 들어올 수 없습니다.`)} className="bg-transparent border-0 p-0 text-[12px] text-[rgba(33,30,25,.55)] cursor-pointer hover:text-brownHover disabled:opacity-50">정지</button>
      )}
      <button type="button" disabled={busy} onClick={() => patch({ role: "member", status: "active" }, `${who} 의 관리자 권한을 해제할까요?\n일반 회원 계정으로 남습니다.`)} className="bg-transparent border-0 p-0 text-[12px] text-error cursor-pointer hover:opacity-80 disabled:opacity-50">권한 해제</button>
    </div>
  );
}
