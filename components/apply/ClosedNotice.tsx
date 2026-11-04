import { ButtonLink } from "@/components/ui/ds";
import { Txt } from "@/components/cms/Txt";

/** 설문 링크가 유효하지 않을 때(없음·만료·취소) 방문자에게 보이는 안내 */
export function ClosedNotice({ message }: { message: string }) {
  return (
    <div className="w-full max-w-[560px] mx-auto bg-white border border-lineAlt rounded-ds p-[24px] md:p-[40px] text-center anim-up">
      <div className="w-[56px] h-[56px] rounded-full bg-fill text-labelAlt flex items-center justify-center mx-auto mb-[20px]">
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="10" width="16" height="11" rx="2" /><path d="M8 10V7a4 4 0 0 1 8 0v3" /></svg>
      </div>
      <h1 className="t-title-3 text-label mb-[10px]">설문을 열 수 없습니다</h1>
      <p className="t-body-1-reading text-labelAlt mb-[8px] text-pretty"><Txt v={message} breaks="hard" /></p>
      <p className="t-label-1 text-labelAlt mb-[28px]">문의: 02-6925-4786</p>
      <ButtonLink href="/" variant="assistive" size="lg">홈으로</ButtonLink>
    </div>
  );
}
