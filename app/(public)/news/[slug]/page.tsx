import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Markdown } from "@/components/Markdown";
import { Header } from "@/components/site/Header";
import { SiteFooter } from "@/components/site/SiteFooter";
import { UpButton } from "@/components/site/UpButton";
import { JsonLd } from "@/components/seo/JsonLd";
import { getDoc, s } from "@/lib/cms/get";
import { getPostBySlug } from "@/lib/posts/queries";
import { fmtDate, plainText } from "@/lib/posts/types";
import { pageMetadata } from "@/lib/seo/get";
import { articleJsonLd, breadcrumbJsonLd } from "@/lib/seo/jsonld";

type Params = { params: Promise<{ slug: string }> };

function decode(slug: string): string {
  try { return decodeURIComponent(slug); } catch { return slug; }
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const p = await getPostBySlug(decode(slug));
  if (!p || !p.published) return { title: "소식", robots: { index: false, follow: false } };
  return pageMetadata("news", { title: p.title, description: p.summary || plainText(p.body), image: p.cover_image || undefined, path: `/news/${encodeURIComponent(p.slug)}`, type: "article", publishedTime: p.published_at ?? undefined, modifiedTime: p.updated_at });
}

/** 소식 상세 (M11). 발행되지 않은 글은 RLS 로 안 보이므로 404 */
export default async function NewsDetailPage({ params }: Params) {
  const { slug } = await params;
  const [p, org] = await Promise.all([getPostBySlug(decode(slug)), getDoc("seo.org")]);
  if (!p || !p.published) notFound();

  return (
    <div className="min-h-screen flex flex-col pt-[57px] md:pt-[76px]">
      <Header />
      <main className="flex-1 px-[18px] pt-[40px] pb-[96px] md:px-[40px] md:pt-[72px] md:pb-[140px]">
        <article className="w-full max-w-[760px] mx-auto">
          <div className="flex items-center gap-[12px] text-[10.5px] tracking-[.28em] text-brownHover mb-[22px]">
            <Link href="/news" className="hover:text-brown">NEWS</Link>
            <span className="text-[rgba(33,30,25,.3)]">/</span>
            <span>{p.category.toUpperCase()}</span>
          </div>
          <h1 className="font-semibold text-[28px] md:text-[clamp(30px,3.4vw,42px)] leading-[1.3] mb-[18px] text-pretty">{p.title}</h1>
          <div className="text-[12.5px] tracking-[.1em] text-[rgba(33,30,25,.5)] mb-[40px]">{fmtDate(p.published_at)}</div>
          {p.cover_image && (
            <div className="relative w-full aspect-[3/2] overflow-hidden bg-[#e7e0d3] mb-[44px]">
              <Image src={p.cover_image} alt="" fill priority sizes="(min-width: 761px) 760px, 100vw" className="object-cover" unoptimized={p.cover_image.startsWith("http")} />
            </div>
          )}
          {p.summary && <p className="text-[17px] md:text-[18px] leading-[1.7] text-ink font-semibold mb-[36px] text-pretty">{p.summary}</p>}
          <Markdown source={p.body} />
          <div className="mt-[64px] pt-[28px] border-t border-[rgba(33,30,25,.14)] flex justify-between items-center gap-[16px] flex-wrap">
            <Link href="/news" className="text-[13.5px] font-semibold text-brown hover:text-brownHover">← 소식 목록</Link>
            <Link href="/fit-check" className="inline-flex items-center px-[24px] py-[13px] rounded-pill bg-ink text-cream text-[13px] hover:bg-brownHover hover:text-cream">RSC 상담 신청하기</Link>
          </div>
        </article>
        <JsonLd data={[articleJsonLd(p, s(org, "name") || "라움소셜클럽"), breadcrumbJsonLd([{ name: "홈", path: "/" }, { name: "소식", path: "/news" }, { name: p.title, path: `/news/${encodeURIComponent(p.slug)}` }])]} />
      </main>
      <SiteFooter />
      <UpButton />
    </div>
  );
}
