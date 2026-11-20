import { Txt, nowrap } from "@/components/cms/Txt";
import type { DocData } from "@/lib/cms/get";
import { list, on, s } from "@/lib/cms/get";

export type Criterion = { title: string; standard: string; docs: string };

/**
 * 멤버 기준표 (2026-11-20, 사용자 요청). 가입 심사 섹션 아래에 항목(전문직 · 공공·교육 · …)을 한 줄씩 두고
 * 오른쪽 「기준보기」를 누르면 세부 기준과 제출 서류가 펼쳐진다 (details/summary — 자바스크립트 없이도 동작).
 * 아직 인증 기능은 없으므로 버튼은 「인증하기」가 아니라 「기준보기」. 문구·항목은 CMS social.verify(criteria*).
 */
export function MemberCriteria({ doc }: { doc: DocData }) {
  const items = list<Criterion>(doc, "criteria").filter((c) => c.title && (c.standard || c.docs));
  if (!on(doc, "criteriaVisible") || items.length === 0) return null;
  const button = s(doc, "criteriaButton") || "기준보기";
  return (
    <div data-reveal className="mt-[40px] md:mt-[56px]" data-testid="member-criteria">
      {(s(doc, "criteriaTitle") || s(doc, "criteriaLead")) && (
        <div className="mb-[18px] md:mb-[22px] max-w-[720px]">
          {s(doc, "criteriaTitle") && <h3 className="t-heading-1 md:t-title-3 text-label mb-[8px]">{nowrap(s(doc, "criteriaTitle"))}</h3>}
          {s(doc, "criteriaLead") && <p className="t-body-2-reading md:t-body-1-reading text-labelAlt text-pretty m-0"><Txt v={s(doc, "criteriaLead")} /></p>}
        </div>
      )}
      <div className="bg-white border border-lineAlt rounded-ds overflow-hidden">
        {items.map((c, i) => (
          <details key={i} className="group border-b border-lineAlt last:border-b-0">
            <summary className="flex items-center justify-between gap-[14px] cursor-pointer list-none px-[18px] py-[16px] md:px-[28px] md:py-[20px] [&::-webkit-details-marker]:hidden hover:bg-sand/60 transition-colors">
              <span className="t-headline-2 md:t-heading-2 text-label text-pretty min-w-0">{nowrap(c.title)}</span>
              <span aria-hidden className="flex-none inline-flex items-center gap-[6px] h-[38px] md:h-[40px] px-[16px] md:px-[18px] rounded-pill border border-lineNeutral bg-white t-label-1 font-semibold text-labelNeutral transition-[color,border-color,background-color] group-hover:border-primary group-hover:text-primary group-open:bg-primary group-open:border-primary group-open:text-white">
                <span className="group-open:hidden">{button}</span>
                <span className="hidden group-open:inline">닫기</span>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="transition-transform group-open:rotate-180"><path d="M6 9l6 6 6-6" /></svg>
              </span>
            </summary>
            <div className="px-[18px] pb-[20px] md:px-[28px] md:pb-[24px] -mt-[2px]">
              <dl className="grid gap-[12px] md:grid-cols-[88px_minmax(0,1fr)] md:gap-x-[20px] md:gap-y-[12px] bg-sand rounded-ds-sm p-[16px] md:p-[20px]">
                {c.standard && (
                  <>
                    <dt className="t-label-1 font-semibold text-primary md:pt-[2px]">기준</dt>
                    <dd className="t-body-2-reading text-labelNeutral text-pretty m-0"><Txt v={c.standard} breaks="hard" /></dd>
                  </>
                )}
                {c.docs && (
                  <>
                    <dt className="t-label-1 font-semibold text-primary md:pt-[2px]">제출 서류</dt>
                    <dd className="t-body-2-reading text-labelNeutral text-pretty m-0"><Txt v={c.docs} breaks="hard" /></dd>
                  </>
                )}
              </dl>
            </div>
          </details>
        ))}
      </div>
      {s(doc, "criteriaNote") && <p className="t-label-1-reading text-labelAlt mt-[14px] text-pretty max-w-[760px]"><Txt v={s(doc, "criteriaNote")} /></p>}
    </div>
  );
}
