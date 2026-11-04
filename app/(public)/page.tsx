import type { Metadata } from "next";
import Link from "next/link";
import { Header } from "@/components/site/Header";
import { SiteFooter } from "@/components/site/SiteFooter";
import { UpButton } from "@/components/site/UpButton";
import { ImageBlock } from "@/components/site/ImageBlock";
import { SitePopups } from "@/components/site/SitePopups";
import { listLivePopups } from "@/lib/popups/queries";
import { Txt } from "@/components/cms/Txt";
import { getPageDocs, list, on, s } from "@/lib/cms/get";
import { JsonLd } from "@/components/seo/JsonLd";
import { pageMetadata } from "@/lib/seo/get";
import { faqJsonLd } from "@/lib/seo/jsonld";
import { getSettings } from "@/lib/settings/get";
import { hasPrice } from "@/lib/settings/leadMode";
import { Badge, ButtonLink, CARD, CARD_HOVER, Container, SectionHead, SWIPE, SWIPE_ITEM } from "@/components/ui/ds";

export async function generateMetadata(): Promise<Metadata> {
  return pageMetadata("home");
}

/* ---------- 공통 조각 (Design.md: Wanted DS) ---------- */
const SECTION = "py-[64px] md:py-[112px]";
const BODY = "t-body-1-reading text-labelAlt text-pretty";
/** "01  /  NEW DEFINITION" 형태의 CMS 라벨 → "NEW DEFINITION" 만 쓴다 (번호는 디자인에서 뺌) */
const eyebrow = (v: string) => (v.includes("/") ? v.split("/").slice(1).join("/").trim() : v.trim());

/**
 * 메인 페이지. 모든 문구·사진은 CMS(site_content home.*) — 기본값은 lib/cms/schema.ts
 * 리드 모드(일반 설정)면 07 멤버십 섹션과 금액이 들어간 FAQ 를 숨긴다.
 */
