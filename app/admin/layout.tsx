import { redirect } from "next/navigation";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { getCurrentMember, initialOf } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

/**
 * 어드민 셸. proxy.ts 가 비로그인은 /login 으로 보내고, 여기서 members.role = 'admin' 을 검사한다. (FLOWS.md 6)
 * design/RSC Admin.dc.html: 240px 다크 사이드바 + 본문. 900px 이하는 사이드바가 상단 가로 바.
 */
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const me = await getCurrentMember();
  if (!me) redirect("/login?next=/admin");
  if (me.role !== "admin") redirect("/");

  const supabase = await createClient();
  const { count: pendingInquiries } = await supabase.from("inquiries").select("id", { count: "exact", head: true }).eq("status", "pending");

  const items = [
    { href: "/admin", label: "대시보드" },
    { href: "/admin/members", label: "회원 DB" },
    { href: "/admin/programs", label: "프로그램" },
    { href: "/admin/orders", label: "예약 · 결제" },
    { href: "/admin/inquiries", label: "상담 신청", badge: pendingInquiries ?? 0 },
    { href: "/admin/coupons", label: "쿠폰 · 초대권" },
  ];

  return (
    <div className="min-h-screen bg-cream grid grid-cols-1 min-[901px]:grid-cols-[240px_minmax(0,1fr)]">
      <AdminSidebar items={items} user={{ name: me.name, email: me.email ?? "", initial: initialOf(me) }} />
      <main className="min-w-0 px-[18px] py-[24px] min-[901px]:px-[44px] min-[901px]:pt-[40px] min-[901px]:pb-[100px]">{children}</main>
    </div>
  );
}
