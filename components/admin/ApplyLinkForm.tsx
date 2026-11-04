"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { CopyButton } from "./CopyButton";
import { BTN_PRIMARY, BTN_SECONDARY, FIELD } from "./ui";

export type IssuedLink = { id: string; token: string; url: string; expiresAt: string };

/** 만든 설문 링크 표시 + 복사 */
export function IssuedLinkBox({ link, title = "설문 링크를 만들었습니다" }: { link: { url: string; expiresAt: string | null }; title?: string }) {
  return (
    <div className="bg-cream border border-[rgba(33,30,25,.14)] p-[16px]">
      <div className="text-[11px] tracking-[.2em] text-brownHover mb-[8px]">{title}</div>
      <div className="flex items-center justify-between gap-[10px]">
        <span className="text-[13px] break-all">{link.url}</span>
        <CopyButton text={link.url} label="링크 복사" />
      </div>
      <div className="text-[12px] text-[rgba(33,30,25,.55)] mt-[8px]">이 주소를 문자·카카오톡으로 전달하세요. 받은 분은 로그인 없이 바로 작성하고, 링크는 다른 분에게 다시 전달해도 됩니다. 유효기간 {link.expiresAt ? link.expiresAt.slice(0, 10) : "발급 후 90일"} 까지.</div>
    </div>
  );
}

/** 공용 설문 링크 만들기. 이름은 용도(예: 11월 전화상담 완료자), 유효기간은 기본 90일 */
export function ApplyLinkForm() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [memo, setMemo] = useState("");
  const [days, setDays] = useState("90");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [issued, setIssued] = useState<IssuedLink | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true); setErr(null);
    try {
      const res = await fetch("/api/admin/apply-links", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name, memo, days: Math.max(1, Math.min(365, Number(days) || 90)) }) });
      const j = (await res.json().catch(() => null)) as { ok?: boolean; message?: string; link?: IssuedLink } | null;
      if (!j?.ok || !j.link) throw new Error(j?.message ?? "링크를 만들지 못했습니다.");
      setIssued(j.link);
      setName(""); setMemo("");
      router.refresh();
    } catch (e2) {
      setErr(e2 instanceof Error ? e2.message : "링크를 만들지 못했습니다.");
    } finally { setBusy(false); }
  };

  if (!open) return <button type="button" onClick={() => setOpen(true)} className={BTN_PRIMARY}>+ 설문 링크 만들기</button>;
  return (
    <form onSubmit={submit} className="bg-white border border-[rgba(33,30,25,.1)] p-[20px] w-full max-w-[640px]">
      <div className="text-[12px] tracking-[.2em] text-[rgba(33,30,25,.5)] mb-[14px]">새 설문 링크</div>
      <div className="grid gap-[10px] md:grid-cols-[2fr_2fr_1fr] mb-[12px]">
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="링크 이름 (예: 11월 전화상담 완료자)" required className={FIELD} />
        <input value={memo} onChange={(e) => setMemo(e.target.value)} placeholder="메모 (선택)" className={FIELD} />
        <input value={days} onChange={(e) => setDays(e.target.value)} inputMode="numeric" aria-label="유효기간(일)" placeholder="유효기간(일)" className={FIELD} />
      </div>
      {err && <div className="text-[12.5px] text-error mb-[10px]">{err}</div>}
      {issued && <div className="mb-[12px]"><IssuedLinkBox link={issued} /></div>}
      <div className="flex gap-[8px]">
        <button type="submit" disabled={busy} className={BTN_PRIMARY}>{busy ? "만드는 중…" : "링크 만들기"}</button>
        <button type="button" onClick={() => { setOpen(false); setIssued(null); }} className={BTN_SECONDARY}>닫기</button>
      </div>
    </form>
  );
}

/** 목록 행의 「취소」 — 이후로는 그 링크로 설문을 열 수 없다. 이미 받은 응답은 남는다 */
export function RevokeLinkButton({ id }: { id: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const revoke = async () => {
    if (!window.confirm("이 설문 링크를 취소할까요? 이후로는 이 링크로 설문을 열 수 없습니다. (이미 받은 응답은 남습니다)")) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/apply-links/${id}`, { method: "DELETE" });
      const j = (await res.json().catch(() => null)) as { ok?: boolean; message?: string } | null;
      if (!j?.ok) throw new Error(j?.message ?? "취소하지 못했습니다.");
      router.refresh();
    } catch (e) {
      window.alert(e instanceof Error ? e.message : "취소하지 못했습니다.");
    } finally { setBusy(false); }
  };
  return <button type="button" onClick={revoke} disabled={busy} className="border border-[rgba(33,30,25,.2)] bg-transparent px-[10px] py-[5px] text-[12px] cursor-pointer hover:border-error hover:text-error disabled:opacity-60">취소</button>;
}
