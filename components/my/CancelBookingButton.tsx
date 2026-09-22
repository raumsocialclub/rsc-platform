"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function CancelBookingButton({ bookingId, refundText, disabledReason }: { bookingId: string; refundText: string; disabledReason?: string | null }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const cancel = async () => {
    if (!confirm(`예약을 취소할까요?\n${refundText}`)) return;
    setBusy(true);
    setErr(null);
    try {
      const res = await fetch(`/api/bookings/${bookingId}/cancel`, { method: "POST" });
      const j = (await res.json().catch(() => null)) as { ok?: boolean; message?: string } | null;
      if (!j?.ok) throw new Error(j?.message ?? "취소하지 못했습니다.");
      router.refresh();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "취소하지 못했습니다.");
      setBusy(false);
    }
  };

  if (disabledReason) return <span className="text-[12px] text-[rgba(33,30,25,.45)]">{disabledReason}</span>;
  return (
    <div className="grid gap-[6px] justify-items-end">
      <button type="button" onClick={cancel} disabled={busy} className="border border-[rgba(33,30,25,.25)] bg-transparent px-[14px] py-[8px] text-[12.5px] cursor-pointer hover:border-error hover:text-error disabled:opacity-50">
        {busy ? "취소 중…" : "예약 취소"}
      </button>
      {err && <div className="text-[12px] text-error">{err}</div>}
    </div>
  );
}
