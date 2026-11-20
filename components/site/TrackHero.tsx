import { Txt } from "@/components/cms/Txt";
import { ImageBlock } from "@/components/site/ImageBlock";
import { Badge, ButtonLink, Container } from "@/components/ui/ds";
import type { DocData } from "@/lib/cms/get";
import { s } from "@/lib/cms/get";

/** 트랙 페이지(/social, /matching) 상단: 왼쪽 글 + 오른쪽 사진 카드 (기존 홈 히어로 레이아웃). */
export function TrackHero({ doc, badge }: { doc: DocData; badge?: string }) {
  return (
    <section id="top" className="pt-[40px] pb-[56px] md:pt-[80px] md:pb-[96px]">
      <Container wide>
        <div className="grid grid-cols-1 gap-[32px] md:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)] md:gap-[48px] lg:gap-[64px] items-center">
          <div className="order-2 md:order-1">
            <Badge tone="primary" fit className="mb-[18px] anim-up">{badge || s(doc, "overline")}</Badge>
            <h1 className="anim-up t-title-1 md:t-display-2 lg:t-display-1 text-label text-pretty mb-[20px] md:mb-[24px]"><Txt v={s(doc, "title")} breaks="hard" /></h1>
            <p className="anim-up-2 t-body-1-reading text-labelAlt text-pretty md:text-[18px] md:leading-[1.6] max-w-[520px] mb-[32px]"><Txt v={s(doc, "body")} /></p>
            <div className="anim-up-3 flex gap-[10px] flex-wrap">
              {s(doc, "cta1Label") && <ButtonLink href={s(doc, "cta1Href")} size="lg">{s(doc, "cta1Label")}</ButtonLink>}
              {s(doc, "cta2Label") && <ButtonLink href={s(doc, "cta2Href")} variant="assistive" size="lg">{s(doc, "cta2Label")}</ButtonLink>}
            </div>
          </div>
          <ImageBlock src={s(doc, "image")} alt="" className="order-1 md:order-2 aspect-[4/3] md:aspect-[4/5] rounded-ds anim-zoom" priority sizes="(min-width: 761px) 50vw, 100vw" />
        </div>
      </Container>
    </section>
  );
}
