import type { Metadata } from "next";
import { Header } from "@/components/site/Header";
import { SiteFooter } from "@/components/site/SiteFooter";
import { UpButton } from "@/components/site/UpButton";
import { ImageBlock } from "@/components/site/ImageBlock";
import { TrackHero } from "@/components/site/TrackHero";
import { TrackSwitch } from "@/components/site/TrackSwitch";
import { VerifySection } from "@/components/site/VerifySection";
import { MembersOnly } from "@/components/site/MembersOnly";
import { FaqSection } from "@/components/site/FaqSection";
import { CtaBand } from "@/components/site/CtaBand";
import { Txt, lines, nowrap } from "@/components/cms/Txt";
import { getPageDocs, list, on, s } from "@/lib/cms/get";
import { pageMetadata } from "@/lib/seo/get";
import { Badge, ButtonLink, CARD, CARD_HOVER, Container, SectionHead, SWIPE, SWIPE_ITEM } from "@/components/ui/ds";

export async function generateMetadata(): Promise<Metadata> {
  return pageMetadata("matching");
}

const SECTION = "py-[64px] md:py-[112px]";
type Plan = { name: string; sub: string; price: string; badge: string; dark?: boolean };

/**
 * 1:1 매칭(결혼중개 멤버십 RAUM CLASSIC · SIGNATURE · PRIVÉ) 트랙 페이지. 사업전략(2026.11.03) 기준.
 * 상단 소개 → 01 가입 심사(아무나 들어올 수 없습니다) → 02 진행 방식 4단계 → 03 멤버십 가입비(등급 이름 · 가입비(VAT 포함) · 상담 버튼만 — 결혼중개업은 가입비를 홈페이지에 공개해야 하므로 2026-11-12 부터 금액을 그대로 보여준다)
 * → 회원 전용 행사(SOCIAL NIGHT · GRAND BALL · RAUM SOLO, home.solo 재사용) → 04 다른 점 → 05 이런 분께 → 06 FAQ → CTA.
 * 문구는 모두 CMS(matching.* + home.solo, 전환 바 이름은 home.gate). 모든 상담 버튼은 /fit-check?track=matching.
 */
const eyebrow = (v: string) => (v.includes("/") ? v.split("/").slice(1).join("/").trim() : v.trim());

