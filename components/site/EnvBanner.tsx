/** 스테이징(Preview) 배포에서만 화면 맨 위에 STAGING 띠를 보여 운영 사이트와 헷갈리지 않게 한다 (M13). */
export function EnvBanner() {
  const env = process.env.NEXT_PUBLIC_APP_ENV ?? (process.env.VERCEL_ENV === "preview" ? "staging" : "");
  if (env !== "staging") return null;
  return (
    <div className="fixed top-0 left-0 right-0 z-[100] h-[22px] flex items-center justify-center text-[10.5px] tracking-[.24em] font-semibold bg-[#a3402c] text-cream pointer-events-none" aria-label="스테이징 환경">
      STAGING · 테스트 환경 (운영 아님)
    </div>
  );
}
