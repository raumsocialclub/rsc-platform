"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { BTN_PRIMARY, BTN_SECONDARY, FIELD } from "./ui";
import { fmtDate } from "@/lib/admin/format";
import { PARTNER_KIND_KO, PARTNER_STATUSES, PARTNER_STATUS_KO, type PartnerInquiryRow, type PartnerStatus } from "@/lib/partner/types";

/** 제휴문의 상세 패널: 회사·담당자·연락처·제안 내용 + 상태·메모 저장 (PATCH /api/admin/partners/:id) */
export function PartnerDetail({ row }: { row: PartnerInquiryRow }) {
  const router = useRouter();
  const [memo, setMemo] = useState(row.memo ?? "");
  const [status, setStatus] = useState<PartnerStatus>(row.status);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const save = async (next?: PartnerStatus) => {
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch(`/api/admin/partners/${row.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ memo, status: next ?? status }) });
      const j = (await res.json().catch(() => null)) as { ok?: boolean; message?: string } | null;
      if (!j?.ok) throw new Error(j?.message ?? "저장하지 못했습니다.");
      if (next) setStatus(next);
      setMsg("저장했습니다.");
      router.refresh();
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "저장하지 못했습니다.");
    } finally {
      setBusy(false);
    }
  };

  const info: { q: string; a: React.ReactNode }[] = [
    { q: "문의 유형", a: PARTNER_KIND_KO[row.kind] ?? row.kind },
    { q: "회사 · 브랜드", a: row.company },
    { q: "휴대전화", a: <a href={`tel:${row.phone}`} className="text-primary">{row.phone}</a> },
    { q: "이메일", a: <a href={`mailto:${row.email}`} className="text-primary break-all">{row.email}</a> },
    { q: "개인정보 동의", a: `${fmtDate(row.consent_at, true)}${row.consent_version ? ` · 동의문 ${row.consent_version}` : ""}` },
  ];

  return (
    <div className="bg-white border border-[rgba(112,115,124,.08)] p-[26px]">
      <div className="text-[12px] tracking-[.02em] text-[rgba(55,56,60,.61)] mb-[16px]">제휴문의 상세</div>
      <div className="text-[20px] font-semibold mb-[4px]">{row.company}</div>
      <div className="text-[13px] text-[rgba(55,56,60,.61)] mb-[20px]">{row.name} · {fmtDate(row.created_at, true)}</div>

      <dl className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-[14px] gap-y-[8px] text-[13px] mb-[16px]">
        {info.map((r) => (<div key={r.q} className="contents"><dt className="text-[rgba(55,56,60,.61)] whitespace-nowrap">{r.q}</dt><dd className="text-[rgba(46,47,51,.88)] m-0">{r.a}</dd></div>))}
      </dl>
      <div className="bg-sand p-[14px] mb-[20px] text-[13px] leading-[1.7] whitespace-pre-wrap break-words text-[rgba(46,47,51,.88)]">{row.message}</div>

      <label className="block text-[12px] text-[rgba(55,56,60,.61)] mb-[6px]">상태</label>
      <select value={status} onChange={(e) => setStatus(e.target.value as PartnerStatus)} className={`${FIELD} mb-[12px]`}>
        {PARTNER_STATUSES.map((k) => <option key={k} value={k}>{PARTNER_STATUS_KO[k]}</option>)}
      </select>
      <textarea rows={3} value={memo} onChange={(e) => setMemo(e.target.value)} placeholder="검토 메모" className={`${FIELD} resize-y mb-[12px]`} />
      {msg && <div className="text-[13px] text-[rgba(55,56,60,.61)] mb-[10px]">{msg}</div>}
      <div className="flex gap-[8px]">
        <button type="button" onClick={() => save()} disabled={busy} className={`${BTN_PRIMARY} flex-1 py-[12px]`}>{busy ? "저장 중…" : "저장"}</button>
        {status === "new" && <button type="button" onClick={() => save("reviewing")} disabled={busy} className={`${BTN_SECONDARY} py-[12px]`}>검토 시작</button>}
        <a href={`mailto:${row.email}?subject=${encodeURIComponent(`[라움소셜클럽] ${row.company} 제휴 제안 회신`)}`} className={`${BTN_SECONDARY} py-[12px]`}>메일 회신</a>
      </div>
    </div>
  );
}
