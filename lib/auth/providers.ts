/**
 * 소셜 로그인 설정 (사용자 결정: 카카오 + 네이버).
 * - 카카오: Supabase Auth 기본 provider. 개발자 콘솔 키를 Supabase(Authentication → Providers → Kakao)에 넣는다.
 * - 네이버: Supabase 기본 provider 가 아니라 직접 연동한다(app/auth/naver/*). 네이버 개발자센터 키를
 *   NAVER_CLIENT_ID / NAVER_CLIENT_SECRET 에 넣고 Callback URL 로 https://<도메인>/auth/naver/callback 을 등록한다.
 * 둘 다 NEXT_PUBLIC_AUTH_PROVIDERS="kakao,naver" 로 켠다. 꺼져 있으면 버튼은 보이되 "준비 중" 안내만 한다.
 */
export type SocialProviderId = "kakao" | "naver";

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
  { id: "naver", loginLabel: "네이버 로그인", joinLabel: "네이버로 시작하기", bg: "#03C75A", fg: "#ffffff" },
];

export function enabledProviders(): Set<SocialProviderId> {
  const raw = process.env.NEXT_PUBLIC_AUTH_PROVIDERS ?? "";
  return new Set(
    raw
      .split(",")
      .map((s) => s.trim().toLowerCase())
      .filter((s): s is SocialProviderId => s === "kakao" || s === "naver"),
  );
}

/** 소셜 가입 시 초대코드를 콜백까지 전달하는 쿠키 이름 */
export const INVITE_COOKIE = "rsc_invite";
/** 네이버 OAuth state 쿠키 (CSRF 방지) */
export const NAVER_STATE_COOKIE = "rsc_naver_state";

/** 소셜 가입 전 초대코드를 쿠키에 남긴다 (콜백에서 사용 처리). 브라우저에서만 호출. */
export function setInviteCookie(code: string) {
  document.cookie = `${INVITE_COOKIE}=${encodeURIComponent(code)}; path=/; max-age=3600; samesite=lax`;
}
