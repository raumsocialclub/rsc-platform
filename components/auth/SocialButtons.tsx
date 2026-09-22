"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { SOCIAL_PROVIDERS, setInviteCookie, type SocialProviderId } from "@/lib/auth/providers";

type Props = {
  mode: "login" | "join";
  /** 가입 화면: 소셜 가입 뒤 콜백에서 사용 처리할 초대코드 */
  inviteCode?: string;
  enabled: SocialProviderId[];
  next?: string;
};

/** 카카오(Supabase OAuth)·네이버(직접 연동) 버튼. 키가 등록되지 않은 provider 는 "준비 중" 안내만 한다. */
export function SocialButtons({ mode, inviteCode, enabled, next }: Props) {
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState<SocialProviderId | null>(null);
  const target = next ?? "/programs";

  const start = async (id: SocialProviderId) => {
    if (!enabled.includes(id)) {
      setNotice("소셜 로그인은 준비 중입니다. 이메일로 진행해 주세요.");
      return;
    }
    setBusy(id);
    setNotice(null);
    if (inviteCode) setInviteCookie(inviteCode);

    if (id === "naver") {
      // 네이버는 서버 라우트가 state 를 만들고 네이버 인증 페이지로 보낸다.
      window.location.href = `/auth/naver/start?next=${encodeURIComponent(target)}`;
      return;
    }
    const redirectTo = `${window.location.origin}/auth/callback?next=${encodeURIComponent(target)}`;
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOAuth({ provider: id, options: { redirectTo } });
    if (error) {
      setNotice("소셜 로그인을 시작하지 못했습니다. 잠시 후 다시 시도해 주세요.");
      setBusy(null);
    }
  };

  return (
    <div className="flex flex-col gap-[10px] mb-[28px]">
      {SOCIAL_PROVIDERS.map((p) => {
        const on = enabled.includes(p.id);
        return (
          <button
            key={p.id}
            type="button"
            onClick={() => start(p.id)}
            disabled={busy !== null}
            aria-disabled={!on}
            className={`flex items-center justify-center gap-[10px] cursor-pointer p-[16px] text-[14px] font-semibold border ${on ? "" : "opacity-60"}`}
            style={{ background: p.bg, color: p.fg, borderColor: p.border ?? p.bg }}
          >
            {p.id === "kakao" ? (
              <span aria-hidden className="inline-block w-[18px] h-[18px] rounded-full bg-[#191919]" />
            ) : (
              <span aria-hidden className="inline-flex items-center justify-center w-[18px] h-[18px] bg-white text-[#03C75A] font-black text-[12px] leading-none">N</span>
            )}
            {mode === "login" ? p.loginLabel : p.joinLabel}
            {!on && <span className="text-[11px] font-medium opacity-80">준비 중</span>}
          </button>
        );
      })}
      {notice && <div className="text-[13px] text-[rgba(33,30,25,.6)]">{notice}</div>}
    </div>
  );
}
