"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

/** "N원 결제하기" → POST /api/bookings (pending 예약 생성) → /checkout/[bookingId] */
export function BookButton({ sessionId, label, className, busyLabel = "예약 생성 중…" }: { sessionId: string; label: string; className: string; busyLabel?: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const go = async () => {
    setBusy(true);
    setErr(null);
    try {
      const res = await fetch("/api/bookings", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ sessionId }) });
      const j = (await res.json().catch(() => null)) as { ok?: boolean; bookingId?: string; message?: string } | null;
      if (res.status === 401) {
        router.push(`/login?next=${encodeURIComponent(window.location.pathname)}`);
        return;
      }
      if (!j?.ok || !j.bookingId) throw new Error(j?.message ?? "예약을 만들지 못했습니다.");
      router.push(`/checkout/${j.bookingId}`);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "예약을 만들지 못했습니다.");
      setBusy(false);
    }
  };

  return (
    <>
      <button type="button" onClick={go} disabled={busy} className={`${className} disabled:opacity-70 disabled:cursor-wait`}>{busy ? busyLabel : label}</button>
      {err && <div className="mt-[10px] text-[12.5px] text-error text-center">{err}</div>}
    </>
  );
}
