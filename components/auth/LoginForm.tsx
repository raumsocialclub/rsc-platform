"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { SocialProviderId } from "@/lib/auth/providers";
import { describeAuthError } from "@/lib/auth/errors";
import { SocialButtons } from "./SocialButtons";
import { INPUT, SUBMIT, OVERLINE, ERROR, DIVIDER } from "./ui";

type Props = { enabled: SocialProviderId[]; next: string; initialError?: string | null; canEmailReset?: boolean };

/** deploy/member.html LOGIN 화면 재현. "비밀번호 찾기"(M16): 관리자 계정은 메일 발송이 켜져 있으면 재설정 링크를 메일로, 아니면 주관리자에게 요청 안내 */
export function LoginForm({ enabled, next, initialError = null, canEmailReset = false }: Props) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [error, setError] = useState<string | null>(initialError);
  const [busy, setBusy] = useState(false);
  const [help, setHelp] = useState(false);
  const [resetMsg, setResetMsg] = useState<string | null>(null);
  const [resetBusy, setResetBusy] = useState(false);

  const requestReset = async () => {
    const target = email.trim().toLowerCase();
    if (!target) return setResetMsg("위 이메일 칸에 관리자 이메일을 입력한 뒤 눌러 주세요.");
    setResetBusy(true);
    try {
      const res = await fetch("/api/auth/reset-request", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: target }) });
      const j = (await res.json().catch(() => null)) as { ok?: boolean; message?: string } | null;
      setResetMsg(j?.message ?? "요청을 처리하지 못했습니다. 잠시 후 다시 시도해 주세요.");
    } catch {
      setResetMsg("네트워크 오류입니다. 잠시 후 다시 시도해 주세요.");
    } finally {
      setResetBusy(false);
    }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!email.trim() || !pw) return setError("이메일과 비밀번호를 입력해 주세요.");
    setBusy(true);
    try {
      // 서버 라우트를 거쳐 로그인(연속 실패 잠금 적용). 세션 쿠키는 서버가 심는다.
      const res = await fetch("/api/auth/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: email.trim().toLowerCase(), password: pw }) });
      const j = (await res.json().catch(() => null)) as { ok?: boolean; message?: string; role?: string } | null;
      if (!j?.ok) {
        setError(j?.message ?? "로그인하지 못했습니다. 잠시 후 다시 시도해 주세요.");
        return;
      }
      // 관리자는 기본 목적지가 어드민 (M12)
      router.push((j.role === "admin" || j.role === "owner") && next === "/programs" ? "/admin" : next);
      router.refresh();
    } catch (e) {
      setError(describeAuthError(e instanceof Error ? e.message : String(e), "login"));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="max-w-[440px] mx-auto my-[40px]">
      <div className={`${OVERLINE} mb-[24px]`}>WELCOME BACK</div>
      <h1 className="font-medium text-[28px] md:text-[clamp(28px,3.4vw,40px)] leading-[1.36] mb-[36px]">로그인</h1>

      <SocialButtons mode="login" enabled={enabled} next={next} />
      <div className={DIVIDER}>또는</div>

      <form onSubmit={submit} noValidate>
        <div className="grid gap-[12px] mb-[24px]">
          <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="이메일" type="email" autoComplete="email" className={INPUT} />
          <input value={pw} onChange={(e) => setPw(e.target.value)} placeholder="비밀번호" type="password" autoComplete="current-password" className={INPUT} />
        </div>
        {error && <div className={`${ERROR} mb-[14px]`}>{error}</div>}
        <button type="submit" disabled={busy} className={SUBMIT}>{busy ? "로그인 중…" : "로그인"}</button>
      </form>
      <div className="flex justify-between mt-[22px] text-[13px] text-[rgba(33,30,25,.5)]">
        <Link href="/join" className="text-brown font-semibold">초대코드로 가입</Link>
        <button type="button" onClick={() => setHelp((v) => !v)} className="bg-transparent border-0 p-0 cursor-pointer text-[13px] text-[rgba(33,30,25,.5)] hover:text-brown" aria-expanded={help}>비밀번호 찾기</button>
      </div>
      {help && (
        <div className="mt-[14px] border border-[rgba(33,30,25,.14)] bg-[#faf7f1] p-[14px] text-[13px] leading-[1.7] text-[rgba(33,30,25,.7)]">
          <p className="mb-[8px]"><b>관리자 계정</b>은 주관리자(대표)에게 <b>비밀번호 재설정 링크</b>를 요청해 주세요. 링크를 열어 새 비밀번호를 정하면 바로 로그인됩니다.</p>
          {canEmailReset ? (
            <div className="grid gap-[8px]">
              <p>또는 위 이메일 칸에 관리자 이메일을 넣고 아래 버튼을 누르면 재설정 링크를 메일로 보내 드립니다.</p>
              <button type="button" onClick={requestReset} disabled={resetBusy} className="justify-self-start border border-brown text-brown bg-transparent px-[14px] py-[8px] text-[12.5px] font-semibold cursor-pointer hover:border-brownHover hover:text-brownHover disabled:opacity-60">{resetBusy ? "보내는 중…" : "재설정 링크 메일 받기"}</button>
              {resetMsg && <p className="text-[12.5px]">{resetMsg}</p>}
            </div>
          ) : (
            <p className="text-[12.5px] text-[rgba(33,30,25,.55)]">소셜 로그인(카카오·네이버) 회원은 비밀번호가 없으니 해당 버튼으로 로그인하세요.</p>
          )}
        </div>
      )}
    </div>
  );
}
