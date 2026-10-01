import type { Metadata } from "next";
import { getBrand, getDoc, s } from "@/lib/cms/get";
import { DEFAULT_DESCRIPTION, DEFAULT_OG_IMAGE, PUBLIC_PAGES } from "./schema";

/** 사이트 절대 주소 (NEXT_PUBLIC_SITE_URL). 끝 슬래시 없음 */
export function siteUrl(): string {
  const raw = process.env.NEXT_PUBLIC_SITE_URL || "https://rsc-platform.vercel.app";
  return raw.replace(/\/+$/, "");
}

export type SeoGlobal = { indexing: boolean; titleSuffix: string; defaultDescription: string; keywords: string; ogImage: string; google: string; naver: string; aiCrawlers: boolean; llmsText: string };

/** seo.global + seo.verify + seo.ai 를 한 객체로 */
export async function getSeo(): Promise<SeoGlobal> {
  const [g, v, a] = await Promise.all([getDoc("seo.global"), getDoc("seo.verify"), getDoc("seo.ai")]);
  return {
    indexing: g.indexing === true,
    titleSuffix: s(g, "titleSuffix"),
    defaultDescription: s(g, "defaultDescription") || DEFAULT_DESCRIPTION,
    keywords: s(g, "keywords"),
    ogImage: s(g, "ogImage") || DEFAULT_OG_IMAGE,
    google: s(v, "google").trim(),
    naver: s(v, "naver").trim(),
    aiCrawlers: a.aiCrawlers !== false,
    llmsText: s(a, "llmsText"),
  };
}

export type PageSeo = { title: string; description: string; ogImage: string; noindex: boolean };
export async function getPageSeo(key: string): Promise<PageSeo> {
  const d = await getDoc(`seo.${key}`);
  return { title: s(d, "title"), description: s(d, "description"), ogImage: s(d, "ogImage"), noindex: d.noindex === true };
}

/** 상대 경로면 절대 주소로 */
export function absUrl(p: string): string {
  if (!p) return "";
  return /^https?:\/\//.test(p) ? p : `${siteUrl()}${p.startsWith("/") ? p : `/${p}`}`;
}

export function robotsFor(index: boolean): NonNullable<Metadata["robots"]> {
  return index ? { index: true, follow: true, googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1 } } : { index: false, follow: false, googleBot: { index: false, follow: false } };
}

type Override = { title?: string; description?: string; image?: string; path?: string; type?: "website" | "article"; publishedTime?: string; modifiedTime?: string; noindex?: boolean };

/**
 * 공개 페이지용 메타데이터. seo.<key> 문서 + 전역 기본값으로 제목·설명·OG·canonical·robots 를 만든다.
 * override 는 소식 상세처럼 DB 데이터로 채우는 페이지가 넘긴다.
 */
export async function pageMetadata(key: string, override: Override = {}): Promise<Metadata> {
  const [g, p, brand] = await Promise.all([getSeo(), getPageSeo(key), getBrand()]);
  const page = PUBLIC_PAGES.find((x) => x.key === key);
  const path = override.path ?? page?.path ?? "/";
  const rawTitle = override.title || p.title || page?.label || brand.siteName || "RAUM SOCIAL CLUB";
  const title = key === "home" && !override.title ? { absolute: rawTitle } : rawTitle;
  const description = override.description || p.description || g.defaultDescription;
  const image = absUrl(override.image || p.ogImage || g.ogImage);
  const index = g.indexing && !p.noindex && !override.noindex;
  return {
    title,
    description,
    alternates: { canonical: path },
    robots: robotsFor(index),
    openGraph: {
      type: override.type ?? "website",
      locale: "ko_KR",
      siteName: brand.siteName || "RAUM SOCIAL CLUB",
      url: path,
      title: rawTitle,
      description,
      images: image ? [{ url: image, width: 1200, height: 630, alt: rawTitle }] : undefined,
      ...(override.type === "article" ? { publishedTime: override.publishedTime, modifiedTime: override.modifiedTime } : {}),
    },
    twitter: { card: "summary_large_image", title: rawTitle, description, images: image ? [image] : undefined },
  };
}
