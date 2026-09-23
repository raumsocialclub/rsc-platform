"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { INPUT, SUBMIT, OVERLINE, ERROR } from "@/components/auth/ui";

/** 초대 링크 수락 폼 (M12). 이름·비밀번호 → 관리자 계정 생성 → /admin */
export function AcceptInviteForm({ token, email, name: initialName, existingMember }: { token: string; email: string; name: string; existingMember: boolean }) {
  const router = useRouter();
  const [name, setName] = useState(initialName);
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!name.trim()) return setError("이름을 입력해 주세요.");
    if (pw.length < 8) return setError("비밀번호는 8자 이상이어야 합니다.");
    if (pw !== pw2) return setError("비밀번호가 서로 다릅니다.");
    setBusy(true);
    try {
      const res = await fetch("/api/admin-invite/accept", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ token, name: name.trim(), password: pw }) });
      const j = (await res.json().catch(() => null)) as { ok?: boolean; message?: string; loggedIn?: boolean } | null;
      if (!j?.ok) {
        setError(j?.message ?? "처리하지 못했습니다. 잠시 후 다시 시도해 주세요.");
        return;
      }
      if (j.loggedIn) {
        router.push("/admin");
        router.refresh();
      } else {
        setNotice(j.message ?? "관리자 권한이 부여되었습니다. 로그인해 주세요.");
      }
    } catch {
      setError("네트워크 오류입니다. 잠시 후 다시 시도해 주세요.");
    } finally {
      setBusy(false);
    }
  };

  if (notice) {
    return (
      <div className="max-w-[440px] mx-auto my-[40px]">
        <div className={`${OVERLINE} mb-[24px]`}>ADMIN INVITE</div>
        <h1 className="font-medium text-[28px] leading-[1.36] mb-[20px]">관리자 권한이 부여되었습니다</h1>
        <p className="text-[14.5px] leading-[1.7] text-[rgba(33,30,25,.7)] mb-[28px]">{notice}</p>
        <Link href="/login?next=/admin" className={`${SUBMIT} inline-block text-center`}>로그인하러 가기</Link>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="max-w-[440px] mx-auto my-[40px]">
      <div className={`${OVERLINE} mb-[24px]`}>ADMIN INVITE</div>
      <h1 className="font-medium text-[28px] md:text-[clamp(28px,3.4vw,40px)] leading-[1.36] mb-[12px]">관리자 계정 만들기</h1>
      <p className="text-[14.5px] leading-[1.7] text-[rgba(33,30,25,.7)] mb-[32px]">
        <b>{email}</b> 로 부관리자 초대를 받으셨습니다.{existingMember ? " 이미 가입된 회원이므로 권한만 부여되며, 기존 비밀번호로 로그인합니다." : " 이름과 비밀번호를 정하면 바로 관리자 화면에 들어갈 수 있습니다."}
      </p>
      <div className="grid gap-[12px] mb-[20px]">
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="이름" autoComplete="name" className={INPUT} />
        <input value={pw} onChange={(e) => setPw(e.target.value)} placeholder={existingMember ? "기존 비밀번호" : "비밀번호 (8자 이상)"} type="password" autoComplete={existingMember ? "current-password" : "new-password"} className={INPUT} />
        {!existingMember && <input value={pw2} onChange={(e) => setPw2(e.target.value)} placeholder="비밀번호 확인" type="password" autoComplete="new-password" className={INPUT} />}
      </div>
      {error && <p className={`${ERROR} mb-[16px]`}>{error}</p>}
      <button type="submit" disabled={busy} className={SUBMIT}>{busy ? "처리 중…" : existingMember ? "권한 받고 로그인" : "계정 만들고 시작하기"}</button>
      <p className="mt-[16px] text-[12px] text-[rgba(33,30,25,.5)] leading-[1.6]">이 링크는 48시간 동안, 한 번만 쓸 수 있습니다.</p>
    </form>
  );
}
