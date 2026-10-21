"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { BTN_SECONDARY, FIELD } from "./ui";

type Props = { id: string; email: string | null; status: "active" | "paused" | "withdrawn"; isSelf: boolean; isOwner: boolean };
type ResetResult = { link: string; expiresAt: string; mailed: boolean; mailReason: string | null };

const LINK = "bg-transparent border-0 p-0 text-[12px] cursor-pointer disabled:opacity-50";

/** 관리자 목록 행: 비밀번호 재설정 링크 · 정지/해제 · 권한 해제 (주관리자 전용, M12·M16) */
export function AdminRowActions({ id, email, status, isSelf, isOwner }: Props) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [reset, setReset] = useState<ResetResult | null>(null);
  const [copied, setCopied] = useState(false);
  const who = email ?? "이 계정";

  const patch = async (body: Record<string, string>, confirmText: string) => {
    if (!confirm(confirmText)) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/admins/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const j = (await res.json().catch(() => null)) as { ok?: boolean; message?: string } | null;
      if (!j?.ok) throw new Error(j?.message ?? "변경하지 못했습니다.");
      router.refresh();
    } catch (e) {
      alert(e instanceof Error ? e.message : "변경하지 못했습니다.");
    } finally {
      setBusy(false);
    }
  };

  const issueReset = async () => {
    if (!confirm(`${who} 의 비밀번호 재설정 링크를 만들까요?\n링크는 24시간 동안 한 번만 쓸 수 있고, 이전에 만든 링크는 취소됩니다.`)) return;
    setBusy(true);
    setReset(null);
    try {
      const res = await fetch(`/api/admin/admins/${id}/reset`, { method: "POST" });
      const j = (await res.json().catch(() => null)) as ({ ok: true } & ResetResult) | { ok?: false; message?: string } | null;
      if (!j?.ok) throw new Error((j as { message?: string } | null)?.message ?? "링크를 만들지 못했습니다.");
      setReset(j as ResetResult);
      router.refresh();
    } catch (e) {
      alert(e instanceof Error ? e.message : "링크를 만들지 못했습니다.");
    } finally {
      setBusy(false);
    }
  };
  const copy = async () => {
    if (!reset) return;
    try {
      await navigator.clipboard.writeText(reset.link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      alert("복사하지 못했습니다. 링크를 직접 선택해 복사해 주세요.");
    }
  };

  const canReset = status === "active" && (!isOwner || isSelf);
  return (
    <div className="grid gap-[8px]">
      <div className="flex gap-[10px] flex-wrap items-center">
        {canReset && <button type="button" disabled={busy} onClick={issueReset} className={`${LINK} text-brown hover:text-brownHover`}>비밀번호 재설정 링크</button>}
        {isSelf || isOwner ? (
          <span className="text-[11.5px] text-[rgba(33,30,25,.4)]">{isSelf ? "본인" : "주관리자"}</span>
        ) : (
          <>
            {status === "paused" ? (
              <button type="button" disabled={busy} onClick={() => patch({ status: "active" }, `${who} 의 정지를 해제할까요?`)} className={`${LINK} text-brown hover:text-brownHover`}>정지 해제</button>
            ) : (
              <button type="button" disabled={busy} onClick={() => patch({ status: "paused" }, `${who} 를 정지할까요?\n정지 즉시 관리자 화면에 들어올 수 없습니다.`)} className={`${LINK} text-[rgba(33,30,25,.55)] hover:text-brownHover`}>정지</button>
            )}
            <button type="button" disabled={busy} onClick={() => patch({ role: "member", status: "active" }, `${who} 의 관리자 권한을 해제할까요?\n일반 회원 계정으로 남습니다.`)} className={`${LINK} text-error hover:opacity-80`}>권한 해제</button>
          </>
        )}
      </div>
      {reset && (
        <div className="border border-[rgba(33,30,25,.14)] bg-[#faf7f1] p-[10px] grid gap-[6px] min-w-[300px]">
          <div className="flex gap-[6px] items-center">
            <input readOnly value={reset.link} onFocus={(e) => e.currentTarget.select()} className={`${FIELD} font-mono text-[11.5px] py-[7px]`} />
            <button type="button" onClick={copy} className={`${BTN_SECONDARY} px-[10px] py-[7px] text-[12px] whitespace-nowrap`}>{copied ? "복사됨" : "복사"}</button>
          </div>
          <div className="text-[11.5px] text-[rgba(33,30,25,.6)] whitespace-normal">
            {reset.mailed ? "재설정 메일을 보냈습니다." : `메일은 보내지 않았습니다${reset.mailReason === "NOT_CONFIGURED" ? " (이메일 발송 키 없음)" : reset.mailReason ? ` (${reset.mailReason})` : ""}. 위 링크를 복사해 본인에게만 전달해 주세요.`}
            {" "}유효기간: {new Date(reset.expiresAt).toLocaleString("ko-KR", { timeZone: "Asia/Seoul" })} 까지
          </div>
        </div>
      )}
    </div>
  );
}
