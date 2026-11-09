import type { Metadata } from "next";
import { Header } from "@/components/site/Header";
import { SiteFooter } from "@/components/site/SiteFooter";
import { UpButton } from "@/components/site/UpButton";
import { ImageBlock } from "@/components/site/ImageBlock";
import { TrackHero } from "@/components/site/TrackHero";
import { TrackSwitch } from "@/components/site/TrackSwitch";
import { FaqSection } from "@/components/site/FaqSection";
import { VerifySection } from "@/components/site/VerifySection";
import { CtaBand } from "@/components/site/CtaBand";
import { Txt, nowrap } from "@/components/cms/Txt";
import { getPageDocs, list, on, s } from "@/lib/cms/get";
import { pageMetadata } from "@/lib/seo/get";
import { hasPrice } from "@/lib/settings/leadMode";
import { ButtonLink, CARD, CARD_HOVER, Container, SectionHead, SWIPE, SWIPE_ITEM } from "@/components/ui/ds";

export async function generateMetadata(): Promise<Metadata> {
  return pageMetadata("social");
}

const SECTION = "py-[64px] md:py-[112px]";
const eyebrow = (v: string) => (v.includes("/") ? v.split("/").slice(1).join("/").trim() : v.trim());

/**
 * 소셜클럽 트랙 페이지 (사업전략 2026.11.03: 가입비 멤버십 = 회원 자격 + 행사 6회 + 초대권 2매, 결혼중개 아님).
 * 상단 소개 → 01 멤버십 구성(social.membership — 금액은 비공개, 대면 상담 안내) → 02 포지셔닝 → 04 TASTE SOCIAL 프로그램 → 06 MOMENTS → 가입 심사(matching.verify 공용) → FAQ → CTA.
 * SOCIAL NIGHT · RAUM SOLO 는 1:1 매칭 멤버십 전용이라 /matching 으로 옮겼다. 모든 상담 버튼은 /fit-check?track=social.
 */
export default async function SocialPage() {
  const d = await getPageDocs(["home", "social", "matching"]);
  const hero = d["social.hero"], membership = d["social.membership"], verify = d["matching.verify"], why = d["home.why"], social = d["home.social"], spaces = d["home.spaces"], faq = d["home.faq"], cta = d["social.cta"], gate = d["home.gate"];
  const switchLabels = { socialLabel: s(gate, "tabSocial"), socialSub: s(gate, "tabSocialSub"), matchingLabel: s(gate, "tabMatching"), matchingSub: s(gate, "tabMatchingSub") };
  const memberItems = list<{ label: string; title: string; body: string }>(membership, "items");
  const memberNote = s(membership, "note");
  const faqItems = list<{ q: string; a: string }>(faq, "items").filter((x) => x.q && x.a).filter((x) => !hasPrice(x.q + x.a)); // 금액은 비공개(대면 상담 안내)

  return (
    <div className="pt-[56px] md:pt-[64px]">
      <Header />
      <TrackSwitch current="social" labels={switchLabels} />
      <TrackHero doc={hero} />

      {/* 01 SOCIAL CLUB MEMBERSHIP */}
      {on(membership, "visible") && memberItems.length > 0 && (
        <section id="membership" data-fold className={`${SECTION} bg-sand`}>
          <Container>
            <SectionHead eyebrow={s(membership, "label")} title={<Txt v={s(membership, "title")} breaks="hard" />} lead={<Txt v={s(membership, "lead")} />} reveal />
            <div className="grid grid-cols-1 gap-[10px] md:grid-cols-4 md:gap-[16px] mt-[32px] md:mt-[40px]">
              {memberItems.map((c, i) => (
                <div key={i} data-reveal style={{ "--d": `${i * 90}ms` } as React.CSSProperties} className={`${CARD} ${CARD_HOVER} p-[20px] md:p-[28px]`}>
                  <div className="t-caption-1 font-semibold text-primary mb-[6px] md:mb-[8px]">{c.label}</div>
                  <div className="t-headline-1 md:t-heading-2 text-label mb-[8px] md:mb-[10px] text-pretty">{nowrap(c.title)}</div>
                  <div className="t-body-2-reading text-labelAlt text-pretty"><Txt v={c.body} /></div>
                </div>
              ))}
            </div>
            {memberNote && !hasPrice(memberNote) && <p data-reveal className="t-label-1-reading text-labelAlt mt-[20px] text-pretty max-w-[800px]"><Txt v={memberNote} /></p>}
          </Container>
        </section>
      )}

      {/* 02 POSITIONING */}
      {on(why, "visible") && (
        <section id="why" data-fold className={SECTION}>
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

      {/* 04 RSC SOCIAL */}
      {on(social, "visible") && (
        <section id="social" data-fold className={`${SECTION} bg-sand`}>
          <Container>
            <SectionHead eyebrow={eyebrow(s(social, "label"))} title={<Txt v={s(social, "title")} breaks="hard" />} lead={<Txt v={s(social, "lead")} />} reveal />
            {s(social, "swipeHint") && <div className="md:hidden mt-[24px] t-caption-1 text-labelAssist">{s(social, "swipeHint")}</div>}
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

      {/* 06 MOMENTS */}
      {on(spaces, "visible") && (
        <section id="spaces" data-fold className={SECTION}>
          <Container>
            <SectionHead eyebrow={eyebrow(s(spaces, "label"))} title={s(spaces, "title")} lead={<Txt v={s(spaces, "lead")} breaks="hard" />} reveal />
            {s(spaces, "swipeHint") && <div className="md:hidden mt-[24px] t-caption-1 text-labelAssist">{s(spaces, "swipeHint")}</div>}
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

      {on(verify, "visible") && <VerifySection doc={verify} tone="white" />}

      {on(faq, "visible") && <FaqSection eyebrow={eyebrow(s(faq, "label"))} title={s(faq, "title")} lead={s(faq, "lead")} items={faqItems} tone="sand" />}

      <CtaBand track="social" title={s(cta, "title")} body={s(cta, "body")} ctaLabel={s(cta, "ctaLabel")} />

      <SiteFooter />
      <UpButton />
    </div>
  );
}
