import type { Metadata } from "next";
import Link from "next/link";
import { Header } from "@/components/site/Header";
import { SiteFooter } from "@/components/site/SiteFooter";

export const metadata: Metadata = { title: "페이지를 찾을 수 없습니다", robots: { index: false, follow: false } };

/** 404. Design.md 빈 상태 규칙: 크림 카드 + 한 줄 설명 + 브라운 버튼 */
export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col pt-[57px] md:pt-[76px]">
      <Header />
      <main className="flex-1 px-[18px] py-[80px] md:px-[40px] md:py-[120px]">
        <div className="max-w-[560px] mx-auto text-center">
          <div className="text-[11px] tracking-[.3em] text-[rgba(33,30,25,.5)] mb-[18px]">404</div>
          <h1 className="font-medium text-[28px] md:text-[36px] leading-[1.3] mb-[14px]">페이지를 찾을 수 없습니다</h1>
          <p className="text-[14.5px] leading-[1.7] text-[rgba(33,30,25,.65)] mb-[28px]">주소가 바뀌었거나 삭제된 페이지입니다.<br />아래 버튼으로 이동해 주세요.</p>
          <div className="flex gap-[10px] justify-center flex-wrap">
            <Link href="/" className="px-[28px] py-[16px] bg-brown text-cream hover:text-cream text-[13.5px] font-semibold">첫 화면으로</Link>
            <Link href="/programs" className="px-[28px] py-[16px] border border-brown text-brown text-[13.5px] font-semibold">프로그램 보기</Link>
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
