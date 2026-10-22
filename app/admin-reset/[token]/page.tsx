import type { Metadata } from "next";
import Link from "next/link";
import { ResetPasswordForm } from "@/components/admin/ResetPasswordForm";
import { AuthShell } from "@/components/auth/AuthShell";
import { OVERLINE, SUBMIT } from "@/components/auth/ui";
import { hashInviteToken, isTokenShape } from "@/lib/admins/invite";
import { describeResetState } from "@/lib/admins/reset";
import { createAdminClient, hasServiceRoleKey } from "@/lib/supabase/admin";

export const metadata: Metadata = { title: "비밀번호 재설정", robots: { index: false, follow: false } };

function Notice({ title, body }: { title: string; body: string }) {
  return (
    <div className="max-w-[440px] mx-auto my-[40px]">
      <div className={`${OVERLINE} mb-[24px]`}>PASSWORD RESET</div>
      <h1 className="font-medium text-[28px] leading-[1.36] mb-[16px]">{title}</h1>
      <p className="text-[14.5px] leading-[1.7] text-[rgba(33,30,25,.7)] mb-[28px]">{body}</p>
      <Link href="/login?next=/admin" className={`${SUBMIT} inline-block text-center`}>로그인 화면으로</Link>
    </div>
  );
}

/** 관리자 비밀번호 재설정 링크 화면 (M16). 토큰을 해시로 조회해 유효하면 새 비밀번호 폼, 아니면 사유 안내 */
export default async function AdminResetPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  let content: React.ReactNode;
  if (!isTokenShape(token)) content = <Notice title="재설정 링크가 올바르지 않습니다" body="링크가 잘렸거나 잘못 복사되었을 수 있습니다. 받은 링크를 다시 확인해 주세요." />;
  else if (!hasServiceRoleKey()) content = <Notice title="처리할 수 없습니다" body="서버 설정(SUPABASE_SERVICE_ROLE_KEY)이 비어 있습니다. 운영자에게 문의해 주세요." />;
  else {
    const admin = createAdminClient();
    const { data: inv } = await admin.from("admin_invites").select("email, kind, expires_at, used_at, revoked_at").eq("token_hash", hashInviteToken(token)).maybeSingle();
    const bad = describeResetState(inv);
    content = bad ? <Notice title={bad.title} body={bad.body} /> : <ResetPasswordForm token={token} email={String(inv!.email)} />;
  }
  return <AuthShell>{content}</AuthShell>;
}
