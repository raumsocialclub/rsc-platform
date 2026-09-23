"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { SUBMIT, OVERLINE, ERROR } from "./ui";
import { describeInviteReason } from "@/lib/auth/errors";

type Props = {
  /** "verify": 가입 전 검증 → /join/register?code= 로 이동. "consume": 로그인한(소셜) 회원이 코드 연결 → /programs */
  mode: "verify" | "consume";
  initialError?: string | null;
};

const INVALID_MSG = "유효하지 않은 코드입니다. 상담 담당자에게 확인해주세요.";

/** deploy/member.html INVITE 화면 재현 */
export function InviteCodeForm({ mode, initialError = null }: Props) {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(initialError);
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const c = code.trim().toUpperCase();
    if (!c) return;
    setBusy(true);
    setError(null);
    try {
      if (mode === "verify") {
        const res = await fetch("/api/invites/verify", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ code: c }) });
        const json = (await res.json().catch(() => null)) as { valid?: boolean; reason?: string } | null;
        if (json?.valid) {
          router.push(`/join/register?code=${encodeURIComponent(c)}`);
          return;
        }
        setError(describeInviteReason(json?.reason));
      } else {
        const res = await fetch("/api/invites/consume", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ code: c }) });
        const json = (await res.json().catch(() => null)) as { ok?: boolean; message?: string } | null;
        if (json?.ok) {
          router.push("/programs");
          router.refresh();
          return;
        }
        setError(json?.message ?? INVALID_MSG);
      }
    } catch {
      setError("확인 중 오류가 났습니다. 잠시 후 다시 시도해 주세요.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="max-w-[520px] mx-auto my-[40px] text-center">
      <div className={`${OVERLINE} mb-[28px]`}>MEMBERS ONLY</div>
      <h1 className="font-medium text-[28px] md:text-[clamp(28px,3.4vw,42px)] leading-[1.36] mb-[18px]">초대코드를 입력해주세요</h1>
      <p className="mb-[40px] text-[15px] leading-[1.75] text-[rgba(33,30,25,.65)]">
        {mode === "consume" ? (
          <>가입을 마치려면 상담 시 안내받은 초대코드가 필요합니다.<br />코드를 입력하면 바로 프로그램을 예약할 수 있습니다.</>
        ) : (
          <>RSC는 상담 후 초대된 분들만 가입할 수 있습니다.<br />상담 시 안내받은 코드를 입력해주세요.</>
        )}
      </p>
      <input
        value={code}
        onChange={(e) => { setCode(e.target.value.toUpperCase()); setError(null); }}
        placeholder="RSC-XXXX-XXXX"
        autoCapitalize="characters"
        autoComplete="off"
        spellCheck={false}
        maxLength={14}
        className="w-full px-[20px] py-[18px] text-[18px] tracking-[.18em] text-center uppercase border border-[rgba(33,30,25,.24)] bg-white outline-none rounded-none focus:border-brown mb-[12px]"
      />
      {error && <div className={`${ERROR} mb-[12px]`}>{error}</div>}
      <button type="submit" disabled={busy || !code.trim()} className={SUBMIT}>{busy ? "확인 중…" : "코드 확인"}</button>
      {mode === "verify" ? (
        <>
          <div className="mt-[28px] text-[13px] text-[rgba(33,30,25,.5)]">
            아직 상담을 받지 않으셨나요? <Link href="/fit-check" className="text-brown font-semibold underline">RSC 상담 신청</Link>
          </div>
          <div className="mt-[14px] text-[13px] text-[rgba(33,30,25,.5)]">
            이미 회원이신가요? <Link href="/login" className="text-brown font-semibold underline">로그인</Link>
          </div>
        </>
      ) : (
        <div className="mt-[28px] text-[13px] text-[rgba(33,30,25,.5)]">
          아직 상담을 받지 않으셨나요? <Link href="/fit-check" className="text-brown font-semibold underline">RSC 상담 신청</Link>
        </div>
      )}
      <input type="hidden" name="mode" value={mode} />
    </form>
  );
}
