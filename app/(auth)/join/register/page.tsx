import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AuthShell } from "@/components/auth/AuthShell";
import { RegisterForm } from "@/components/auth/RegisterForm";
import { enabledProviders } from "@/lib/auth/providers";
import { getCurrentMember } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "회원가입" };

/** /join/register?code= — 서버에서 코드를 다시 검증한다. 코드 없이/무효 코드로는 진입 불가. */
export default async function RegisterPage({ searchParams }: { searchParams: Promise<{ code?: string }> }) {
  const { code } = await searchParams;
  const normalized = (code ?? "").trim().toUpperCase();
  if (!/^RSC-[A-Z0-9]{4}-[A-Z0-9]{4}$/.test(normalized)) redirect("/join");

  const me = await getCurrentMember();
  if (me?.inviteCodeId) redirect("/programs");
  if (me && (me.role === "admin" || me.role === "owner")) redirect("/admin");
  if (me) redirect("/join"); // 소셜 가입자는 코드 연결 화면으로

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("verify_invite_code", { p_code: normalized });
  if (error || !data?.valid) redirect("/join?error=invalid");

  return (
    <AuthShell>
      <RegisterForm code={normalized} enabled={[...enabledProviders()]} />
    </AuthShell>
  );
}
