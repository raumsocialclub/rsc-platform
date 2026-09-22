import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AuthShell } from "@/components/auth/AuthShell";
import { LoginForm } from "@/components/auth/LoginForm";
import { enabledProviders } from "@/lib/auth/providers";
import { getCurrentMember } from "@/lib/auth/session";

export const metadata: Metadata = { title: "로그인 · RSC" };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string; error?: string }> }) {
  const { next, error } = await searchParams;
  const safeNext = next && next.startsWith("/") && !next.startsWith("//") ? next : "/programs";
  const me = await getCurrentMember();
  if (me) redirect(me.inviteCodeId ? safeNext : "/join");

  return (
    <AuthShell>
      <LoginForm
        enabled={[...enabledProviders()]}
        next={safeNext}
        initialError={error === "oauth" ? "소셜 로그인에 실패했습니다. 다시 시도해 주세요." : null}
      />
    </AuthShell>
  );
}
