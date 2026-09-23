"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { BTN_PRIMARY, BTN_SECONDARY, FIELD } from "./ui";
import { IssuedCodeBox } from "./IssuedCodeBox";
import { INQUIRY_STATUS, fmtDate } from "@/lib/admin/format";

export type InquiryRow = {
  id: string;
  name: string | null;
  phone: string | null;
  email: string | null;
  result_type: string | null;
  status: string;
  memo: string | null;
  created_at: string;
  answers: {
    profile?: string;
    route?: string;
    slot?: string;
    answers?: { key: string; label: string; question: string; answer: string }[];
  } | null;
  /** 이미 발급된 코드 (있으면) */
  invite?: { code: string; expires_at: string | null; used_at: string | null } | null;
};

type Props = { inquiry: InquiryRow; profileKo?: string; profileBody?: string };

/** design/RSC Admin.dc.html "신청 상세" 패널 재현 + 메모/상태 저장 + 초대코드 발급 */
export function InquiryDetail({ inquiry, profileKo, profileBody }: Props) {
  const router = useRouter();
  const [memo, setMemo] = useState(inquiry.memo ?? "");
  const [status, setStatus] = useState(inquiry.status);
  const [busy, setBusy] = useState<"save" | "issue" | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [issued, setIssued] = useState<{ code: string; expiresAt: string | null; notify?: { sent: boolean; reason?: string } } | null>(
    inquiry.invite ? { code: inquiry.invite.code, expiresAt: inquiry.invite.expires_at } : null,
  );

  const save = async (next?: string) => {
    setBusy("save");
    setMsg(null);
    try {
      const res = await fetch(`/api/admin/inquiries/${inquiry.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ memo, status: next ?? status }),
      });
      const j = (await res.json().catch(() => null)) as { ok?: boolean; message?: string } | null;
      if (!j?.ok) throw new Error(j?.message ?? "저장하지 못했습니다.");
      if (next) setStatus(next);
      setMsg("저장했습니다.");
      router.refresh();
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "저장하지 못했습니다.");
    } finally {
      setBusy(null);
    }
  };

  const issue = async () => {
    if (issued && !window.confirm("이미 발급된 코드가 있습니다. 새 코드를 추가로 발급할까요?")) return;
    setBusy("issue");
    setMsg(null);
    try {
      // 메모는 함께 저장
      await fetch(`/api/admin/inquiries/${inquiry.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ memo }) });
      const res = await fetch("/api/admin/invites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ inquiryId: inquiry.id, name: inquiry.name ?? undefined, phone: inquiry.phone ?? undefined, email: inquiry.email ?? undefined }),
      });
      const j = (await res.json().catch(() => null)) as { ok?: boolean; message?: string; code?: string; expiresAt?: string | null; notify?: { sent: boolean; reason?: string } } | null;
      if (!j?.ok || !j.code) throw new Error(j?.message ?? "초대코드를 발급하지 못했습니다.");
      setIssued({ code: j.code, expiresAt: j.expiresAt ?? null, notify: j.notify });
      setStatus("invited");
      router.refresh();
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "초대코드를 발급하지 못했습니다.");
    } finally {
      setBusy(null);
    }
  };

  const a = inquiry.answers ?? {};
  const rows: { q: string; a: string }[] = [
    ...(a.answers ?? []).map((x) => ({ q: x.label, a: x.answer })),
    ...(a.route ? [{ q: "라움과의 인연", a: a.route }] : []),
    ...(a.slot ? [{ q: "통화 희망 시간", a: a.slot }] : []),
  ];

  return (
    <div className="bg-white border border-[rgba(33,30,25,.1)] p-[26px]">
      <div className="text-[12px] tracking-[.2em] text-[rgba(33,30,25,.5)] mb-[16px]">신청 상세</div>
      <div className="text-[20px] font-semibold mb-[4px]">{inquiry.name || "이름 없음"}</div>
      <div className="text-[13px] text-[rgba(33,30,25,.55)] mb-[20px]">{inquiry.phone || "—"} · {fmtDate(inquiry.created_at, true)}</div>

      <div className="bg-cream p-[16px] mb-[20px]">
        <div className="text-[11px] tracking-[.2em] text-brownHover mb-[6px]">성향 결과</div>
        <b className="text-[15px]">{inquiry.result_type || "—"}{profileKo ? ` · ${profileKo}` : ""}</b>
        {profileBody && <div className="text-[12.5px] text-[rgba(33,30,25,.6)] mt-[6px] leading-[1.6]">{profileBody}</div>}
      </div>

      <div className="grid gap-[10px] text-[13px] mb-[24px]">
        {rows.length === 0 && <div className="text-[rgba(33,30,25,.5)]">답변 정보가 없습니다.</div>}
        {rows.map((r, i) => (
          <div key={i} className="flex justify-between gap-[12px] border-b border-[rgba(33,30,25,.08)] pb-[8px]">
            <span className="text-[rgba(33,30,25,.55)] flex-none">{r.q}</span>
            <b className="text-right">{r.a}</b>
          </div>
        ))}
      </div>

      {issued && <div className="mb-[16px]"><IssuedCodeBox code={issued.code} expiresAt={issued.expiresAt} notify={issued.notify} /></div>}

      <label className="block text-[11.5px] text-[rgba(33,30,25,.5)] mb-[6px]">상태</label>
      <select value={status} onChange={(e) => setStatus(e.target.value)} className={`${FIELD} mb-[12px]`}>
        {Object.entries(INQUIRY_STATUS).map(([k, v]) => (
          <option key={k} value={k}>{v}</option>
        ))}
      </select>
      <textarea rows={3} value={memo} onChange={(e) => setMemo(e.target.value)} placeholder="상담 메모" className={`${FIELD} resize-y mb-[12px]`} />
      {msg && <div className="text-[12.5px] text-[rgba(33,30,25,.6)] mb-[10px]">{msg}</div>}
      <div className="flex gap-[8px]">
        <button type="button" onClick={issue} disabled={busy !== null} className={`${BTN_PRIMARY} flex-1 py-[12px]`}>{busy === "issue" ? "발급 중…" : "초대코드 발급"}</button>
        <button type="button" onClick={() => save()} disabled={busy !== null} className={`${BTN_SECONDARY} py-[12px]`}>{busy === "save" ? "저장 중…" : "저장"}</button>
        <button type="button" onClick={() => save("closed")} disabled={busy !== null} className={`${BTN_SECONDARY} py-[12px]`}>보류</button>
      </div>
    </div>
  );
}
