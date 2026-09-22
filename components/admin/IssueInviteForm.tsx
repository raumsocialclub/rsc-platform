"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { BTN_PRIMARY, FIELD } from "./ui";
import { IssuedCodeBox } from "./IssuedCodeBox";

/** 상담과 무관하게 초대코드를 바로 발급 (쿠폰·초대권 화면) */
export function IssueInviteForm() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [issued, setIssued] = useState<{ code: string; expiresAt: string | null; notify?: { sent: boolean; reason?: string } } | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setErr(null);
    try {
      const res = await fetch("/api/admin/invites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name || undefined, phone: phone || undefined, email: email || undefined }),
      });
      const j = (await res.json().catch(() => null)) as { ok?: boolean; message?: string; code?: string; expiresAt?: string | null; notify?: { sent: boolean; reason?: string } } | null;
      if (!j?.ok || !j.code) throw new Error(j?.message ?? "발급하지 못했습니다.");
      setIssued({ code: j.code, expiresAt: j.expiresAt ?? null, notify: j.notify });
      router.refresh();
    } catch (e2) {
      setErr(e2 instanceof Error ? e2.message : "발급하지 못했습니다.");
    } finally {
      setBusy(false);
    }
  };

  if (!open) {
    return <button type="button" onClick={() => setOpen(true)} className={BTN_PRIMARY}>+ 초대코드 발급</button>;
  }

  return (
    <form onSubmit={submit} className="bg-white border border-[rgba(33,30,25,.1)] p-[20px] w-full max-w-[560px]">
      <div className="text-[12px] tracking-[.2em] text-[rgba(33,30,25,.5)] mb-[14px]">새 초대코드</div>
      <div className="grid gap-[10px] md:grid-cols-3 mb-[12px]">
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="발급 대상 이름 (선택)" className={FIELD} />
        <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="연락처 (선택)" className={FIELD} />
        <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="이메일 (선택, 발송용)" type="email" className={FIELD} />
      </div>
      {err && <div className="text-[12.5px] text-error mb-[10px]">{err}</div>}
      {issued && <div className="mb-[12px]"><IssuedCodeBox code={issued.code} expiresAt={issued.expiresAt} notify={issued.notify} /></div>}
      <div className="flex gap-[8px]">
        <button type="submit" disabled={busy} className={BTN_PRIMARY}>{busy ? "발급 중…" : "발급"}</button>
        <button type="button" onClick={() => { setOpen(false); setIssued(null); }} className="border border-[rgba(33,30,25,.2)] bg-transparent px-[16px] py-[11px] text-[13px] cursor-pointer">닫기</button>
      </div>
    </form>
  );
}