export default async function HomePage() {
  const [d, settings, popups] = await Promise.all([getPageDocs("home"), getSettings(), listLivePopups()]);
  const lead = settings.leadMode;
  const hero = d["home.hero"], about = d["home.about"], why = d["home.why"], promise = d["home.promise"], social = d["home.social"], solo = d["home.solo"], spaces = d["home.spaces"], mem = d["home.membership"], faq = d["home.faq"];
  const faqItems = list<{ q: string; a: string }>(faq, "items").filter((x) => x.q && x.a).filter((x) => !lead || !hasPrice(x.q + x.a));
  const showFaq = on(faq, "visible") && faqItems.length > 0;
  const showMembership = on(mem, "visible") && !lead;

  return (
    <div className="pt-[56px] md:pt-[64px]">
      <Header />

      {/* HERO: 흰 배경, 왼쪽 글 + 오른쪽 사진 카드 */}
      <section id="top" className="pt-[40px] pb-[56px] md:pt-[80px] md:pb-[96px]">
        <Container wide>
          <div className="grid grid-cols-1 gap-[32px] md:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)] md:gap-[48px] lg:gap-[64px] items-center">
            <div className="order-2 md:order-1">
              <Badge tone="primary" className="mb-[18px] anim-up">{s(hero, "overline")}</Badge>
              <h1 className="anim-up t-title-1 md:t-display-2 lg:t-display-1 text-label text-pretty mb-[20px] md:mb-[24px]"><Txt v={s(hero, "title")} breaks="hard" /></h1>
              <p className={`anim-up-2 ${BODY} md:text-[18px] md:leading-[1.6] max-w-[520px] mb-[32px]`}><Txt v={s(hero, "body")} /></p>
              <div className="anim-up-3 flex gap-[10px] flex-wrap">
                {s(hero, "cta1Label") && <ButtonLink href={s(hero, "cta1Href")} size="lg">{s(hero, "cta1Label")}</ButtonLink>}
                {s(hero, "cta2Label") && <ButtonLink href={s(hero, "cta2Href")} variant="assistive" size="lg">{s(hero, "cta2Label")}</ButtonLink>}
              </div>
            </div>
            <ImageBlock src={s(hero, "image")} alt="" className="order-1 md:order-2 aspect-[4/3] md:aspect-[4/5] rounded-ds anim-zoom" priority sizes="(min-width: 761px) 50vw, 100vw" />
          </div>
        </Container>
      </section>

      {/* 01 NEW DEFINITION */}
      {on(about, "visible") && (
        <section id="about" className={`${SECTION} border-t border-lineAlt`}>
          <Container>
            <div className="grid grid-cols-1 gap-[32px] md:grid-cols-2 md:gap-[64px] items-center">
              <div data-reveal>
                <SectionHead eyebrow={eyebrow(s(about, "label"))} title={s(about, "title")} />
                <p className={`${BODY} mt-[24px]`}><Txt v={s(about, "p1")} breaks="hard" /></p>
                <p className={`${BODY} mt-[14px]`}><Txt v={s(about, "p2")} /></p>
                <blockquote className="mt-[28px] border-l-[3px] border-primary pl-[18px] t-headline-2 text-label text-pretty"><Txt v={s(about, "quote")} /></blockquote>
              </div>
              <ImageBlock src={s(about, "image")} alt="라움의 공간" className="aspect-[4/3] md:aspect-[4/5] rounded-ds" reveal sizes="(min-width: 761px) 50vw, 100vw" />
            </div>
          </Container>
        </section>
      )}

      {/* 02 POSITIONING */}
      {on(why, "visible") && (
        <section id="why" className={`${SECTION} bg-sand`}>
          <Container>
            <SectionHead eyebrow={eyebrow(s(why, "label"))} title={<Txt v={s(why, "title")} breaks="hard" />} lead={<Txt v={s(why, "lead")} />} reveal />
            <div className="grid grid-cols-1 gap-[12px] md:grid-cols-3 md:gap-[16px] mt-[40px]">
              {list(why, "items").map((c, i) => (
                <div key={i} data-reveal style={{ "--d": `${i * 90}ms` } as React.CSSProperties} className={`${CARD} ${CARD_HOVER} p-[24px] md:p-[28px]`}>
                  <div className="t-label-1 font-semibold text-primary mb-[12px]">{c.label}</div>
                  <div className="t-body-2-reading text-labelNeutral text-pretty"><Txt v={c.text} /></div>
                </div>
              ))}
            </div>
            <p data-reveal className="t-headline-1 text-label max-w-[720px] mt-[40px] text-pretty"><Txt v={s(why, "closing")} /></p>
          </Container>
        </section>
      )}

      {/* 03 BRAND PROMISE */}
      {on(promise, "visible") && (
        <section id="promise" className={SECTION}>
          <Container>
            <SectionHead eyebrow={eyebrow(s(promise, "label"))} title={<Txt v={s(promise, "title")} breaks="hard" />} reveal />
            <div className="grid grid-cols-1 gap-[12px] md:grid-cols-3 md:gap-[16px] mt-[40px]">
              {list(promise, "items").map((c, i) => (
                <div key={i} data-reveal style={{ "--d": `${i * 90}ms` } as React.CSSProperties} className={`${CARD} ${CARD_HOVER} p-[24px] md:p-[28px]`}>
                  <div className="w-[40px] h-[40px] rounded-ds-sm bg-[rgba(0,102,255,.08)] text-primary flex items-center justify-center t-label-1 font-bold mb-[20px]">{String(i + 1).padStart(2, "0")}</div>
                  <div className="t-caption-1 font-semibold text-labelAlt mb-[6px]">{c.label}</div>
                  <div className="t-heading-2 text-label mb-[10px]">{c.title}</div>
                  <div className="t-body-2-reading text-labelAlt text-pretty"><Txt v={c.body} /></div>
                </div>
              ))}
            </div>
          </Container>
        </section>
      )}

      {/* 04 RSC SOCIAL */}
      {on(social, "visible") && (
        <section id="social" className={`${SECTION} bg-sand`}>
          <Container>
            <SectionHead eyebrow={eyebrow(s(social, "label"))} title={<Txt v={s(social, "title")} breaks="hard" />} lead={<Txt v={s(social, "lead")} />} reveal />
            <div className="md:hidden mt-[24px] t-caption-1 text-labelAssist">옆으로 밀어서 보기 →</div>
            <div className={`${SWIPE} mt-[12px] md:grid-cols-3 md:gap-[20px] md:mt-[40px]`}>
              {list(social, "items").map((c, i) => (
                <article key={i} data-reveal style={{ "--d": `${(i % 3) * 90}ms` } as React.CSSProperties} className={`${SWIPE_ITEM} ${CARD} ${CARD_HOVER} overflow-hidden`}>
                  <ImageBlock src={c.image} alt={c.title} className="aspect-[4/3]" filter={c.filter || undefined} sizes="(min-width: 761px) 33vw, 82vw" zoom />
                  <div className="p-[20px] md:p-[24px]">
                    <div className="t-caption-1 font-semibold text-primary mb-[8px]">{c.cat}</div>
                    <h3 className="t-heading-2 text-label mb-[8px]">{c.title}</h3>
                    <p className="t-body-2-reading text-labelAlt text-pretty m-0"><Txt v={c.desc} /></p>
                  </div>
                </article>
              ))}
            </div>
          </Container>
        </section>
      )}

      {/* 05 MONTHLY & SEASON */}
      {on(solo, "visible") && (
        <section id="solo" className={SECTION}>
          <Container>
            <SectionHead eyebrow={eyebrow(s(solo, "label"))} title={list(solo, "cards").length ? "매달, 그리고 시즌마다" : ""} reveal />
            <div className="grid grid-cols-1 gap-[16px] md:grid-cols-2 md:gap-[20px] mt-[40px]">
              {list(solo, "cards").map((c, i) => (
                <article key={i} data-reveal style={{ "--d": `${i * 90}ms` } as React.CSSProperties} className={`${CARD} ${CARD_HOVER} overflow-hidden`}>
                  <ImageBlock src={c.image} alt={c.title} className="aspect-[16/10]" filter={c.filter || undefined} sizes="(min-width: 761px) 50vw, 100vw" zoom />
                  <div className="p-[24px] md:p-[28px]">
                    <div className="t-caption-1 font-semibold text-primary mb-[8px]">{c.label}</div>
                    <h3 className="t-heading-1 text-label mb-[10px]">{c.title}</h3>
                    <p className="t-body-2-reading text-labelAlt text-pretty m-0"><Txt v={c.body} /></p>
                  </div>
                </article>
              ))}
            </div>
          </Container>
        </section>
      )}

      {/* 06 MOMENTS */}
      {on(spaces, "visible") && (
        <section id="spaces" className={`${SECTION} bg-sand`}>
          <Container>
            <SectionHead eyebrow={eyebrow(s(spaces, "label"))} title={s(spaces, "title")} lead={<Txt v={s(spaces, "lead")} breaks="hard" />} reveal />
            <div className="md:hidden mt-[24px] t-caption-1 text-labelAssist">옆으로 밀어서 보기 →</div>
            <div className={`${SWIPE} mt-[12px] md:grid-cols-2 md:gap-[24px] md:mt-[40px]`}>
              {list(spaces, "items").map((c, i) => (
                <article key={i} data-reveal style={{ "--d": `${(i % 2) * 90}ms` } as React.CSSProperties} className={`${SWIPE_ITEM} group min-w-0`}>
                  {c.image ? (
                    <ImageBlock src={c.image} alt={c.alt || c.title} className="aspect-square rounded-ds" focus={c.position || undefined} sizes="(min-width: 761px) 50vw, 82vw" zoom />
                  ) : (
                    <div className="aspect-square rounded-ds bg-fill" aria-hidden />
                  )}
                  <div className="pt-[16px]">
                    <div className="t-caption-1 font-semibold text-labelAssist mb-[6px]">{c.n}</div>
                    <h3 className="t-heading-2 text-label mb-[6px] text-pretty">{c.title}</h3>
                    <p className="t-body-2-reading text-labelAlt text-pretty m-0"><Txt v={c.desc} /></p>
                    {c.note && <div className="t-caption-1 text-labelAssist mt-[8px]">{c.note}</div>}
                  </div>
                </article>
              ))}
            </div>
            {s(spaces, "ctaLabel") && s(spaces, "ctaHref") && (
              <div className="mt-[40px]" data-reveal><ButtonLink href={s(spaces, "ctaHref")} variant="outlined" size="lg">{s(spaces, "ctaLabel")}</ButtonLink></div>
            )}
          </Container>
        </section>
      )}

      {/* 07 MEMBERSHIP (리드 모드면 숨김) */}
      {showMembership && (
        <section id="membership" className={SECTION}>
          <Container>
            <div className="grid grid-cols-1 gap-[32px] md:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)] md:gap-[64px] items-center mb-[48px]">
              <ImageBlock src={s(mem, "image")} alt="RAUM" className="aspect-[4/3] rounded-ds" sizes="(min-width: 761px) 55vw, 100vw" reveal />
              <div data-reveal>
                <SectionHead eyebrow={eyebrow(s(mem, "label"))} title={<Txt v={s(mem, "title")} breaks="hard" />} lead={<Txt v={s(mem, "body")} />} />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-[12px] mt-[28px]">
                  {[{ href: s(mem, "link1Href") || "/pricing", label: s(mem, "link1Label"), k: "MEMBERSHIP" }, { href: s(mem, "link2Href") || "/benefits", label: s(mem, "link2Label"), k: "BENEFITS" }].map((l) => (
                    <Link key={l.k} href={l.href} className={`${CARD} ${CARD_HOVER} p-[20px] block`}>
                      <div className="t-caption-1 font-semibold text-primary mb-[8px]">{l.k}</div>
                      <div className="t-headline-2 text-label flex justify-between items-center gap-[8px]">{l.label}<span className="text-labelAssist transition-[transform,color] duration-300 group-hover:translate-x-[4px] group-hover:text-primary">→</span></div>
                    </Link>
                  ))}
                </div>
                <div className="flex gap-[10px] flex-wrap mt-[24px]">
                  {s(mem, "cta1Label") && <ButtonLink href={s(mem, "cta1Href")} size="lg">{s(mem, "cta1Label")}</ButtonLink>}
                  {s(mem, "cta2Label") && <ButtonLink href={s(mem, "cta2Href")} variant="assistive" size="lg">{s(mem, "cta2Label")}</ButtonLink>}
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-[12px] md:grid-cols-4 md:gap-[16px]">
              {list(mem, "values").map((v, i) => (
                <div key={i} data-reveal style={{ "--d": `${i * 70}ms` } as React.CSSProperties} className="bg-sand rounded-ds p-[20px] transition-colors hover:bg-sandDeep">
                  <div className="t-caption-1 font-semibold text-labelAlt mb-[8px]">{v.label}</div>
                  <div className="t-body-2 font-medium text-label"><Txt v={v.text} breaks="hard" /></div>
                </div>
              ))}
            </div>
          </Container>
        </section>
      )}

      {/* 08 FAQ */}
      {showFaq && (
        <section id="faq" className={`${SECTION} bg-sand`}>
          <Container>
            <div className="grid grid-cols-1 gap-[32px] md:grid-cols-[minmax(0,1fr)_minmax(0,2fr)] md:gap-[64px] items-start">
              <SectionHead eyebrow={eyebrow(s(faq, "label"))} title={<Txt v={s(faq, "title")} breaks="hard" />} lead={<Txt v={s(faq, "lead")} />} reveal />
              <div data-reveal className={`${CARD} px-[20px] md:px-[28px]`}>
                {faqItems.map((it, i) => (
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
          <JsonLd data={faqJsonLd(faqItems)} />
        </section>
      )}

      {/* CTA 띠 */}
      <section className="py-[64px] md:py-[96px]">
        <Container>
          <div data-reveal className="bg-inverseBg rounded-ds px-[24px] py-[40px] md:px-[56px] md:py-[64px] text-center">
            <h2 className="t-title-3 md:t-title-1 text-inverseLabel text-pretty mb-[12px]">상담으로 시작해 보세요</h2>
            <p className="t-body-1-reading text-[rgba(247,247,248,.7)] max-w-[520px] mx-auto mb-[28px] text-pretty"><Txt v="이름과 연락처만 남기면 담당자가 직접 연락드립니다. 가입이 아닌 상담 신청이며, 비용은 없습니다." /></p>
            <ButtonLink href="/fit-check" size="lg">RSC 상담 신청</ButtonLink>
          </div>
        </Container>
      </section>

      <SiteFooter />
      <UpButton />
      {popups.length > 0 && <SitePopups popups={popups} />}
    </div>
  );
}
