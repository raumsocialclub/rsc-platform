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
import { plainText } from "@/lib/posts/types";
import { fmtEventDate } from "@/lib/posts/calendar";
import { pageMetadata } from "@/lib/seo/get";
import { articleJsonLd, breadcrumbJsonLd } from "@/lib/seo/jsonld";
import { Badge, ButtonLink, btn } from "@/components/ui/ds";
import { applyHref, applyState } from "@/lib/posts/apply";

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
  const [p, org, copy] = await Promise.all([getPostBySlug(decode(slug)), getDoc("seo.org"), getDoc("news.page")]);
  if (!p || !p.published) notFound();
  const state = applyState(p);
  const apply = state !== "off";
  const applyLabel = s(copy, "applyLabel") || "참여하기";
  const applyHint = s(copy, "applyHint");
  const closedLabel = s(copy, "applyClosedLabel") || "참여 종료";
  const scheduleLabel = s(copy, "scheduleLabel") || "프로그램 일정";
  const comingSoon = s(copy, "comingSoonLabel") || "Coming soon";
  const closedBtn = (size: "lg" | "md") => <span aria-disabled="true" data-testid="news-apply-closed" className={btn("assistive", size, "pointer-events-none text-labelDisable border-lineAlt bg-fillAlt")}>{closedLabel}</span>;

  return (
    <div className="min-h-screen flex flex-col pt-[56px] md:pt-[64px]">
      <Header />
      <main className="flex-1 px-[20px] py-[40px] md:px-[32px] md:py-[72px]">
        <article className="w-full max-w-[760px] mx-auto">
          <div className="flex items-center gap-[8px] mb-[16px]">
            <Link href="/news" className="t-label-1 text-labelAlt hover:text-label">소식</Link>
            <span className="text-labelAssist">/</span>
            <Badge tone="primary">{scheduleLabel}</Badge>
          </div>
          <h1 className="t-title-2 md:t-title-1 text-label mb-[12px] text-pretty">{p.title}</h1>
          {/* 2026-11-25: 발행일 없이 프로그램 일정(행사 일자)만. 없으면 Coming soon */}
          <div className={`t-label-1 text-labelAlt ${apply ? "mb-[18px]" : "mb-[32px]"}`} data-testid="news-schedule">
            {scheduleLabel} <b className="text-label font-semibold ml-[4px]">{fmtEventDate(p) || comingSoon}</b>
          </div>
          {apply && (
            <div className="mb-[32px] flex items-center gap-[14px] flex-wrap" data-testid="news-apply">
              {state === "open" ? <ButtonLink href={applyHref(p.slug)} size="lg">{applyLabel}</ButtonLink> : closedBtn("lg")}
              {state === "open" && applyHint && <span className="t-label-1 text-labelAlt text-pretty">{applyHint}</span>}
            </div>
          )}
          {p.cover_image && (
            <div className="relative w-full overflow-hidden rounded-ds bg-fill mb-[36px] img-live">
              {/* 인스타그램 피드 비율(1080×1350) 원본 그대로 — 잘라내지 않는다 */}
              <Image src={p.cover_image} alt="" width={1080} height={1350} priority sizes="(min-width: 761px) 760px, 100vw" className="block w-full h-auto" unoptimized={p.cover_image.startsWith("http")} />
            </div>
          )}
          {p.summary && <p className="t-headline-1 text-label mb-[28px] text-pretty">{p.summary}</p>}
          <Markdown source={p.body} />
          <div className="mt-[48px] pt-[24px] border-t border-lineAlt flex justify-between items-center gap-[16px] flex-wrap">
            <ButtonLink href="/news" variant="text" size="md">{s(copy, "backLabel") || "← 소식 목록"}</ButtonLink>
            <div className="flex gap-[8px] flex-wrap">
              {state === "open" && <ButtonLink href={applyHref(p.slug)} size="md">{applyLabel}</ButtonLink>}
              {state === "closed" && closedBtn("md")}
              <ButtonLink href="/fit-check" size="md" variant={apply ? "assistive" : "solid"}>{s(copy, "ctaLabel") || "RSC 상담 신청하기"}</ButtonLink>
            </div>
          </div>
        </article>
        <JsonLd data={[articleJsonLd(p, s(org, "name") || "라움소셜클럽"), breadcrumbJsonLd([{ name: "홈", path: "/" }, { name: "소식", path: "/news" }, { name: p.title, path: `/news/${encodeURIComponent(p.slug)}` }])]} />
      </main>
      <SiteFooter />
      <UpButton />
    </div>
  );
}
