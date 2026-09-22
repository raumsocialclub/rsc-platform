"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

/** 접속 통계 비콘 (M9). 경로가 바뀔 때마다 /api/track 으로 보낸다. 어드민·API 경로는 제외. */
export function PageTracker() {
  const pathname = usePathname();
  const last = useRef<string | null>(null);
  useEffect(() => {
    if (!pathname || pathname.startsWith("/admin") || pathname.startsWith("/api")) return;
    if (last.current === pathname) return;
    last.current = pathname;
    const body = JSON.stringify({ path: pathname, referrer: document.referrer || "", search: window.location.search, width: window.innerWidth });
    try {
      if (navigator.sendBeacon) navigator.sendBeacon("/api/track", new Blob([body], { type: "application/json" }));
      else void fetch("/api/track", { method: "POST", headers: { "Content-Type": "application/json" }, body, keepalive: true });
    } catch {}
  }, [pathname]);
  return null;
}
