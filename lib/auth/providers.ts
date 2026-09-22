/**
 * 소셜 로그인 설정. 카카오·구글은 Supabase Auth 기본 provider.
 * 개발자 콘솔 키를 Supabase(Authentication → Providers)에 넣은 뒤
 * NEXT_PUBLIC_AUTH_PROVIDERS="kakao,google" 로 켠다. 꺼져 있으면 버튼은 보이되 "준비 중" 안내만 한다.
 * 네이버는 Supabase 기본 provider 가 아니라 2차(커스텀 OIDC)에서 추가한다.
 */
export type SocialProviderId = "kakao" | "google";

export type SocialProvider = {
  id: SocialProviderId;
  /** 로그인 화면 라벨 */
  loginLabel: string;
  /** 가입 화면 라벨 */
  joinLabel: string;
  bg: string;
  fg: string;
  border?: string;
};

export const SOCIAL_PROVIDERS: SocialProvider[] = [
  { id: "kakao", loginLabel: "카카오 로그인", joinLabel: "카카오로 시작하기", bg: "#FEE500", fg: "#191919" },
  { id: "google", loginLabel: "구글 로그인", joinLabel: "구글로 시작하기", bg: "#ffffff", fg: "#211e19", border: "rgba(33,30,25,.24)" },
];

export function enabledProviders(): Set<SocialProviderId> {
  const raw = process.env.NEXT_PUBLIC_AUTH_PROVIDERS ?? "";
  return new Set(
    raw
      .split(",")
      .map((s) => s.trim().toLowerCase())
      .filter((s): s is SocialProviderId => s === "kakao" || s === "google"),
  );
}

/** 소셜 가입 시 초대코드를 콜백까지 전달하는 쿠키 이름 */
export const INVITE_COOKIE = "rsc_invite";

/** 소셜 가입 전 초대코드를 쿠키에 남긴다 (콜백에서 사용 처리). 브라우저에서만 호출. */
export function setInviteCookie(code: string) {
  document.cookie = `${INVITE_COOKIE}=${encodeURIComponent(code)}; path=/; max-age=3600; samesite=lax`;
}
