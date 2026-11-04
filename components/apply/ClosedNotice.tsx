import Link from "next/link";

/** 설문 링크가 유효하지 않을 때(없음·제출됨·만료·취소) 방문자에게 보이는 안내 */
export function ClosedNotice({ message }: { message: string }) {
  return (
    <div className="w-full max-w-[640px] mx-auto py-[60px]">
      <div className="text-[11px] tracking-[.34em] text-[rgba(33,30,25,.5)] mb-[24px]">RSC PRE-CONSULTATION</div>
      <p className="whitespace-pre-line text-[17px] leading-[1.9] text-[rgba(33,30,25,.75)] mb-[16px]">{message}</p>
      <p className="text-[14px] leading-[1.8] text-[rgba(33,30,25,.55)] mb-[36px]">문의: 02-6925-4786</p>
      <Link href="/" className="inline-flex items-center px-[34px] py-[16px] bg-brown text-cream text-[13.5px] hover:text-cream">홈으로</Link>
    </div>
  );
}
