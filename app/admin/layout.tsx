import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { getCurrentMember, initialOf, isAdminRole, isOwnerRole, ROLE_KO } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: { default: "RSC ADMIN", template: "%s · RSC ADMIN" }, robots: { index: false, follow: false } };

/**
 * 어드민 셸. proxy.ts 가 비로그인은 /login 으로 보내고, 여기서 members.role ∈ {admin, owner} · 활동 상태를 검사한다. (FLOWS.md 6, M12)
 * design/RSC Admin.dc.html: 240px 다크 사이드바 + 본문. 900px 이하는 사이드바가 상단 가로 바.
 */
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const me = await getCurrentMember();
  if (!me) redirect("/login?next=/admin");
  if (!isAdminRole(me)) redirect("/");
  const owner = isOwnerRole(me);

  const supabase = await createClient();
  const { count: pendingInquiries } = await supabase.from("inquiries").select("id", { count: "exact", head: true }).eq("status", "pending");

  const items = [
    { href: "/admin", label: "대시보드" },
    { href: "/admin/members", label: "회원 DB" },
    { href: "/admin/programs", label: "프로그램" },
    { href: "/admin/orders", label: "예약 · 결제" },
    { href: "/admin/inquiries", label: "상담 신청", badge: pendingInquiries ?? 0 },
    { href: "/admin/coupons", label: "쿠폰 · 초대권" },
    { href: "/admin/stats", label: "통계 · 리포트" },
    { href: "/admin/posts", label: "소식 게시판" },
    { href: "/admin/site", label: "사이트 관리" },
    { href: "/admin/seo", label: owner ? "SEO 설정" : "SEO 설정 (보기)" },
    { href: "/admin/settings", label: owner ? "일반 설정" : "일반 설정 (보기)" },
    ...(owner ? [{ href: "/admin/admins", label: "관리자 관리" }] : []),
  ];

  return (
    <div className="min-h-screen bg-cream grid grid-cols-1 min-[901px]:grid-cols-[240px_minmax(0,1fr)]">
      <AdminSidebar items={items} user={{ name: me.name, email: me.email ?? "", initial: initialOf(me), roleLabel: ROLE_KO[me.role] }} />
      <main className="min-w-0 px-[18px] py-[24px] min-[901px]:px-[44px] min-[901px]:pt-[40px] min-[901px]:pb-[100px]">{children}</main>
    </div>
  );
}
