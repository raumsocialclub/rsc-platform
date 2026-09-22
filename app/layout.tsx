import type { Metadata } from "next";
import { samsungOne } from "@/lib/fonts";
import "./globals.css";

export const metadata: Metadata = {
  title: "RAUM SOCIAL CLUB",
  description: "라움이 검증한 멤버가 모이는 싱글 라이프스타일 커뮤니티",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko" className={`${samsungOne.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-cream text-ink font-sans font-medium">
        {children}
      </body>
    </html>
  );
}
