import type { Metadata } from "next";
import { samsungOne } from "@/lib/fonts";
import { PageTracker } from "@/components/site/PageTracker";
import { EnvBanner } from "@/components/site/EnvBanner";
import { JsonLd } from "@/components/seo/JsonLd";
import { getBrand, getTheme } from "@/lib/cms/get";
import { getSeo, robotsFor, siteUrl, absUrl } from "@/lib/seo/get";
import { organizationJsonLd } from "@/lib/seo/jsonld";
import "./globals.css";

/**
 * 전역 메타데이터 (M11 SEO). 제목 틀·기본 설명·대표 이미지·검색 노출·소유 확인은 어드민 "SEO 설정" 값.
 * 페이지별 값은 lib/seo/get.ts pageMetadata() 가 덮어쓴다.
 */
export async function generateMetadata(): Promise<Metadata> {
  const [b, seo] = await Promise.all([getBrand(), getSeo()]);
  const siteName = b.siteName || "RAUM SOCIAL CLUB";
  const suffix = seo.titleSuffix || siteName;
  const image = absUrl(seo.ogImage);
  return {
    metadataBase: new URL(siteUrl()),
    title: { default: siteName, template: `%s · ${suffix}` },
    description: seo.defaultDescription,
    keywords: seo.keywords ? seo.keywords.split(",").map((k) => k.trim()).filter(Boolean) : undefined,
    applicationName: siteName,
    robots: robotsFor(seo.indexing),
    verification: { google: seo.google || undefined, other: seo.naver ? { "naver-site-verification": seo.naver } : undefined },
    openGraph: { type: "website", locale: "ko_KR", siteName, title: siteName, description: seo.defaultDescription, images: image ? [{ url: image, width: 1200, height: 630, alt: siteName }] : undefined },
    twitter: { card: "summary_large_image", title: siteName, description: seo.defaultDescription, images: image ? [image] : undefined },
    formatDetection: { telephone: false },
  };
}

/** 루트 레이아웃. 어드민 "색상 테마" 값을 :root CSS 변수로 주입한다(tailwind 토큰이 이 변수를 쓴다). */
export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const [t, org] = await Promise.all([getTheme(), organizationJsonLd()]);
  const css = `:root{--c-cream:${t.cream};--c-ink:${t.ink};--c-brown:${t.brown};--c-brownHover:${t.brownHover};--c-gold:${t.gold};--c-goldHover:${t.goldHover};--c-sand:${t.sand};--c-sandDeep:${t.sandDeep}}`;
  return (
    <html lang="ko" className={`${samsungOne.variable} h-full antialiased`}>
      <head>
        <style dangerouslySetInnerHTML={{ __html: css }} />
      </head>
      <body className="min-h-full flex flex-col bg-cream text-ink font-sans font-medium">
        <EnvBanner />
        {children}
        <JsonLd data={org} />
        <PageTracker />
      </body>
    </html>
  );
}
