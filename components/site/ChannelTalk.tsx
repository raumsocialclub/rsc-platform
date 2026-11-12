"use client";

import Script from "next/script";
import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { CHANNEL_TALK_SDK, channelTalkHidden, isChannelTalkKey } from "@/lib/settings/channelTalk";

declare global {
  interface Window { ChannelIO?: (...args: unknown[]) => void; ChannelIOInitialized?: boolean }
}

/**
 * 채널톡 버튼. 일반 설정의 플러그인 키가 있을 때만 공개 페이지에 싣는다 (어드민·로그인·설문 화면 제외).
 * 공식 설치 코드(로더 스크립트 + ChannelIO('boot', { pluginKey })) 그대로이며, 페이지가 바뀌면 setPage 로 알려 채널톡 통계에 경로가 남는다.
 * 버튼이 떠 있는 동안 「맨 위로」 버튼은 위로 올라간다 (html[data-chat] — app/globals.css).
 */
export function ChannelTalk({ pluginKey }: { pluginKey: string }) {
  const pathname = usePathname();
  const key = (pluginKey || "").trim();
  const on = isChannelTalkKey(key) && !channelTalkHidden(pathname);

  useEffect(() => {
    if (on) document.documentElement.setAttribute("data-chat", "1");
    else document.documentElement.removeAttribute("data-chat");
    if (on && window.ChannelIO) {
      try { window.ChannelIO("setPage", window.location.href); window.ChannelIO("showChannelButton"); } catch {}
    } else if (!on && window.ChannelIO) {
      try { window.ChannelIO("hideChannelButton"); } catch {}
    }
  }, [on, pathname]);

  if (!on) return null;
  const loader = `(function(){var w=window;if(w.ChannelIO){return;}var ch=function(){ch.c(arguments);};ch.q=[];ch.c=function(args){ch.q.push(args);};w.ChannelIO=ch;function l(){if(w.ChannelIOInitialized){return;}w.ChannelIOInitialized=true;var s=document.createElement("script");s.type="text/javascript";s.async=true;s.src="${CHANNEL_TALK_SDK}";var x=document.getElementsByTagName("script")[0];if(x&&x.parentNode){x.parentNode.insertBefore(s,x);}else{document.head.appendChild(s);}}if(document.readyState==="complete"){l();}else{w.addEventListener("DOMContentLoaded",l);w.addEventListener("load",l);}})();ChannelIO("boot",{"pluginKey":"${key}","language":"ko","zIndex":80});`;
  return <Script id="channel-talk" strategy="afterInteractive" dangerouslySetInnerHTML={{ __html: loader }} />;
}
