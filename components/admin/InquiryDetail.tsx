"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { BTN_PRIMARY, BTN_SECONDARY, FIELD } from "./ui";
import { IssuedCodeBox } from "./IssuedCodeBox";
import { INQUIRY_STATUS, badgeStyle, fmtDate } from "@/lib/admin/format";
import type { InquiryCrm } from "@/lib/crm/inquiries";
import { STATUS_KO } from "@/lib/crm/types";

export type InquiryRow = {
  id: string;
  name: string | null;
  phone: string | null;
  email: string | null;
  result_type: string | null;
  status: string;
  memo: string | null;
  created_at: string;
  /** 저장 항목은 route·slot 뿐. answers 배열은 설문 원본을 저장하던 이전 신청에만 남아 있다. */
  answers: {
    profile?: string;
    route?: string;
    slot?: string;
    consentAt?: string;
    consentVersion?: string;
    answers?: { key: string; label: string; question: string; answer: string }[];
  } | null;
  /** 광고 유입(UTM). 광고 링크 없이 들어온 신청은 null */
  utm?: { utm_source?: string; utm_medium?: string; utm_campaign?: string; utm_content?: string; utm_term?: string } | null;
  /** 이미 발급된 코드 (있으면) */
  invite?: { code: string; expires_at: string | null; used_at: string | null } | null;
  /** CRM 시트 연동이 마지막으로 본 콜 결과·시도 횟수·적은 상태 (lib/crm/inquiries.ts) */
  crm_status?: string | null;
  crm_attempts?: number | null;
  crm_applied?: string | null;
};

type Props = { inquiry: InquiryRow; profileKo?: string; profileBody?: string; crm?: InquiryCrm | null };

/** design/RSC Admin.dc.html "신청 상세" 패널 재현 + 메모/상태 저장 + 초대코드 발급 */
export function InquiryDetail({ inquiry, profileKo, profileBody, crm = null }: Props) {
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
    ...(a.slot ? [{ q: "상담 가능 시간", a: a.slot }] : []),
    ...(a.consentAt ? [{ q: "개인정보 동의", a: `${fmtDate(a.consentAt, true)}${a.consentVersion ? ` · 동의문 ${a.consentVersion}` : ""}` }] : []),
    ...(inquiry.utm?.utm_source ? [{ q: "유입 광고", a: [inquiry.utm.utm_source, inquiry.utm.utm_medium].filter(Boolean).join(" / ") }] : []),
    ...(inquiry.utm?.utm_campaign ? [{ q: "캠페인", a: inquiry.utm.utm_campaign }] : []),
    ...(inquiry.utm?.utm_content ? [{ q: "광고 소재", a: inquiry.utm.utm_content }] : []),
    ...(inquiry.utm?.utm_term ? [{ q: "검색어", a: inquiry.utm.utm_term }] : []),
  ];

  return (
    <div className="bg-white border border-[rgba(33,30,25,.1)] p-[26px]">
      <div className="text-[12px] tracking-[.2em] text-[rgba(33,30,25,.5)] mb-[16px]">신청 상세</div>
      <div className="text-[20px] font-semibold mb-[4px]">{inquiry.name || "이름 없음"}</div>
      <div className="text-[13px] text-[rgba(33,30,25,.55)] mb-[20px]">{inquiry.phone || "—"} · {fmtDate(inquiry.created_at, true)}</div>

      {inquiry.result_type && (
        <div className="bg-cream p-[16px] mb-[20px]">
          <div className="text-[11px] tracking-[.2em] text-brownHover mb-[6px]">성향 결과 (설문형 신청)</div>
          <b className="text-[15px]">{inquiry.result_type}{profileKo ? ` · ${profileKo}` : ""}</b>
          {profileBody && <div className="text-[12.5px] text-[rgba(33,30,25,.6)] mt-[6px] leading-[1.6]">{profileBody}</div>}
        </div>
      )}

      <div className="grid gap-[10px] text-[13px] mb-[24px]">
        {rows.length === 0 && <div className="text-[rgba(33,30,25,.5)]">답변 정보가 없습니다.</div>}
        {rows.map((r, i) => (
          <div key={i} className="flex justify-between gap-[12px] border-b border-[rgba(33,30,25,.08)] pb-[8px]">
            <span className="text-[rgba(33,30,25,.55)] flex-none">{r.q}</span>
            <b className="text-right">{r.a}</b>
          </div>
        ))}
      </div>

      {crm && (
        <div className="bg-cream p-[16px] mb-[20px] text-[13px]">
          <div className="flex items-center justify-between gap-[8px] mb-[8px]">
            <span className="text-[11px] tracking-[.2em] text-brownHover">CRM 시트 콜 기록</span>
            <span className="inline-block px-[8px] py-[2px] text-[11.5px] font-semibold" style={badgeStyle(crm.status === "done" ? "ok" : crm.status === "callback" ? "warn" : crm.status === "invalid" || crm.status === "declined" ? "bad" : "mute")}>{STATUS_KO[crm.status]}</span>
          </div>
          <div className="grid gap-[4px]">
            {(["1차", "2차", "3차"] as const).map((k, i) => (
              <div key={k} className="flex justify-between gap-[12px]"><span className="text-[rgba(33,30,25,.55)]">{k} 콜</span><b className="text-right">{crm.calls[i] || "—"}</b></div>
            ))}
            {crm.memo && <div className="mt-[6px] whitespace-pre-wrap leading-[1.6]"><span className="text-[rgba(33,30,25,.55)]">상담 메모 · </span>{crm.memo}</div>}
            {crm.note && <div className="mt-[4px] whitespace-pre-wrap leading-[1.6] text-[rgba(33,30,25,.75)]"><span className="text-[rgba(33,30,25,.55)]">셀 노트 · </span>{crm.note}</div>}
          </div>
          <div className="mt-[8px] text-[11.5px] text-[rgba(33,30,25,.5)]">시트에 콜이 적히면 상태가 자동으로 바뀝니다. 여기서 직접 바꾸면 그 뒤로는 자동 변경하지 않습니다.</div>
        </div>
      )}
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
