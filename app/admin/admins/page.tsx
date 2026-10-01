import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AdminInviteForm } from "@/components/admin/AdminInviteForm";
import { AdminRowActions } from "@/components/admin/AdminRowActions";
import { InviteRowActions } from "@/components/admin/InviteRowActions";
import { Badge, CARD, EmptyRow, PageTitle, TD, TH } from "@/components/admin/ui";
import { badgeStyle } from "@/lib/admin/format";
import { listAdmins, listInvites } from "@/lib/admins/queries";
import { INVITE_STATE_KO, inviteState } from "@/lib/admins/types";
import { getCurrentMember, isOwnerRole, ROLE_KO } from "@/lib/auth/session";
import { fmtFull } from "@/lib/programs/format";

export const metadata: Metadata = { title: "관리자 관리" };

const PERMS: [string, string, string][] = [
  ["상담 · 회원 · 프로그램 · 예약 · 소식 · 사이트 관리", "가능", "가능"],
  ["결제 환불 / 취소", "가능 (사유 필수, 활동 로그 기록)", "가능 (사유 필수, 활동 로그 기록)"],
  ["회원 전화번호 보기", "가능", "가능"],
  ["회원 목록 CSV 내려받기", "불가", "가능"],
  ["일반 설정 · SEO 설정 저장", "보기만", "가능"],
  ["관리자 초대 · 정지 · 권한 해제", "불가", "가능"],
];

/** 관리자 관리 (주관리자 전용, M12): 초대 · 관리자 목록 · 초대 이력 · 권한표 */
export default async function AdminAdminsPage() {
  const me = await getCurrentMember();
  if (!isOwnerRole(me)) redirect("/admin");
  const [admins, invites] = await Promise.all([listAdmins(), listInvites()]);

  return (
    <>
      <PageTitle overline="ADMINS" title="관리자 관리" aside={<span className="text-[16px] text-[rgba(33,30,25,.5)]">{admins.length}명</span>} />
      <div className="grid gap-[20px]">
        <AdminInviteForm />

        <div className={CARD}>
          <div className="px-[14px] py-[12px] border-b border-[rgba(33,30,25,.12)] text-[12px] tracking-[.2em] text-[rgba(33,30,25,.5)]">관리자 목록</div>
          <div className="overflow-x-auto">
            <table className="border-collapse w-full">
              <thead><tr>{["이름", "이메일", "역할", "상태", "마지막 로그인", "등록일", ""].map((h) => <th key={h} className={TH}>{h}</th>)}</tr></thead>
              <tbody>
                {admins.map((a) => (
                  <tr key={a.id} className="hover:bg-[#faf7f1]">
                    <td className={TD}><b>{a.name || "이름 없음"}</b></td>
                    <td className={TD}>{a.email ?? "—"}</td>
                    <td className={TD}><Badge style={badgeStyle(a.role === "owner" ? "brand" : "ok")}>{ROLE_KO[a.role]}</Badge></td>
                    <td className={TD}><Badge style={badgeStyle(a.status === "active" ? "ok" : "bad")}>{a.status === "active" ? "활동" : "정지"}</Badge></td>
                    <td className={`${TD} text-[rgba(33,30,25,.6)]`}>{a.last_login_at ? fmtFull(a.last_login_at) : "—"}</td>
                    <td className={`${TD} text-[rgba(33,30,25,.6)]`}>{fmtFull(a.created_at)}</td>
                    <td className={TD}><AdminRowActions id={a.id} email={a.email} status={a.status} isSelf={a.id === me!.id} isOwner={a.role === "owner"} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className={CARD}>
          <div className="px-[14px] py-[12px] border-b border-[rgba(33,30,25,.12)] text-[12px] tracking-[.2em] text-[rgba(33,30,25,.5)]">초대 이력</div>
          <div className="overflow-x-auto">
            <table className="border-collapse w-full">
              <thead><tr>{["이메일", "이름", "상태", "만료", "보낸 날짜", ""].map((h) => <th key={h} className={TH}>{h}</th>)}</tr></thead>
              <tbody>
                {invites.length === 0 && <EmptyRow colSpan={6}>아직 보낸 초대가 없습니다.</EmptyRow>}
                {invites.map((i) => {
                  const st = inviteState(i);
                  return (
                    <tr key={i.id} className="hover:bg-[#faf7f1]">
                      <td className={TD}>{i.email}</td>
                      <td className={TD}>{i.name || "—"}</td>
                      <td className={TD}><Badge style={badgeStyle(st === "pending" ? "warn" : st === "used" ? "ok" : "mute")}>{INVITE_STATE_KO[st]}</Badge></td>
                      <td className={`${TD} text-[rgba(33,30,25,.6)]`}>{fmtFull(i.expires_at)}</td>
                      <td className={`${TD} text-[rgba(33,30,25,.6)]`}>{fmtFull(i.created_at)}</td>
                      <td className={TD}>{st === "pending" && <InviteRowActions id={i.id} />}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        <div className={`${CARD} p-[22px]`}>
          <div className="text-[12px] tracking-[.2em] text-[rgba(33,30,25,.5)] mb-[12px]">권한표</div>
          <div className="overflow-x-auto">
            <table className="border-collapse w-full">
              <thead><tr>{["항목", "부관리자", "주관리자"].map((h) => <th key={h} className={TH}>{h}</th>)}</tr></thead>
              <tbody>{PERMS.map(([k, a, o]) => <tr key={k}><td className={`${TD} whitespace-normal`}>{k}</td><td className={`${TD} whitespace-normal`}>{a}</td><td className={`${TD} whitespace-normal`}>{o}</td></tr>)}</tbody>
            </table>
          </div>
          <div className="mt-[10px] text-[11.5px] text-[rgba(33,30,25,.5)]">주관리자 본인 계정은 강등·정지·삭제할 수 없습니다. 초대 링크 유효기간 48시간, 1회 사용.</div>
        </div>
      </div>
    </>
  );
}
