import type { Metadata } from "next";
import { getCurrentMember } from "@/lib/auth/session";

export const metadata: Metadata = { title: "프로그램 · RSC" };

/** M3 자리 화면. M5에서 DB 프로그램 목록(카드 그리드·카테고리 필터)으로 교체한다. */
export default async function ProgramsPage() {
  const me = await getCurrentMember();
  return (
    <>
      <div className="flex items-end justify-between gap-[24px] flex-wrap mb-[40px]">
        <div>
          <div className="text-[11px] tracking-[.3em] text-[rgba(33,30,25,.5)] mb-[16px]">UPCOMING PROGRAMS</div>
          <h1 className="font-medium text-[28px] md:text-[clamp(28px,3.4vw,42px)] leading-[1.3]">이번 달 프로그램</h1>
        </div>
      </div>
      <div className="bg-cream border border-[rgba(33,30,25,.14)] px-[28px] py-[56px] text-center">
        <div className="text-[15px] font-medium mb-[8px]">{me?.name ? `${me.name}님, ` : ""}가입이 완료되었습니다.</div>
        <div className="text-[13.5px] leading-[1.7] text-[rgba(33,30,25,.6)]">아직 등록된 프로그램이 없습니다. 프로그램이 열리면 이곳에 표시됩니다.</div>
      </div>
    </>
  );
}
