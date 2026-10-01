import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AuthShell } from "@/components/auth/AuthShell";
import { LoginForm } from "@/components/auth/LoginForm";
import { enabledProviders } from "@/lib/auth/providers";
import { getCurrentMember, isAdminRole } from "@/lib/auth/session";

export const metadata: Metadata = { title: "로그인" };

const LOGIN_ERRORS: Record<string, string> = {
  oauth: "소셜 로그인에 실패했습니다. 다시 시도해 주세요.",
  naver: "네이버 로그인에 실패했습니다. 다시 시도해 주세요.",
  naver_state: "네이버 로그인 요청이 만료되었습니다. 다시 시도해 주세요.",
  naver_email: "네이버 계정의 이메일 제공에 동의해야 로그인할 수 있습니다.",
  naver_config: "네이버 로그인 설정(NAVER_CLIENT_ID/SECRET)이 비어 있습니다.",
};

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string; error?: string }> }) {
  const { next, error } = await searchParams;
  const safeNext = next && next.startsWith("/") && !next.startsWith("//") ? next : "/programs";
  const me = await getCurrentMember();
  if (me) redirect(isAdminRole(me) ? (next ? safeNext : "/admin") : me.inviteCodeId ? safeNext : "/join");

  return (
    <AuthShell>
      <LoginForm
        enabled={[...enabledProviders()]}
        next={safeNext}
        initialError={LOGIN_ERRORS[error ?? ""] ?? null}
      />
    </AuthShell>
  );
}
