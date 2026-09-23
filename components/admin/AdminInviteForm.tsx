"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { BTN_PRIMARY, BTN_SECONDARY, CARD, FIELD } from "./ui";

type Result = { link: string; expiresAt: string; mailed: boolean; mailReason: string | null; existingMember: boolean; email: string };

/** 부관리자 초대 폼 (주관리자 전용, M12). 링크는 화면에 표시 + 복사, 이메일 키가 있으면 자동 발송 */
export function AdminInviteForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [result, setResult] = useState<Result | null>(null);
  const [copied, setCopied] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    setResult(null);
    setBusy(true);
    try {
      const res = await fetch("/api/admin/admins/invite", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name, email }) });
      const j = (await res.json().catch(() => null)) as ({ ok: true } & Result) | { ok?: false; message?: string } | null;
      if (!j?.ok) throw new Error((j as { message?: string } | null)?.message ?? "초대를 만들지 못했습니다.");
      setResult({ ...(j as Result), email: email.trim().toLowerCase() });
      setName("");
      setEmail("");
      router.refresh();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "초대를 만들지 못했습니다.");
    } finally {
      setBusy(false);
    }
  };
  const copy = async () => {
    if (!result) return;
    try {
      await navigator.clipboard.writeText(result.link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setErr("복사하지 못했습니다. 링크를 직접 선택해 복사해 주세요.");
    }
  };

  return (
    <div className={`${CARD} p-[22px]`}>
      <div className="text-[12px] tracking-[.2em] text-[rgba(33,30,25,.5)] mb-[12px]">부관리자 초대</div>
      <form onSubmit={submit} className="grid grid-cols-1 md:grid-cols-[1fr_1.4fr_auto] gap-[8px] items-start">
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="이름" className={FIELD} />
        <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="이메일" type="email" required className={FIELD} />
        <button type="submit" disabled={busy} className={BTN_PRIMARY}>{busy ? "만드는 중…" : "초대 링크 만들기"}</button>
      </form>
      <div className="mt-[8px] text-[11.5px] text-[rgba(33,30,25,.5)]">링크는 48시간 동안 한 번만 쓸 수 있습니다. 이미 가입된 회원의 이메일이면 계정을 새로 만들지 않고 부관리자 권한만 부여됩니다.</div>
      {err && <div className="mt-[12px] px-[14px] py-[10px] bg-[rgba(163,64,44,.08)] text-error text-[13px]">{err}</div>}
      {result && (
        <div className="mt-[14px] border border-[rgba(33,30,25,.14)] bg-[#faf7f1] p-[14px] grid gap-[8px]">
          <div className="text-[13px]"><b>{result.email}</b> 초대 링크{result.existingMember ? " (기존 회원 → 권한 부여)" : ""}</div>
          <div className="flex gap-[6px] items-center">
            <input readOnly value={result.link} onFocus={(e) => e.currentTarget.select()} className={`${FIELD} font-mono text-[12px]`} />
            <button type="button" onClick={copy} className={`${BTN_SECONDARY} px-[12px] py-[9px] text-[12px] whitespace-nowrap`}>{copied ? "복사됨" : "복사"}</button>
          </div>
          <div className="text-[12px] text-[rgba(33,30,25,.6)]">
            {result.mailed ? "초대 메일을 보냈습니다." : `메일은 보내지 않았습니다${result.mailReason === "NOT_CONFIGURED" ? " (이메일 발송 키 없음)" : result.mailReason ? ` (${result.mailReason})` : ""}. 위 링크를 복사해 카카오톡 등으로 전달해 주세요.`}
            {" "}유효기간: {new Date(result.expiresAt).toLocaleString("ko-KR", { timeZone: "Asia/Seoul" })} 까지
          </div>
        </div>
      )}
    </div>
  );
}
