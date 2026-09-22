import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AuthShell } from "@/components/auth/AuthShell";
import { InviteCodeForm } from "@/components/auth/InviteCodeForm";
import { getCurrentMember } from "@/lib/auth/session";

export const metadata: Metadata = { title: "초대코드 입력 · RSC" };

/**
 * /join — 초대코드 입력. (FLOWS.md 1-3)
 * 로그인 상태인데 초대코드가 아직 연결되지 않은 회원(소셜 가입)은 여기서 코드를 연결한다.
 * 이미 가입을 마친 회원은 /programs 로 보낸다.
 */
export default async function JoinPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  const me = await getCurrentMember();
  if (me?.inviteCodeId) redirect("/programs");

  return (
    <AuthShell>
      <InviteCodeForm
        mode={me ? "consume" : "verify"}
        initialError={error === "invalid" ? "유효하지 않은 코드입니다. 상담 담당자에게 확인해주세요." : null}
      />
    </AuthShell>
  );
}
