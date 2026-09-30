import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Header } from "@/components/site/Header";
import { SiteFooter } from "@/components/site/SiteFooter";
import { UpButton } from "@/components/site/UpButton";
import { JsonLd } from "@/components/seo/JsonLd";
import { MonthTabs } from "@/components/news/MonthTabs";
import { YearSelect } from "@/components/news/YearSelect";
import { filterMonth, fmtPostDate, monthsOf, parseYM, pickDefaultMonth, todayYM, yearOptions } from "@/lib/posts/calendar";
import { listPublishedPostMonths, listPublishedPostsByIds } from "@/lib/posts/queries";
import { plainText } from "@/lib/posts/types";
import { getPageSeo, pageMetadata } from "@/lib/seo/get";
import { breadcrumbJsonLd } from "@/lib/seo/jsonld";

type Search = Promise<{ y?: string; m?: string }>;

export async function generateMetadata({ searchParams }: { searchParams: Search }): Promise<Metadata> {
  const { y, m } = await searchParams;
  const ym = parseYM(y, m);
  // 달별 화면은 같은 목록의 다른 보기이므로 검색 색인은 /news 만
  return pageMetadata("news", ym ? { path: `/news?y=${ym.y}&m=${ym.m}`, noindex: true } : {});
}

/**
 * 소식 목록 (M11 → M16 월별 달력형). 연도 선택 + 1~12월 탭, 그 달의 행사·소식을 행사 일자 순으로.
 * 대표 사진은 인스타그램 피드 비율(1080×1350) 그대로 — 잘라내지 않고 원본 비율로 표시한다.
 */
export default async function NewsPage({ searchParams }: { searchParams: Search }) {
  const { y, m } = await searchParams;
  const [lite, seo] = await Promise.all([listPublishedPostMonths(), getPageSeo("news")]);
  const months = monthsOf(lite);
  const today = todayYM();
  const ym = parseYM(y, m) ?? pickDefaultMonth(months, today);
  const ids = filterMonth(lite, ym).map((p) => p.id);
  const posts = filterMonth(await listPublishedPostsByIds(ids), ym);
  const years = yearOptions([...months, ym], today);

  return (
    <div className="min-h-screen flex flex-col pt-[57px] md:pt-[76px]">
      <Header />
      <main className="flex-1 px-[18px] pt-[40px] pb-[96px] md:px-[40px] md:pt-[72px] md:pb-[140px]">
        <div className="w-full max-w-[1240px] mx-auto">
          <section className="mb-[36px] md:mb-[48px]">
            <div className="text-[11px] tracking-[.3em] text-brownHover mb-[22px]">NEWS</div>
            <h1 className="font-semibold text-[30px] md:text-[clamp(30px,3.4vw,44px)] leading-[1.28] mb-[16px] text-pretty">{seo.title || "소식"}</h1>
            <p className="text-[15px] md:text-[16px] leading-[1.7] text-[rgba(33,30,25,.68)] max-w-[560px] text-pretty">{seo.description}</p>
          </section>

          <section className="mb-[40px] md:mb-[56px]" aria-label="월별 보기">
            <div className="mb-[18px]">
              <YearSelect years={years} year={ym.y} month={ym.m} />
            </div>
            <MonthTabs year={ym.y} month={ym.m} months={months} />
          </section>

          {posts.length === 0 ? (
            <div className="border border-[rgba(33,30,25,.14)] px-[24px] py-[64px] text-center text-[14px] text-[rgba(33,30,25,.55)]">
              {ym.y}년 {ym.m}월에 올라온 소식이 없습니다. 다른 달을 선택해 보세요.
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-[40px] sm:grid-cols-2 lg:grid-cols-3 md:gap-x-[28px] md:gap-y-[48px]">
              {posts.map((p) => (
                <article key={p.id} className="min-w-0">
                  <Link href={`/news/${encodeURIComponent(p.slug)}`} className="block group">
                    <div className="mb-[18px] overflow-hidden bg-[#e7e0d3]">
                      {p.cover_image ? (
                        <Image src={p.cover_image} alt="" width={1080} height={1350} sizes="(min-width: 1024px) 400px, (min-width: 640px) 50vw, 100vw" className="block w-full h-auto transition-transform duration-500 group-hover:scale-[1.02]" unoptimized={p.cover_image.startsWith("http")} />
                      ) : (
                        <div className="aspect-[4/5]" />
                      )}
                    </div>
                    <div className="flex items-center gap-[12px] text-[10.5px] tracking-[.28em] text-brownHover mb-[10px]">
                      <span>{p.category.toUpperCase()}</span>
                      <span className="tracking-[.1em] text-[rgba(33,30,25,.45)]">{fmtPostDate(p)}</span>
                    </div>
                    <h2 className="text-[19px] md:text-[21px] leading-[1.4] mb-[8px] font-semibold text-pretty group-hover:text-brownHover">{p.title}</h2>
                    {(p.summary || p.body) && <p className="text-[14.5px] leading-[1.6] text-[rgba(33,30,25,.62)] text-pretty">{p.summary || plainText(p.body, 120)}</p>}
                  </Link>
                </article>
              ))}
            </div>
          )}
        </div>
        <JsonLd data={breadcrumbJsonLd([{ name: "홈", path: "/" }, { name: "소식", path: "/news" }])} />
      </main>
      <SiteFooter />
      <UpButton />
    </div>
  );
}
