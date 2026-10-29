"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { INPUT, SUBMIT, OVERLINE, ERROR } from "@/components/auth/ui";

/** 비밀번호 재설정 링크 폼 (M16). 새 비밀번호 2회 입력 → 변경 → 바로 로그인 → /admin */
export function ResetPasswordForm({ token, email }: { token: string; email: string }) {
  const router = useRouter();
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (pw.length < 8) return setError("비밀번호는 8자 이상이어야 합니다.");
    if (pw !== pw2) return setError("비밀번호가 서로 다릅니다.");
    setBusy(true);
    try {
      const res = await fetch("/api/admin-reset", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ token, password: pw }) });
      const j = (await res.json().catch(() => null)) as { ok?: boolean; message?: string; loggedIn?: boolean } | null;
      if (!j?.ok) {
        setError(j?.message ?? "처리하지 못했습니다. 잠시 후 다시 시도해 주세요.");
        return;
      }
      if (j.loggedIn) {
        router.push("/admin");
        router.refresh();
      } else {
        setDone(true);
      }
    } catch {
      setError("네트워크 오류입니다. 잠시 후 다시 시도해 주세요.");
    } finally {
      setBusy(false);
    }
  };

  if (done) {
    return (
      <div className="max-w-[440px] mx-auto my-[40px]">
        <div className={`${OVERLINE} mb-[24px]`}>PASSWORD RESET</div>
        <h1 className="font-medium text-[28px] leading-[1.36] mb-[20px]">비밀번호를 바꿨습니다</h1>
        <p className="text-[14.5px] leading-[1.7] text-[rgba(33,30,25,.7)] mb-[28px]">새 비밀번호로 로그인해 주세요.</p>
        <Link href="/login?next=/admin" className={`${SUBMIT} inline-block text-center`}>로그인하러 가기</Link>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="max-w-[440px] mx-auto my-[40px]">
      <div className={`${OVERLINE} mb-[24px]`}>PASSWORD RESET</div>
      <h1 className="font-medium text-[28px] md:text-[clamp(28px,3.4vw,40px)] leading-[1.36] mb-[12px]">새 비밀번호 정하기</h1>
      <p className="text-[14.5px] leading-[1.7] text-[rgba(33,30,25,.7)] mb-[32px]"><b>{email}</b> 관리자 계정의 비밀번호를 새로 정합니다. 정하면 바로 관리자 화면에 들어갑니다.</p>
      <div className="grid gap-[12px] mb-[20px]">
        <input value={pw} onChange={(e) => setPw(e.target.value)} placeholder="새 비밀번호 (8자 이상)" type="password" autoComplete="new-password" className={INPUT} />
        <input value={pw2} onChange={(e) => setPw2(e.target.value)} placeholder="새 비밀번호 확인" type="password" autoComplete="new-password" className={INPUT} />
      </div>
      {error && <p className={`${ERROR} mb-[16px]`}>{error}</p>}
      <button type="submit" disabled={busy} className={SUBMIT}>{busy ? "처리 중…" : "비밀번호 바꾸고 로그인"}</button>
      <p className="mt-[16px] text-[12px] text-[rgba(33,30,25,.5)] leading-[1.6]">이 링크는 24시간 동안, 한 번만 쓸 수 있습니다.</p>
    </form>
  );
}
