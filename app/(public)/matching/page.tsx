import type { Metadata } from "next";
import { Header } from "@/components/site/Header";
import { SiteFooter } from "@/components/site/SiteFooter";
import { UpButton } from "@/components/site/UpButton";
import { ImageBlock } from "@/components/site/ImageBlock";
import { TrackHero } from "@/components/site/TrackHero";
import { TrackSwitch } from "@/components/site/TrackSwitch";
import { FaqSection } from "@/components/site/FaqSection";
import { CtaBand } from "@/components/site/CtaBand";
import { Txt, lines } from "@/components/cms/Txt";
import { getPageDocs, list, on, s } from "@/lib/cms/get";
import { pageMetadata } from "@/lib/seo/get";
import { getSettings } from "@/lib/settings/get";
import { hasPrice } from "@/lib/settings/leadMode";
import { ButtonLink, CARD, CARD_HOVER, Container, SectionHead } from "@/components/ui/ds";

export async function generateMetadata(): Promise<Metadata> {
  return pageMetadata("matching");
}

const SECTION = "py-[64px] md:py-[112px]";
type ProgramRow = { name: string; sub: string; price: string; priceSub: string; unit: string; desc: string };

/**
 * 1:1 매칭 트랙 페이지. 상단 소개 → 01 진행 방식(4단계) → 02 다른 점 → 프로그램(가격 안내의 CONNECTION · RAUM MERRY 행을 재사용, 리드 모드면 금액 숨김) → 03 이런 분께 → 04 FAQ → CTA.
 * 문구는 CMS(matching.* + pricing.programs). 모든 상담 버튼은 /fit-check?track=matching.
 */
