"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { SocialProviderId } from "@/lib/auth/providers";
import { describeAuthError } from "@/lib/auth/errors";
import { SocialButtons } from "./SocialButtons";
import { INPUT, SUBMIT, OVERLINE, ERROR, DIVIDER } from "./ui";

type Props = { enabled: SocialProviderId[]; next: string; initialError?: string | null };

/** deploy/member.html LOGIN 화면 재현 */
export function LoginForm({ enabled, next, initialError = null }: Props) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [error, setError] = useState<string | null>(initialError);
  const [busy, setBusy] = useState(false);

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
        <span>비밀번호 찾기</span>
      </div>
    </div>
  );
}
