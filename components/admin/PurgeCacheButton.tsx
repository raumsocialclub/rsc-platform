"use client";

import { useState } from "react";
import { BTN_SECONDARY } from "./ui";

export function PurgeCacheButton() {
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const run = async () => {
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch("/api/admin/cache/purge", { method: "POST" });
      const j = (await res.json().catch(() => null)) as { ok?: boolean; message?: string } | null;
      if (!j?.ok) throw new Error(j?.message ?? "실패");
      setMsg("서버 캐시를 비웠습니다. CDN 캐시는 설정한 시간 안에 갱신됩니다.");
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "실패");
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="flex items-center gap-[10px] flex-wrap">
      <button type="button" onClick={run} disabled={busy} className={`${BTN_SECONDARY} px-[14px] py-[9px] text-[12.5px]`}>{busy ? "비우는 중…" : "캐시 지금 비우기"}</button>
      {msg && <span className="text-[12.5px] text-brown">{msg}</span>}
    </div>
  );
}