export default async function MatchingPage() {
  const [d, settings] = await Promise.all([getPageDocs(["matching", "pricing"]), getSettings()]);
  const lead = settings.leadMode;
  const hero = d["matching.hero"], how = d["matching.how"], diff = d["matching.diff"], who = d["matching.who"], faq = d["matching.faq"];
  const programs = list<ProgramRow>(d["pricing.programs"], "rows").filter((r) => /CONNECTION|MERRY/i.test(r.name));
  const faqItems = list<{ q: string; a: string }>(faq, "items").filter((x) => x.q && x.a).filter((x) => !lead || !hasPrice(x.q + x.a));

  return (
    <div className="pt-[56px] md:pt-[64px]">
      <Header />
      <TrackSwitch current="matching" />
      <TrackHero doc={hero} />

      {/* 01 HOW IT WORKS */}
      {on(how, "visible") && (
        <section id="how" data-fold className={`${SECTION} bg-sand`}>
          <Container>
            <SectionHead eyebrow={s(how, "label")} title={<Txt v={s(how, "title")} breaks="hard" />} lead={<Txt v={s(how, "lead")} />} reveal />
            <ol className="grid grid-cols-1 gap-[12px] md:grid-cols-4 md:gap-[16px] mt-[40px] list-none p-0 m-0">
              {list(how, "steps").map((st, i) => (
                <li key={i} data-reveal style={{ "--d": `${i * 90}ms` } as React.CSSProperties} className={`${CARD} ${CARD_HOVER} p-[24px] md:p-[28px] relative`}>
                  <div className="flex items-center gap-[10px] mb-[16px]">
                    <span className="w-[40px] h-[40px] rounded-full bg-primary text-white flex items-center justify-center t-label-1 font-bold">{String(i + 1).padStart(2, "0")}</span>
                    {i < list(how, "steps").length - 1 && <span aria-hidden className="hidden md:block flex-1 h-px bg-lineNeutral" />}
                  </div>
                  <h3 className="t-heading-2 text-label mb-[8px]">{st.title}</h3>
                  <p className="t-body-2-reading text-labelAlt text-pretty m-0"><Txt v={st.body} /></p>
                </li>
              ))}
            </ol>
          </Container>
        </section>
      )}

      {/* 02 WHY RSC */}
      {on(diff, "visible") && (
        <section id="why" data-fold className={SECTION}>
          <Container>
            <SectionHead eyebrow={s(diff, "label")} title={<Txt v={s(diff, "title")} breaks="hard" />} reveal />
            <div className="grid grid-cols-1 gap-[12px] md:grid-cols-3 md:gap-[16px] mt-[40px]">
              {list(diff, "items").map((c, i) => (
                <div key={i} data-reveal style={{ "--d": `${i * 90}ms` } as React.CSSProperties} className={`${CARD} ${CARD_HOVER} p-[24px] md:p-[28px]`}>
                  <div className="t-caption-1 font-semibold text-primary mb-[8px]">{c.label}</div>
                  <div className="t-heading-2 text-label mb-[10px]">{c.title}</div>
                  <div className="t-body-2-reading text-labelAlt text-pretty"><Txt v={c.body} /></div>
                </div>
              ))}
            </div>
          </Container>
        </section>
      )}

      {/* PROGRAMS (가격 안내 CONNECTION · RAUM MERRY 재사용) */}
      {programs.length > 0 && (
        <section id="programs" data-fold className={`${SECTION} bg-sand`}>
          <Container>
            <SectionHead eyebrow="PROGRAMS" title={<Txt v={"깊이에 따라 고르는\n네 가지 소개 프로그램"} breaks="hard" />} lead={lead ? "구성과 비용은 상담에서 자세히 안내해 드립니다. 실제로 만난 경우에만 1회로 셉니다." : "실제로 만난 경우에만 1회로 세며, 교제·성혼을 보장하지 않고 성혼비는 없습니다. 모든 금액은 VAT 포함입니다."} reveal />
            <div className="grid grid-cols-1 gap-[12px] md:grid-cols-2 md:gap-[16px] mt-[40px]">
              {programs.map((r, i) => (
                <article key={i} data-reveal style={{ "--d": `${i * 90}ms` } as React.CSSProperties} className={`${CARD} ${CARD_HOVER} p-[24px] md:p-[28px] flex flex-col`}>
                  <div className="t-caption-1 font-semibold text-primary mb-[8px]">{/MERRY/i.test(r.name) ? "FLAGSHIP" : `CONNECTION · ${String(i + 1).padStart(2, "0")}`}</div>
                  <h3 className="t-heading-1 text-label mb-[4px]">{r.name}</h3>
                  {r.sub && <div className="t-label-1 text-labelAlt mb-[8px]">{r.sub}</div>}
                  <p className="t-body-2-reading text-labelAlt text-pretty m-0 mb-[16px]"><Txt v={r.desc} /></p>
                  <div className="mt-auto pt-[16px] border-t border-lineAlt flex items-baseline justify-between gap-[12px] flex-wrap">
                    <span className="t-label-1 text-labelNeutral">{r.unit}</span>
                    {!lead && r.price && <span className="t-headline-1 text-label">{r.price}</span>}
                  </div>
                </article>
              ))}
            </div>
            {!lead && <div className="mt-[28px]" data-reveal><ButtonLink href="/pricing#programs" variant="outlined" size="md">전체 가격 안내 보기</ButtonLink></div>}
          </Container>
        </section>
      )}

      {/* 03 WHO IT'S FOR */}
      {on(who, "visible") && (
        <section id="who" data-fold className={SECTION}>
          <Container>
            <div className="grid grid-cols-1 gap-[32px] md:grid-cols-2 md:gap-[64px] items-center">
              <ImageBlock src={s(who, "image")} alt="" className="aspect-[4/3] md:aspect-[4/5] rounded-ds order-1" reveal sizes="(min-width: 761px) 50vw, 100vw" />
              <div data-reveal className="order-2">
                <SectionHead eyebrow={s(who, "label")} title={<Txt v={s(who, "title")} breaks="hard" />} />
                <ul className="list-none p-0 m-0 mt-[28px] grid gap-[12px]">
                  {lines(s(who, "points")).map((p, i) => (
                    <li key={i} className="flex gap-[12px] items-start t-body-1-reading text-labelNeutral text-pretty">
                      <span aria-hidden className="w-[24px] h-[24px] rounded-full bg-[rgba(0,102,255,.1)] text-primary flex items-center justify-center flex-none mt-[1px]"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12l5 5L20 7" /></svg></span>
                      <span>{p}</span>
                    </li>
                  ))}
                </ul>
                <div className="mt-[32px]"><ButtonLink href="/fit-check?track=matching" size="lg">1:1 매칭 상담 신청</ButtonLink></div>
              </div>
            </div>
          </Container>
        </section>
      )}

      {on(faq, "visible") && <FaqSection eyebrow={s(faq, "label")} title={s(faq, "title")} lead={s(faq, "lead")} items={faqItems} />}

      <CtaBand track="matching" title="1:1 매칭, 상담으로 시작해 보세요" body="이름과 연락처만 남기면 전담 디렉터가 직접 연락드립니다. 가입이 아닌 상담 신청이며, 비용은 없습니다." />

      <SiteFooter />
      <UpButton />
    </div>
  );
}
