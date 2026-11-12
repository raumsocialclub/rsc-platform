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
import { Badge, CARD, CARD_HOVER, Container } from "@/components/ui/ds";
import { Txt } from "@/components/cms/Txt";
import { getDoc, s } from "@/lib/cms/get";

type Search = Promise<{ y?: string; m?: string }>;

export async function generateMetadata({ searchParams }: { searchParams: Search }): Promise<Metadata> {
  const { y, m } = await searchParams;
  const ym = parseYM(y, m);
  // 달별 화면은 같은 목록의 다른 보기이므로 검색 색인은 /news 만
  return pageMetadata("news", ym ? { path: `/news?y=${ym.y}&m=${ym.m}`, noindex: true } : {});
}

/**
 * 소식 목록 (M11 → M16 월별 달력형). 연도 선택 + 1~12월 탭, 그 달의 행사·소식을 행사 일자 순으로.
 * 목록 카드의 대표 사진은 인스타그램 피드 비율(1080×1350 = 4:5) 상자로 통일한다(같은 크기로 정렬). 상세는 원본 비율.
 */
export default async function NewsPage({ searchParams }: { searchParams: Search }) {
  const { y, m } = await searchParams;
  const [lite, seo, copy] = await Promise.all([listPublishedPostMonths(), getPageSeo("news"), getDoc("news.page")]);
  const months = monthsOf(lite);
  const today = todayYM();
  const ym = parseYM(y, m) ?? pickDefaultMonth(months, today);
  const ids = filterMonth(lite, ym).map((p) => p.id);
  const posts = filterMonth(await listPublishedPostsByIds(ids), ym);
  const years = yearOptions([...months, ym], today);

  return (
    <div className="min-h-screen flex flex-col pt-[56px] md:pt-[64px]">
      <Header />
      <main className="flex-1 py-[40px] md:py-[72px]">
        <Container wide>
          <section className="mb-[28px] md:mb-[40px]">
            <div className="anim-up t-eyebrow text-primary mb-[10px]">{s(copy, "eyebrow") || "NEWS"}</div>
            <h1 className="anim-up t-title-1 md:t-display-3 text-label mb-[12px] text-pretty">{seo.title || "소식"}</h1>
            <p className="anim-up-2 t-body-1-reading text-labelAlt max-w-[560px] text-pretty"><Txt v={seo.description} /></p>
          </section>

          <section className="mb-[32px] md:mb-[48px]" aria-label="월별 보기">
            <div className="mb-[14px]">
              <YearSelect years={years} year={ym.y} month={ym.m} />
            </div>
            <MonthTabs year={ym.y} month={ym.m} months={months} />
          </section>

          {posts.length === 0 ? (
            <div className={`${CARD} px-[24px] py-[64px] text-center t-body-2 text-labelAlt`}>
              {(s(copy, "emptyText") || "{y}년 {m}월에 올라온 소식이 없습니다. 다른 달을 선택해 보세요.").replace("{y}", String(ym.y)).replace("{m}", String(ym.m))}
            </div>
          ) : (
            <div data-fold className="grid grid-cols-1 gap-[20px] sm:grid-cols-2 lg:grid-cols-3 md:gap-[24px]">
              {posts.map((p, i) => (
                <article key={p.id} data-reveal style={{ "--d": `${(i % 3) * 80}ms` } as React.CSSProperties} className={`min-w-0 ${CARD} ${CARD_HOVER} overflow-hidden`}>
                  <Link href={`/news/${encodeURIComponent(p.slug)}`} className="block group">
                    {/* 모든 카드를 인스타 피드 비율(4:5) 상자로 통일 */}
                    <div className="relative aspect-[4/5] overflow-hidden bg-fill img-live">
                      {p.cover_image && <Image src={p.cover_image} alt="" fill sizes="(min-width: 1024px) 400px, (min-width: 640px) 50vw, 100vw" className="object-cover object-center" unoptimized={p.cover_image.startsWith("http")} />}
                    </div>
                    <div className="p-[18px] md:p-[20px]">
                      <div className="flex items-center gap-[8px] mb-[10px]">
                        <Badge tone="primary">{p.category}</Badge>
                        <span className="t-caption-1 text-labelAlt">{fmtPostDate(p)}</span>
                      </div>
                      <h2 className="t-heading-2 text-label mb-[6px] text-pretty transition-colors group-hover:text-primary">{p.title}</h2>
                      {(p.summary || p.body) && <p className="t-body-2-reading text-labelAlt text-pretty m-0">{p.summary || plainText(p.body, 120)}</p>}
                    </div>
                  </Link>
                </article>
              ))}
            </div>
          )}
        </Container>
        <JsonLd data={breadcrumbJsonLd([{ name: "홈", path: "/" }, { name: "소식", path: "/news" }])} />
      </main>
      <SiteFooter />
      <UpButton />
    </div>
  );
}
