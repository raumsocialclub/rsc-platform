import Link from "next/link";
import { Txt, lines } from "@/components/cms/Txt";
import { ImageBlock } from "@/components/site/ImageBlock";
import { ButtonLink, CARD, CARD_HOVER, Container, SectionHead } from "@/components/ui/ds";
import type { DocData } from "@/lib/cms/get";
import { s } from "@/lib/cms/get";

type Card = { key: "social" | "matching"; title: string; desc: string; points: string; image: string; href: string; applyHref: string };

/** "항목: 내용" 줄 → [항목, 내용] */
function parsePoints(v: string): [string, string][] {
  return lines(v).map((l) => {
    const m = l.match(/^([^:：]{1,12})[:：]\s*(.+)$/);
    return m ? [m[1].trim(), m[2].trim()] : ["", l.trim()];
  });
}

/**
 * 홈 「두 가지 방식」 비교 카드. 소셜클럽 / 1:1 매칭 각각 사진 · 한 줄 설명 · 특징 표(대상·방식·주기·관계) · 자세히 보기 · 상담 신청.
 * 문구는 CMS home.tracks, 사진은 home.gate 의 트랙 사진을 같이 쓴다.
 */
export function TrackCards({ doc, gate, lead }: { doc: DocData; gate: DocData; lead: boolean }) {
  const cards: Card[] = [
    { key: "social", title: s(doc, "socialTitle"), desc: s(doc, "socialDesc"), points: s(doc, "socialPoints"), image: s(gate, "socialImage"), href: "/social", applyHref: "/fit-check?track=social" },
    { key: "matching", title: s(doc, "matchingTitle"), desc: s(doc, "matchingDesc"), points: s(doc, "matchingPoints"), image: s(gate, "matchingImage"), href: "/matching", applyHref: "/fit-check?track=matching" },
  ];
  const note = s(doc, "note");
  return (
    <section id="tracks" data-fold className="py-[64px] md:py-[112px] bg-sand">
      <Container>
        <SectionHead eyebrow={s(doc, "label")} title={<Txt v={s(doc, "title")} breaks="hard" />} lead={<Txt v={s(doc, "lead")} />} reveal />
        <div className="grid grid-cols-1 gap-[16px] md:grid-cols-2 md:gap-[20px] mt-[40px]">
          {cards.map((c, i) => (
            <article key={c.key} data-reveal style={{ "--d": `${i * 90}ms` } as React.CSSProperties} className={`${CARD} ${CARD_HOVER} overflow-hidden flex flex-col`}>
              <Link href={c.href} className="block" aria-label={`${c.title} 자세히 보기`}>
                <ImageBlock src={c.image} alt="" className="aspect-[16/9]" sizes="(min-width: 761px) 50vw, 100vw" zoom />
              </Link>
              <div className="p-[24px] md:p-[28px] flex flex-col flex-1">
                <div className="t-caption-1 font-semibold text-primary mb-[8px]">{c.key === "social" ? "01 · SOCIAL CLUB" : "02 · 1:1 MATCHING"}</div>
                <h3 className="t-title-3 text-label mb-[6px]">{c.title}</h3>
                <p className="t-body-2-reading text-labelAlt text-pretty m-0 mb-[18px]"><Txt v={c.desc} /></p>
                <dl className="grid gap-[8px] border-t border-lineAlt pt-[16px] mb-[22px]">
                  {parsePoints(c.points).map(([k, v], j) => (
                    <div key={j} className="grid grid-cols-[56px_minmax(0,1fr)] gap-[10px] t-label-1-reading">
                      <dt className="font-semibold text-labelNeutral">{k}</dt>
                      <dd className="text-labelAlt m-0 text-pretty">{v}</dd>
                    </div>
                  ))}
                </dl>
                <div className="mt-auto flex gap-[8px] flex-wrap">
                  <ButtonLink href={c.href} variant="outlined" size="md">자세히 보기</ButtonLink>
                  <ButtonLink href={c.applyHref} size="md">상담 신청</ButtonLink>
                </div>
              </div>
            </article>
          ))}
        </div>
        {note && !(lead && /\d[\d,]*\s*(원|만원)/.test(note)) && <p data-reveal className="t-label-1-reading text-labelAlt mt-[20px] text-pretty max-w-[720px]"><Txt v={note} /></p>}
      </Container>
    </section>
  );
}
