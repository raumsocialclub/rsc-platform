"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

/** 소식 목록 행: 상태 배지 + 발행/숨김 토글 */
export function PostRowActions({ id, published, badge }: { id: string; published: boolean; badge: React.ReactNode }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const toggle = async () => {
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/posts/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ published: !published }) });
      const j = (await res.json().catch(() => null)) as { ok?: boolean; message?: string } | null;
      if (!j?.ok) throw new Error(j?.message ?? "변경하지 못했습니다.");
      router.refresh();
    } catch (e) {
      alert(e instanceof Error ? e.message : "변경하지 못했습니다.");
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="grid gap-[4px] justify-items-start">
      {badge}
      <button type="button" onClick={toggle} disabled={busy} className="bg-transparent border-0 p-0 text-[11px] text-[rgba(33,30,25,.5)] cursor-pointer hover:text-brownHover disabled:opacity-50 whitespace-nowrap">
        {busy ? "변경 중…" : published ? "숨기기" : "발행하기"}
      </button>
    </div>
  );
}
