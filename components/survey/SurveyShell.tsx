import Link from "next/link";
import { Logo } from "@/components/site/Logo";

/** 설문을 열 수 없을 때(/s, 마감·잘못된 주소)의 흰 상단바 + 모래색 바탕 */
export function SurveyShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-sand">
      <header className="h-[56px] md:h-[64px] bg-white border-b border-lineAlt flex items-center justify-between gap-[24px] px-[20px] md:px-[32px]">
        <Logo href="/" emblemClass="h-[26px] md:h-[32px]" textClass="h-[14px] md:h-[16px]" textSrc="/images/logo-text-fitcheck.png" className="gap-[10px]" />
        <Link href="/" className="t-label-1 text-labelAlt hover:text-label">닫기 ✕</Link>
      </header>
      <main className="flex-1 flex flex-col px-[16px] pt-[20px] pb-[64px] md:px-[32px] md:pt-[40px] md:pb-[96px]">{children}</main>
    </div>
  );
}
