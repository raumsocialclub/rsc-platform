/**
 * 카카오톡 채널 상담 버튼 (푸터 「제휴문의」 아래, 2026-11-26 사용자 요청).
 * 카카오 브랜드 가이드의 노란 배경(#FEE500) + 검정 글자. href 는 CMS global.brand.kakaoUrl, 문구는 kakaoLabel.
 * href 가 비어 있으면 렌더하지 않는다(채널을 닫거나 링크를 지우면 버튼도 사라짐).
 */
export function KakaoButton({ href, label = "카카오톡 상담", className = "" }: { href?: string; label?: string; className?: string }) {
  if (!href) return null;
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      data-testid="kakao-chat"
      className={`inline-flex items-center gap-[8px] h-[44px] px-[18px] rounded-pill bg-[#FEE500] text-[#191919] text-[15px] font-semibold leading-none transition-[filter,transform] duration-200 hover:brightness-95 active:translate-y-[1px] ${className}`}
    >
      <svg aria-hidden width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 3C6.48 3 2 6.58 2 11c0 2.83 1.86 5.31 4.66 6.73l-.95 3.53c-.08.3.26.54.52.37l4.17-2.77c.52.07 1.05.11 1.6.11 5.52 0 10-3.58 10-7.97S17.52 3 12 3z" />
      </svg>
      {label}
    </a>
  );
}