export default async function MatchingPage() {
  const d = await getPageDocs(["matching", "home"]);
  const hero = d["matching.hero"], verify = d["matching.verify"], how = d["matching.how"], plans = d["matching.plans"], diff = d["matching.diff"], who = d["matching.who"], faq = d["matching.faq"], solo = d["home.solo"], cta = d["matching.cta"], gate = d["home.gate"];
  const switchLabels = { socialLabel: s(gate, "tabSocial"), socialSub: s(gate, "tabSocialSub"), matchingLabel: s(gate, "tabMatching"), matchingSub: s(gate, "tabMatchingSub") };
  const planItems = list<Plan>(plans, "items").filter((p) => p.name);
  const planCta = s(plans, "ctaLabel") || "상담 신청하기", priceLabel = s(plans, "priceLabel") || "가입비", vatLabel = s(plans, "vatLabel") || "VAT 포함";
  const planNote = s(plans, "note");
  // 1:1 매칭 가입비는 공개 항목(결혼중개업)이라 FAQ 의 금액 문구도 숨기지 않는다
  const faqItems = list<{ q: string; a: string }>(faq, "items").filter((x) => x.q && x.a);

  return (
    <div className="pt-[56px] md:pt-[64px]">
      <Header />
      <TrackSwitch current="matching" labels={switchLabels} />
      <TrackHero doc={hero} />

      {/* 01 VERIFIED MEMBERS */}
      {on(verify, "visible") && <VerifySection doc={verify} />}

      {/* 02 HOW IT WORKS */}
      {on(how, "visible") && (
        <section id="how" data-fold className={SECTION}>
          <Container>
            <SectionHead eyebrow={s(how, "label")} title={<Txt v={s(how, "title")} breaks="hard" />} lead={<Txt v={s(how, "lead")} />} reveal />
            <ol className="grid grid-cols-1 gap-[10px] md:grid-cols-4 md:gap-[16px] mt-[32px] md:mt-[40px] list-none p-0 m-0">
              {list(how, "steps").map((st, i, arr) => (
                <li key={i} data-reveal style={{ "--d": `${i * 90}ms` } as React.CSSProperties} className={`${CARD} ${CARD_HOVER} p-[20px] md:p-[28px] relative flex gap-[14px] items-start md:block`}>
                  <div className="flex items-center gap-[10px] flex-none md:mb-[16px]">
                    <span className="w-[36px] h-[36px] md:w-[40px] md:h-[40px] rounded-full bg-primary text-white flex items-center justify-center t-label-2 md:t-label-1 font-bold">{String(i + 1).padStart(2, "0")}</span>
                    {i < arr.length - 1 && <span aria-hidden className="hidden md:block flex-1 h-px bg-lineNeutral" />}
                  </div>
                  <div className="min-w-0">
                    <h3 className="t-headline-1 md:t-heading-2 text-label mb-[6px] md:mb-[8px]">{nowrap(st.title)}</h3>
                    <p className="t-body-2-reading text-labelAlt text-pretty m-0"><Txt v={st.body} /></p>
                  </div>
                </li>
              ))}
            </ol>
          </Container>
        </section>
      )}

      {/* 03 MEMBERSHIP 가입비 (RAUM CLASSIC · SIGNATURE · PRIVÉ) — 이름 · 가입비 · 상담 버튼만 */}
      {on(plans, "visible") && planItems.length > 0 && (
        <section id="plans" data-fold className={`${SECTION} bg-sand`}>
          <Container>
            <SectionHead eyebrow={s(plans, "label")} title={<Txt v={s(plans, "title")} breaks="hard" />} lead={<Txt v={s(plans, "lead")} />} reveal />
            {s(plans, "swipeHint") && <div className="md:hidden mt-[24px] t-caption-1 text-labelAssist">{s(plans, "swipeHint")}</div>}
            <div className={`${SWIPE} mt-[12px] md:grid-cols-3 md:gap-[16px] md:mt-[40px]`}>
              {planItems.map((p, i) => (
                <article key={i} data-reveal data-testid="plan-card" style={{ "--d": `${i * 90}ms` } as React.CSSProperties} className={`${SWIPE_ITEM} ${p.dark ? "bg-inverseBg text-inverseLabel border border-inverseBg" : CARD} ${CARD_HOVER} relative overflow-hidden rounded-ds p-[28px] md:p-[32px] flex flex-col items-center text-center`}>
                  <span aria-hidden className={`absolute inset-x-0 top-0 h-[3px] ${p.dark ? "bg-inversePrimary" : "bg-primary"}`} />
                  {p.badge && <Badge tone={p.dark ? "inverse" : "primary"} className={`absolute top-[16px] right-[16px] ${p.dark ? "!bg-white !text-label" : ""}`}>{p.badge}</Badge>}
                  <div className={`t-caption-1 font-semibold tracking-[.18em] mt-[8px] ${p.dark ? "text-white/60" : "text-primary"}`}>{String(i + 1).padStart(2, "0")}</div>
                  <h3 className={`t-title-3 tracking-[.04em] mt-[10px] ${p.dark ? "text-white" : "text-label"}`}>{nowrap(p.name)}</h3>
                  {p.sub && <p className={`t-label-1 m-0 mt-[4px] ${p.dark ? "text-white/70" : "text-labelAlt"}`}>{p.sub}</p>}
                  <div className={`w-[32px] h-px my-[22px] ${p.dark ? "bg-white/25" : "bg-lineNeutral"}`} />
                  <div className={`t-caption-1 ${p.dark ? "text-white/60" : "text-labelAlt"}`}>{priceLabel}</div>
                  <div className={`t-title-2 md:t-title-1 mt-[4px] tabular-nums ${p.dark ? "text-white" : "text-label"}`}>{p.price}</div>
                  <div className={`t-caption-1 mt-[4px] ${p.dark ? "text-white/60" : "text-labelAlt"}`}>{vatLabel}</div>
                  <div className="mt-auto pt-[28px] w-full">
                    <ButtonLink href="/fit-check?track=matching" variant={p.dark ? "inverse" : "outlined"} size="md" className="w-full">{planCta}</ButtonLink>
                  </div>
                </article>
              ))}
            </div>
            {planNote && <p data-reveal className="t-label-1-reading text-labelAlt mt-[16px] text-pretty max-w-[800px]"><Txt v={planNote} /></p>}
          </Container>
        </section>
      )}

      {/* MEMBERS ONLY: SOCIAL NIGHT · GRAND BALL · RAUM SOLO */}
      {on(solo, "visible") && <MembersOnly doc={solo} eyebrow={eyebrow(s(solo, "label"))} title={s(solo, "title")} lead={s(solo, "lead")} />}

      {/* 04 WHY RSC */}
      {on(diff, "visible") && (
        <section id="why" data-fold className={`${SECTION} bg-sand`}>
          <Container>
            <SectionHead eyebrow={s(diff, "label")} title={<Txt v={s(diff, "title")} breaks="hard" />} reveal />
            <div className="grid grid-cols-1 gap-[10px] md:grid-cols-4 md:gap-[16px] mt-[32px] md:mt-[40px]">
              {list(diff, "items").map((c, i) => (
                <div key={i} data-reveal style={{ "--d": `${i * 90}ms` } as React.CSSProperties} className={`${CARD} ${CARD_HOVER} p-[20px] md:p-[28px]`}>
                  <div className="t-caption-1 font-semibold text-primary mb-[6px] md:mb-[8px]">{c.label}</div>
                  <div className="t-headline-1 md:t-heading-2 text-label mb-[8px] md:mb-[10px] text-pretty">{nowrap(c.title)}</div>
                  <div className="t-body-2-reading text-labelAlt text-pretty"><Txt v={c.body} /></div>
                </div>
              ))}
            </div>
          </Container>
        </section>
      )}

      {/* 05 WHO IT'S FOR */}
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
                      <span aria-hidden className="w-[24px] h-[24px] rounded-full bg-[rgba(var(--ds-primary-rgb),.1)] text-primary flex items-center justify-center flex-none mt-[1px]"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12l5 5L20 7" /></svg></span>
                      <span>{nowrap(p)}</span>
                    </li>
                  ))}
                </ul>
                {s(who, "ctaLabel") && <div className="mt-[32px]"><ButtonLink href="/fit-check?track=matching" size="lg">{s(who, "ctaLabel")}</ButtonLink></div>}
              </div>
            </div>
          </Container>
        </section>
      )}

      {on(faq, "visible") && <FaqSection eyebrow={s(faq, "label")} title={s(faq, "title")} lead={s(faq, "lead")} items={faqItems} />}

      <CtaBand track="matching" title={s(cta, "title")} body={s(cta, "body")} ctaLabel={s(cta, "ctaLabel")} />

      <SiteFooter />
      <UpButton />
    </div>
  );
}
