"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
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
      const supabase = createClient();
      const { error: err } = await supabase.auth.signInWithPassword({ email: email.trim().toLowerCase(), password: pw });
      if (err) {
        setError(describeAuthError(err.message, "login"));
        return;
      }
      router.push(next);
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
