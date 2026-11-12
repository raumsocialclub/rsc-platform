import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { getCurrentMember, initialOf, isAdminRole, isOwnerRole, ROLE_KO } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: { default: "RSC ADMIN", template: "%s · RSC ADMIN" }, robots: { index: false, follow: false } };

/**
 * 어드민 셸. proxy.ts 가 비로그인은 /login 으로 보내고, 여기서 members.role ∈ {admin, owner} · 활동 상태를 검사한다. (FLOWS.md 6, M12)
 * Wanted DS: 240px 흰 사이드바 + 연회색(sand) 본문. 900px 이하는 사이드바가 상단 가로 바.
 */
/** 어드민은 사이트 「색상 테마」와 무관하게 기본 팔레트(흰 배경 · 검정 글자 · 파란 포인트)를 유지한다 — 루트 레이아웃이 :root 에 넣는 테마 변수를 이 영역에서 되돌린다 */
const ADMIN_PALETTE = {
  "--c-cream": "#ffffff", "--c-ink": "#171719", "--c-brown": "#0066ff", "--c-brownHover": "#005eeb", "--c-gold": "#3385ff", "--c-goldHover": "#66a3ff", "--c-sand": "#f7f7f8", "--c-sandDeep": "#f4f4f5",
  "--ds-primary": "#0066ff", "--ds-primary-strong": "#005eeb", "--ds-primary-heavy": "#0054d1", "--ds-primary-rgb": "0,102,255", "--ds-inverse-primary": "#3385ff", "--ds-label": "#171719",
} as React.CSSProperties;

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const me = await getCurrentMember();
  if (!me) redirect("/login?next=/admin");
  if (!isAdminRole(me)) redirect("/");
  const owner = isOwnerRole(me);

  const supabase = await createClient();
  const [{ count: pendingInquiries }, { count: newPartners }] = await Promise.all([
    supabase.from("inquiries").select("id", { count: "exact", head: true }).eq("status", "pending"),
    supabase.from("partner_inquiries").select("id", { count: "exact", head: true }).eq("status", "new"),
  ]);

  const items = [
    { href: "/admin", label: "대시보드" },
    { href: "/admin/members", label: "회원 DB" },
    { href: "/admin/programs", label: "프로그램" },
    { href: "/admin/orders", label: "예약 · 결제" },
    { href: "/admin/inquiries", label: "상담 신청", badge: pendingInquiries ?? 0 },
    { href: "/admin/calls", label: "콜 현황" },
    { href: "/admin/partners", label: "제휴문의", badge: newPartners ?? 0 },
    { href: "/admin/marketing", label: "마케팅 수신" },
    { href: "/admin/apply", label: "상담 전 설문" },
    { href: "/admin/coupons", label: "쿠폰 · 초대권" },
    { href: "/admin/stats", label: "통계 · 리포트" },
    { href: "/admin/posts", label: "소식 게시판" },
    { href: "/admin/popups", label: "팝업" },
    { href: "/admin/site", label: "사이트 관리" },
    { href: "/admin/seo", label: owner ? "SEO 설정" : "SEO 설정 (보기)" },
    { href: "/admin/settings", label: owner ? "일반 설정" : "일반 설정 (보기)" },
    ...(owner ? [{ href: "/admin/admins", label: "관리자 관리" }] : []),
  ];

  return (
    <div className="min-h-screen bg-sand grid grid-cols-1 min-[901px]:grid-cols-[240px_minmax(0,1fr)]" style={ADMIN_PALETTE}>
      <AdminSidebar items={items} user={{ name: me.name, email: me.email ?? "", initial: initialOf(me), roleLabel: ROLE_KO[me.role] }} />
      <main className="min-w-0 px-[16px] py-[20px] min-[901px]:px-[40px] min-[901px]:pt-[32px] min-[901px]:pb-[96px] max-w-[1440px]">{children}</main>
    </div>
  );
}
