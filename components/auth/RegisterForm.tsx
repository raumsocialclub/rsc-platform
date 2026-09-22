"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { normalizePhone } from "@/lib/phone";
import type { SocialProviderId } from "@/lib/auth/providers";
import { SocialButtons } from "./SocialButtons";
import { INPUT, SUBMIT, OVERLINE, ERROR, DIVIDER } from "./ui";

type Props = { code: string; enabled: SocialProviderId[] };

/** deploy/member.html SIGNUP 화면 재현. 이메일 가입은 Supabase signUp + DB 트리거(초대코드 검증) 로 즉시 활성. */
export function RegisterForm({ code, enabled }: Props) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [terms, setTerms] = useState(false);
  const [adult, setAdult] = useState(false);
  const [news, setNews] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const n = name.trim();
    const p = normalizePhone(phone);
    const em = email.trim().toLowerCase();
    if (!n) return setError("이름을 입력해 주세요.");
    if (!p) return setError("휴대폰 번호는 010-1234-5678 형식으로 입력해 주세요.");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(em)) return setError("이메일 형식을 확인해 주세요.");
    if (pw.length < 8) return setError("비밀번호는 8자 이상이어야 합니다.");
    if (!terms || !adult) return setError("필수 항목에 동의해 주세요.");

    setBusy(true);
    try {
      const supabase = createClient();
      const { data, error: err } = await supabase.auth.signUp({
        email: em,
        password: pw,
        options: { data: { name: n, phone: p, invite_code: code, marketing_opt_in: news } },
      });
      if (err) {
        const msg = err.message.toLowerCase();
        if (msg.includes("already registered") || msg.includes("already been registered")) setError("이미 가입된 이메일입니다. 로그인해 주세요.");
        else if (msg.includes("database error")) setError("초대코드가 유효하지 않거나 이미 사용되었습니다. 상담 담당자에게 확인해주세요.");
        else if (msg.includes("password")) setError("비밀번호는 8자 이상이어야 합니다.");
        else setError("가입을 완료하지 못했습니다. 잠시 후 다시 시도해 주세요.");
        return;
      }
      if (!data.session) {
        // Supabase 의 "Confirm email" 설정이 켜져 있으면 세션이 없다. 운영자가 설정을 꺼야 한다.
        setError("가입은 접수되었지만 이메일 인증 설정이 켜져 있어 바로 로그인되지 않습니다. 운영자에게 문의해 주세요.");
        return;
      }
      router.push("/programs");
      router.refresh();
    } catch {
      setError("가입을 완료하지 못했습니다. 잠시 후 다시 시도해 주세요.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="max-w-[520px] mx-auto my-[20px]">
      <div className={`${OVERLINE} mb-[24px]`}>JOIN RSC</div>
      <h1 className="font-medium text-[28px] md:text-[clamp(28px,3.4vw,40px)] leading-[1.36] mb-[12px]">회원가입</h1>
      <p className="mb-[36px] text-[14.5px] leading-[1.7] text-[rgba(33,30,25,.6)]">
        초대코드 <b className="text-brown">{code}</b> 확인 완료. 가입 즉시 프로그램을 예약할 수 있습니다.
      </p>

      <SocialButtons mode="join" inviteCode={code} enabled={enabled} />
      <div className={DIVIDER}>또는 이메일로</div>

      <form onSubmit={submit} noValidate>
        <div className="grid gap-[12px]">
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="이름" autoComplete="name" className={INPUT} />
          <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="휴대폰 번호" inputMode="tel" autoComplete="tel" className={INPUT} />
          <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="이메일" type="email" autoComplete="email" className={INPUT} />
          <input value={pw} onChange={(e) => setPw(e.target.value)} placeholder="비밀번호 (8자 이상)" type="password" autoComplete="new-password" className={INPUT} />
        </div>
        <div className="grid gap-[10px] mt-[22px] mb-[28px] text-[13px] text-[rgba(33,30,25,.65)]">
          <label className="flex gap-[10px] items-start cursor-pointer">
            <input type="checkbox" checked={terms} onChange={(e) => setTerms(e.target.checked)} className="mt-[2px] accent-brown" />
            <span>[필수] <Link href="/terms" className="underline">이용약관</Link> 및 <Link href="/privacy" className="underline">개인정보 처리방침</Link> 동의</span>
          </label>
          <label className="flex gap-[10px] items-start cursor-pointer">
            <input type="checkbox" checked={adult} onChange={(e) => setAdult(e.target.checked)} className="mt-[2px] accent-brown" />
            <span>[필수] 만 19세 이상, 미혼 확인</span>
          </label>
          <label className="flex gap-[10px] items-start cursor-pointer">
            <input type="checkbox" checked={news} onChange={(e) => setNews(e.target.checked)} className="mt-[2px] accent-brown" />
            <span>[선택] 프로그램 소식 알림 수신</span>
          </label>
        </div>
        {error && <div className={`${ERROR} mb-[14px]`}>{error}</div>}
        <button type="submit" disabled={busy} className={SUBMIT}>{busy ? "가입 중…" : "가입 완료"}</button>
      </form>
    </div>
  );
}
