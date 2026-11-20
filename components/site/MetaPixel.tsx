"use client";

import Script from "next/script";
import { usePathname } from "next/navigation";

declare global {
  interface Window { fbq?: (...args: unknown[]) => void }
}

/**
 * 메타(페이스북·인스타그램) 픽셀. 일반 설정 → 상담 신청 · 광고 측정 → 메타 픽셀 ID 가 있을 때만 공개 페이지에 싣는다.
 * 어드민·로그인 화면에는 싣지 않는다. 상담 신청 완료 시 trackLead() 가 Lead 이벤트를 보낸다.
 */
export function MetaPixel({ pixelId }: { pixelId: string }) {
  const pathname = usePathname();
  const id = (pixelId || "").trim();
  if (!/^\d{6,20}$/.test(id)) return null;
  if (!pathname || pathname.startsWith("/admin") || pathname.startsWith("/login") || pathname.startsWith("/api")) return null;
  const code = `!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init','${id}');fbq('track','PageView');`;
  return (
    <>
      <Script id="meta-pixel" strategy="afterInteractive" dangerouslySetInnerHTML={{ __html: code }} />
      <noscript>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img height="1" width="1" style={{ display: "none" }} alt="" src={`https://www.facebook.com/tr?id=${id}&ev=PageView&noscript=1`} />
      </noscript>
    </>
  );
}

/** 상담 신청 완료 → 메타 Lead 이벤트. 픽셀이 없으면 아무 일도 하지 않는다. */
export function trackLead() {
  try {
    window.fbq?.("track", "Lead");
  } catch {}
}
