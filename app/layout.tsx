import type { Metadata } from "next";
import { samsungOne } from "@/lib/fonts";
import { PageTracker } from "@/components/site/PageTracker";
import { getBrand, getTheme } from "@/lib/cms/get";
import "./globals.css";

export async function generateMetadata(): Promise<Metadata> {
  const b = await getBrand();
  return { title: b.siteName || "RAUM SOCIAL CLUB", description: b.metaDescription || "라움이 검증한 멤버가 모이는 싱글 라이프스타일 커뮤니티" };
}

/** 루트 레이아웃. 어드민 "색상 테마" 값을 :root CSS 변수로 주입한다(tailwind 토큰이 이 변수를 쓴다). */
export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const t = await getTheme();
  const css = `:root{--c-cream:${t.cream};--c-ink:${t.ink};--c-brown:${t.brown};--c-brownHover:${t.brownHover};--c-gold:${t.gold};--c-goldHover:${t.goldHover};--c-sand:${t.sand};--c-sandDeep:${t.sandDeep}}`;
  return (
    <html lang="ko" className={`${samsungOne.variable} h-full antialiased`}>
      <head>
        <style dangerouslySetInnerHTML={{ __html: css }} />
      </head>
      <body className="min-h-full flex flex-col bg-cream text-ink font-sans font-medium">
        {children}
        <PageTracker />
      </body>
    </html>
  );
}
