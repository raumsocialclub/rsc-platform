import { Txt, nowrap } from "@/components/cms/Txt";
import { ImageBlock } from "@/components/site/ImageBlock";
import { CARD, CARD_HOVER, Container, SectionHead } from "@/components/ui/ds";
import type { DocData } from "@/lib/cms/get";
import { list } from "@/lib/cms/get";

/** 1:1 매칭 멤버십 회원 전용 행사: RAUM SOCIAL NIGHT · GRAND SOCIAL BALL · RAUM SOLO (CMS home.solo 카드 재사용) */
export function MembersOnly({ doc, eyebrow, title, lead, tone = "white" }: { doc: DocData; eyebrow: string; title: string; lead?: string; tone?: "sand" | "white" }) {
  const cards = list(doc, "cards");
  if (cards.length === 0) return null;
  return (
    <section id="members" data-fold className={`py-[64px] md:py-[112px] ${tone === "sand" ? "bg-sand" : ""}`}>
      <Container>
        <SectionHead eyebrow={eyebrow} title={<Txt v={title} breaks="hard" />} lead={lead ? <Txt v={lead} /> : undefined} reveal />
        <div className="grid grid-cols-1 gap-[16px] md:grid-cols-2 md:gap-[20px] mt-[40px]">
          {cards.map((c, i) => (
            <article key={i} data-reveal style={{ "--d": `${i * 90}ms` } as React.CSSProperties} className={`${CARD} ${CARD_HOVER} overflow-hidden`}>
              <ImageBlock src={c.image} alt={c.title} className="aspect-[16/10]" filter={c.filter || undefined} sizes="(min-width: 761px) 50vw, 100vw" zoom />
              <div className="p-[24px] md:p-[28px]">
                <div className="t-caption-1 font-semibold text-primary mb-[8px] text-pretty">{nowrap(c.label)}</div>
                <h3 className="t-heading-1 text-label mb-[10px]">{c.title}</h3>
                <p className="t-body-2-reading text-labelAlt text-pretty m-0"><Txt v={c.body} /></p>
              </div>
            </article>
          ))}
        </div>
      </Container>
    </section>
  );
}
