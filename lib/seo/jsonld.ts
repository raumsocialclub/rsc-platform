import { getBrand, getDoc, s } from "@/lib/cms/get";
import { lines } from "@/components/cms/Txt";
import { absUrl, siteUrl } from "./get";

type Obj = Record<string, unknown>;

/** Organization + LocalBusiness + WebSite (루트 레이아웃) — seo.org 와 global.brand 값으로 */
export async function organizationJsonLd(): Promise<Obj[]> {
  const [o, b] = await Promise.all([getDoc("seo.org"), getBrand()]);
  const base = siteUrl();
  const name = s(o, "name") || "라움소셜클럽";
  const sameAs = Array.from(new Set([b.instagramUrl, ...lines(s(o, "sameAs"))].filter(Boolean)));
  const address: Obj = {
    "@type": "PostalAddress",
    streetAddress: s(o, "streetAddress") || undefined,
    addressLocality: s(o, "addressLocality") || undefined,
    addressRegion: s(o, "addressRegion") || undefined,
    postalCode: s(o, "postalCode") || undefined,
    addressCountry: "KR",
  };
  const org: Obj = {
    "@context": "https://schema.org",
    "@type": ["Organization", "LocalBusiness"],
    "@id": `${base}/#organization`,
    name,
    alternateName: s(o, "alternateName") || undefined,
    legalName: s(o, "legalName") || undefined,
    description: s(o, "description") || undefined,
    url: base,
    logo: absUrl(s(o, "logo") || b.logoEmblem || "/images/logo-emblem.png"),
    image: absUrl("/images/hero.jpg"),
    telephone: b.phone || undefined,
    email: b.email || undefined,
    address,
    openingHours: s(o, "openingHours") || undefined,
    priceRange: s(o, "priceRange") || undefined,
    sameAs: sameAs.length ? sameAs : undefined,
  };
  const site: Obj = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${base}/#website`,
    url: base,
    name,
    alternateName: s(o, "alternateName") || undefined,
    inLanguage: "ko-KR",
    publisher: { "@id": `${base}/#organization` },
  };
  return [org, site];
}

export function faqJsonLd(items: { q: string; a: string }[]): Obj {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.filter((i) => i.q && i.a).map((i) => ({ "@type": "Question", name: i.q, acceptedAnswer: { "@type": "Answer", text: i.a } })),
  };
}

export function articleJsonLd(p: { title: string; summary: string | null; slug: string; cover_image: string | null; published_at: string | null; updated_at: string; body: string }, orgName: string): Obj {
  const base = siteUrl();
  return {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    headline: p.title,
    description: p.summary || undefined,
    image: p.cover_image ? [absUrl(p.cover_image)] : undefined,
    datePublished: p.published_at ?? undefined,
    dateModified: p.updated_at,
    inLanguage: "ko-KR",
    mainEntityOfPage: `${base}/news/${encodeURIComponent(p.slug)}`,
    author: { "@type": "Organization", name: orgName, "@id": `${base}/#organization` },
    publisher: { "@id": `${base}/#organization` },
    wordCount: p.body.replace(/\s+/g, " ").trim().split(" ").length,
  };
}

export function breadcrumbJsonLd(items: { name: string; path: string }[]): Obj {
  const base = siteUrl();
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((it, i) => ({ "@type": "ListItem", position: i + 1, name: it.name, item: `${base}${it.path}` })),
  };
}
