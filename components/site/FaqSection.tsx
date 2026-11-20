import { Txt } from "@/components/cms/Txt";
import { JsonLd } from "@/components/seo/JsonLd";
import { CARD, Container, SectionHead } from "@/components/ui/ds";
import { faqJsonLd } from "@/lib/seo/jsonld";

export type FaqItem = { q: string; a: string };

/** 자주 묻는 질문 (홈 · 소셜클럽 · 1:1 매칭 공용). 왼쪽 제목 + 오른쪽 접힘 목록, FAQ 구조화 데이터 포함. */
export function FaqSection({ id = "faq", eyebrow, title, lead, items, tone = "sand" }: { id?: string; eyebrow: string; title: string; lead?: string; items: FaqItem[]; tone?: "sand" | "white" }) {
  if (items.length === 0) return null;
  return (
    <section id={id} data-fold className={`py-[64px] md:py-[112px] ${tone === "sand" ? "bg-sand" : ""}`}>
      <Container>
        <div className="grid grid-cols-1 gap-[32px] md:grid-cols-[minmax(0,1fr)_minmax(0,2fr)] md:gap-[64px] items-start">
          <SectionHead eyebrow={eyebrow} title={<Txt v={title} breaks="hard" />} lead={lead ? <Txt v={lead} /> : undefined} reveal />
          <div data-reveal className={`${CARD} px-[20px] md:px-[28px]`}>
            {items.map((it, i) => (
              <details key={i} className="group border-b border-lineAlt last:border-b-0">
                <summary className="flex items-start justify-between gap-[16px] cursor-pointer list-none py-[18px] md:py-[22px] [&::-webkit-details-marker]:hidden -mx-[8px] px-[8px] rounded-ds-sm transition-colors hover:bg-fillAlt">
                  <span className="t-headline-2 text-label text-pretty transition-colors group-hover:text-primary group-open:text-primary">{it.q}</span>
                  <svg aria-hidden width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="flex-none text-labelAssist mt-[2px] transition-transform group-open:rotate-180"><path d="M6 9l6 6 6-6" /></svg>
                </summary>
                <div className="faq-body t-body-2-reading text-labelNeutral pb-[22px] md:pr-[36px] text-pretty"><Txt v={it.a} breaks="hard" /></div>
              </details>
            ))}
          </div>
        </div>
      </Container>
      <JsonLd data={faqJsonLd(items)} />
    </section>
  );
}
