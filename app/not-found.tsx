import type { Metadata } from "next";
import { Header } from "@/components/site/Header";
import { SiteFooter } from "@/components/site/SiteFooter";
import { ButtonLink } from "@/components/ui/ds";

export const metadata: Metadata = { title: "페이지를 찾을 수 없습니다", robots: { index: false, follow: false } };

/** 404 (Wanted DS 빈 상태: 제목 + 한 줄 설명 + 버튼) */
export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col pt-[56px] md:pt-[64px]">
      <Header />
      <main className="flex-1 px-[20px] py-[80px] md:py-[120px]">
        <div className="max-w-[480px] mx-auto text-center">
          <div className="t-label-1 font-semibold text-labelAlt mb-[10px]">404</div>
          <h1 className="t-title-2 text-label mb-[12px]">페이지를 찾을 수 없습니다</h1>
          <p className="t-body-1-reading text-labelAlt mb-[24px]">주소가 바뀌었거나 삭제된 페이지입니다.<br />아래 버튼으로 이동해 주세요.</p>
          <div className="flex gap-[10px] justify-center flex-wrap">
            <ButtonLink href="/" size="lg">첫 화면으로</ButtonLink>
            <ButtonLink href="/news" variant="assistive" size="lg">소식 보기</ButtonLink>
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
