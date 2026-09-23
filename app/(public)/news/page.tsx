import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Header } from "@/components/site/Header";
import { SiteFooter } from "@/components/site/SiteFooter";
import { UpButton } from "@/components/site/UpButton";
import { JsonLd } from "@/components/seo/JsonLd";
import { listPublishedPosts } from "@/lib/posts/queries";
import { fmtDate, plainText } from "@/lib/posts/types";
import { getPageSeo, pageMetadata } from "@/lib/seo/get";
import { breadcrumbJsonLd } from "@/lib/seo/jsonld";

export async function generateMetadata({ searchParams }: { searchParams: Promise<{ page?: string }> }): Promise<Metadata> {
  const { page } = await searchParams;
  const n = Math.max(1, Number(page) || 1);
  return pageMetadata("news", n > 1 ? { path: `/news?page=${n}`, noindex: true } : {});
}

/** 소식 목록 (M11). 카드 그리드 + 페이지 이동. 디자인은 메인 04 섹션 카드 규칙을 따른다. */
export default async function NewsPage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  const { page } = await searchParams;
  const n = Math.max(1, Number(page) || 1);
  const [{ posts, pages }, seo] = await Promise.all([listPublishedPosts(n), getPageSeo("news")]);
  if (n > 1 && posts.length === 0) notFound();

  return (
    <div className="min-h-screen flex flex-col pt-[57px] md:pt-[76px]">
      <Header />
      <main className="flex-1 px-[18px] pt-[40px] pb-[96px] md:px-[40px] md:pt-[72px] md:pb-[140px]">
        <div className="w-full max-w-[1240px] mx-auto">
          <section className="mb-[48px] md:mb-[72px]">
            <div className="text-[11px] tracking-[.3em] text-brownHover mb-[22px]">NEWS</div>
            <h1 className="font-semibold text-[30px] md:text-[clamp(30px,3.4vw,44px)] leading-[1.28] mb-[16px] text-pretty">{seo.title || "소식"}</h1>
            <p className="text-[15px] md:text-[16px] leading-[1.7] text-[rgba(33,30,25,.68)] max-w-[560px] text-pretty">{seo.description}</p>
          </section>

          {posts.length === 0 ? (
            <div className="border border-[rgba(33,30,25,.14)] px-[24px] py-[64px] text-center text-[14px] text-[rgba(33,30,25,.55)]">아직 올라온 소식이 없습니다. 곧 새로운 소식으로 찾아뵙겠습니다.</div>
          ) : (
            <div className="grid grid-cols-1 gap-[32px] md:grid-cols-[repeat(auto-fit,minmax(300px,1fr))] md:gap-[28px]">
              {posts.map((p) => (
                <article key={p.id} className="min-w-0">
                  <Link href={`/news/${encodeURIComponent(p.slug)}`} className="block group">
                    <div className="relative h-[200px] md:h-[280px] mb-[20px] overflow-hidden bg-[#e7e0d3]">
                      {p.cover_image && <Image src={p.cover_image} alt="" fill sizes="(min-width: 761px) 33vw, 100vw" className="object-cover transition-transform duration-500 group-hover:scale-[1.03]" unoptimized={p.cover_image.startsWith("http")} />}
                    </div>
                    <div className="flex items-center gap-[12px] text-[10.5px] tracking-[.28em] text-brownHover mb-[12px]">
                      <span>{p.category.toUpperCase()}</span>
                      <span className="tracking-[.1em] text-[rgba(33,30,25,.45)]">{fmtDate(p.published_at)}</span>
                    </div>
                    <h2 className="text-[20px] md:text-[22px] leading-[1.4] mb-[10px] font-semibold text-pretty group-hover:text-brownHover">{p.title}</h2>
                    <p className="text-[14.5px] leading-[1.6] text-[rgba(33,30,25,.62)] text-pretty">{p.summary || plainText(p.body, 120)}</p>
                  </Link>
                </article>
              ))}
            </div>
          )}

          {pages > 1 && (
            <nav className="flex justify-center gap-[6px] mt-[64px]" aria-label="페이지">
              {Array.from({ length: pages }, (_, i) => i + 1).map((i) => (
                <Link key={i} href={i === 1 ? "/news" : `/news?page=${i}`} className="w-[38px] h-[38px] flex items-center justify-center text-[13px] border" style={{ background: i === n ? "#211e19" : "transparent", color: i === n ? "#f7f3ec" : "#211e19", borderColor: i === n ? "#211e19" : "rgba(33,30,25,.2)" }} aria-current={i === n ? "page" : undefined}>
                  {i}
                </Link>
              ))}
            </nav>
          )}
        </div>
        <JsonLd data={breadcrumbJsonLd([{ name: "홈", path: "/" }, { name: "소식", path: "/news" }])} />
      </main>
      <SiteFooter />
      <UpButton />
    </div>
  );
}
