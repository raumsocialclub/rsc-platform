import type { Metadata } from "next";
import Link from "next/link";
import { AcceptInviteForm } from "@/components/admin/AcceptInviteForm";
import { AuthShell } from "@/components/auth/AuthShell";
import { OVERLINE, SUBMIT } from "@/components/auth/ui";
import { hashInviteToken, isTokenShape } from "@/lib/admins/invite";
import { createAdminClient, hasServiceRoleKey } from "@/lib/supabase/admin";

export const metadata: Metadata = { title: "관리자 초대", robots: { index: false, follow: false } };

function Notice({ title, body }: { title: string; body: string }) {
  return (
    <div className="max-w-[440px] mx-auto my-[40px]">
      <div className={`${OVERLINE} mb-[24px]`}>ADMIN INVITE</div>
      <h1 className="font-medium text-[28px] leading-[1.36] mb-[16px]">{title}</h1>
      <p className="text-[14.5px] leading-[1.7] text-[rgba(33,30,25,.7)] mb-[28px]">{body}</p>
      <Link href="/login?next=/admin" className={`${SUBMIT} inline-block text-center`}>로그인 화면으로</Link>
    </div>
  );
}

/** 초대 링크 화면 (M12). 토큰을 해시로 조회해 유효하면 계정 만들기 폼, 아니면 사유 안내 */
export default async function AdminInvitePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  let content: React.ReactNode;
  if (!isTokenShape(token)) content = <Notice title="초대 링크가 올바르지 않습니다" body="링크가 잘렸거나 잘못 복사되었을 수 있습니다. 초대 메일의 링크를 다시 확인해 주세요." />;
  else if (!hasServiceRoleKey()) content = <Notice title="초대를 처리할 수 없습니다" body="서버 설정(SUPABASE_SERVICE_ROLE_KEY)이 비어 있습니다. 운영자에게 문의해 주세요." />;
  else {
    const admin = createAdminClient();
    const { data: inv } = await admin.from("admin_invites").select("email, name, expires_at, used_at, revoked_at").eq("token_hash", hashInviteToken(token)).maybeSingle();
    if (!inv) content = <Notice title="초대 링크가 올바르지 않습니다" body="존재하지 않는 초대입니다. 주관리자에게 새 링크를 요청해 주세요." />;
    else if (inv.used_at) content = <Notice title="이미 사용된 초대입니다" body="이 링크로 계정이 이미 만들어졌습니다. 로그인해 주세요." />;
    else if (inv.revoked_at) content = <Notice title="취소된 초대입니다" body="주관리자가 이 초대를 취소했습니다. 필요하면 다시 요청해 주세요." />;
    else if (new Date(inv.expires_at) < new Date()) content = <Notice title="초대 링크가 만료되었습니다" body="초대 링크는 48시간 동안만 유효합니다. 주관리자에게 새 링크를 요청해 주세요." />;
    else {
      const { data: existing } = await admin.from("members").select("id").ilike("email", String(inv.email)).maybeSingle();
      content = <AcceptInviteForm token={token} email={String(inv.email)} name={String(inv.name ?? "")} existingMember={!!existing} />;
    }
  }
  return <AuthShell>{content}</AuthShell>;
}
