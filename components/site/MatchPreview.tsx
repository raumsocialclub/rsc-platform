import Image from "next/image";
import { Txt, lines, nowrap } from "@/components/cms/Txt";
import { Badge, ButtonLink, CARD, Container } from "@/components/ui/ds";
import type { DocData } from "@/lib/cms/get";
import { s } from "@/lib/cms/get";
import { PREREG_HREF } from "@/lib/settings/matchPreview";

/** "항목: 내용" 줄 → [항목, 내용] */
function parsePoints(v: string): [string, string][] {
  return lines(v).map((l) => {
    const m = l.match(/^([^:：]{1,16})[:：]\s*(.+)$/);
    return m ? [m[1].trim(), m[2].trim()] : ["", l.trim()];
  });
}

/**
 * 1:1 매칭 사전등록 화면 (settings.site.matchPreview 가 켜진 동안 /matching 전체).
 * 큰 사진 위 짧은 소개 + 「사전등록하기」(→ /match-check?src=prereg) 하나, 아래에 라움 1:1 매칭이 무엇인지 세 줄.
 * 플랜·가입비·진행 방식 등 상세 내용은 모두 숨긴다. 문구는 CMS matching.preview.
 */
export function MatchPreview({ doc }: { doc: DocData }) {
  const image = s(doc, "image") || "/images/after-hours.jpg";
  const points = parsePoints(s(doc, "points"));
  const cta = s(doc, "ctaLabel") || "사전등록하기";
  return (
    <>
      <section id="top" className="pt-[16px] pb-[8px] md:pt-[24px] md:pb-[16px]" data-testid="match-preview">
        <Container wide>
          <div className="relative overflow-hidden rounded-ds bg-inverseBg text-inverseLabel min-h-[520px] md:min-h-[600px] lg:min-h-[640px] flex flex-col anim-zoom">
            <div aria-hidden className="img-live img-live-hero absolute inset-0">
              <Image src={image} alt="" fill priority sizes="(min-width: 1200px) 1200px, 100vw" className="object-cover" unoptimized={image.startsWith("http")} />
              <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,.34)_0%,rgba(0,0,0,.26)_40%,rgba(0,0,0,.78)_100%)]" />
            </div>
            <div className="relative z-10 flex-1 flex flex-col items-center justify-center text-center px-[20px] py-[56px] md:px-[48px] md:py-[80px]">
              {s(doc, "badge") && <Badge tone="inverse" fit className="anim-up mb-[18px] !bg-white/90 !text-label">{s(doc, "badge")}</Badge>}
              {s(doc, "overline") && <div className="anim-up t-eyebrow tracking-[0.14em] text-white/80 mb-[14px]">{s(doc, "overline")}</div>}
              <h1 className="anim-up t-title-1 md:t-display-2 lg:t-display-1 text-white text-pretty max-w-[820px] mb-[18px] md:mb-[22px]"><Txt v={s(doc, "title")} breaks="hard" /></h1>
              <p className="anim-up-2 t-body-2-reading md:t-body-1-reading md:text-[18px] md:leading-[1.65] text-white/85 text-pretty max-w-[620px] mb-[30px] md:mb-[36px]"><Txt v={s(doc, "body")} /></p>
              <div className="anim-up-3 flex flex-col items-center gap-[14px]">
                <ButtonLink href={PREREG_HREF} size="lg" className="min-w-[220px] md:min-w-[260px]">{cta}</ButtonLink>
                {s(doc, "footnote") && <p className="t-caption-1 md:t-label-1 text-white/70 text-pretty max-w-[480px] m-0"><Txt v={s(doc, "footnote")} /></p>}
              </div>
            </div>
          </div>
        </Container>
      </section>

      {points.length > 0 && (
        <section data-fold className="py-[56px] md:py-[96px]">
          <Container>
            {s(doc, "pointsTitle") && <h2 data-reveal className="t-heading-1 md:t-title-3 text-label text-center mb-[28px] md:mb-[36px]">{nowrap(s(doc, "pointsTitle"))}</h2>}
            <div className="grid grid-cols-1 gap-[12px] md:grid-cols-3 md:gap-[16px]">
              {points.map(([k, v], i) => (
                <div key={i} data-reveal style={{ "--d": `${i * 90}ms` } as React.CSSProperties} className={`${CARD} p-[24px] md:p-[28px]`}>
                  <div className="w-[40px] h-[40px] rounded-ds-sm bg-[rgba(var(--ds-primary-rgb),.08)] text-primary flex items-center justify-center t-label-1 font-bold mb-[18px]">{String(i + 1).padStart(2, "0")}</div>
                  {k && <div className="t-heading-2 text-label mb-[8px]">{nowrap(k)}</div>}
                  <div className="t-body-2-reading text-labelAlt text-pretty"><Txt v={v} /></div>
                </div>
              ))}
            </div>
            <div data-reveal className="text-center mt-[32px] md:mt-[40px]">
              <ButtonLink href={PREREG_HREF} variant="outlined" size="lg">{cta}</ButtonLink>
            </div>
          </Container>
        </section>
      )}
    </>
  );
}
