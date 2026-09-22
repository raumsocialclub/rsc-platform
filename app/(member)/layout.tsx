import { redirect } from "next/navigation";
import { Header } from "@/components/site/Header";
import { SiteFooter } from "@/components/site/SiteFooter";
import { getCurrentMember } from "@/lib/auth/session";

/**
 * 회원 전용 영역(/programs, /my). proxy.ts 가 비로그인은 /login 으로 보내고,
 * 여기서는 초대코드가 연결되지 않은 소셜 가입자를 /join 으로 보낸다. (초대제 원칙)
 */
export default async function MemberLayout({ children }: { children: React.ReactNode }) {
  const me = await getCurrentMember();
  if (!me) redirect("/login");
  if (!me.inviteCodeId) redirect("/join");
  if (me.status === "withdrawn") redirect("/");

  return (
    <div className="min-h-screen flex flex-col pt-[57px] md:pt-[76px]">
      <Header />
      <main className="flex-1 px-[18px] pt-[24px] pb-[96px] md:px-[40px] md:pt-[48px] md:pb-[120px]">
        <div className="w-full max-w-[1100px] mx-auto">{children}</div>
      </main>
      <SiteFooter />
    </div>
  );
}
