import type { Metadata } from "next";
import { Header } from "@/components/site/Header";
import { SiteFooter } from "@/components/site/SiteFooter";
import { UpButton } from "@/components/site/UpButton";
import { ImageBlock } from "@/components/site/ImageBlock";
import { SitePopups } from "@/components/site/SitePopups";
import { GateHero, type GateTrack } from "@/components/site/GateHero";
import { TrackCards } from "@/components/site/TrackCards";
import { FaqSection } from "@/components/site/FaqSection";
import { CtaBand } from "@/components/site/CtaBand";
import { listLivePopups } from "@/lib/popups/queries";
import { Txt } from "@/components/cms/Txt";
import { getPageDocs, list, on, s } from "@/lib/cms/get";
import { pageMetadata } from "@/lib/seo/get";
import { hasPrice } from "@/lib/settings/leadMode";
import { CARD, CARD_HOVER, Container, SectionHead } from "@/components/ui/ds";

export async function generateMetadata(): Promise<Metadata> {
  return pageMetadata("home");
}

const SECTION = "py-[64px] md:py-[112px]";
const BODY = "t-body-1-reading text-labelAlt text-pretty";
/** "01  /  NEW DEFINITION" 형태의 CMS 라벨 → "NEW DEFINITION" 만 쓴다 (번호는 디자인에서 뺌) */
const eyebrow = (v: string) => (v.includes("/") ? v.split("/").slice(1).join("/").trim() : v.trim());

/**
 * 메인 = 게이트. 맨 위 전환형 히어로(소셜클럽 | 1:1 매칭)에서 방식을 고르면 각 트랙 페이지(/social, /matching)로 간다.
 * 그 아래는 두 방식 비교 카드 → 브랜드 소개(01) → 브랜드 약속(03) → FAQ → 두 버튼 CTA. 프로그램 상세(02·04·05·06)는 /social 로 옮겼다.
 * 모든 문구·사진은 CMS(site_content home.*) — 기본값은 lib/cms/schema.ts
 */
export default async function HomePage() {
  const [d, popups] = await Promise.all([getPageDocs("home"), listLivePopups()]);
  const gate = d["home.gate"], tracks = d["home.tracks"], about = d["home.about"], promise = d["home.promise"], faq = d["home.faq"], cta = d["home.cta"];
  const faqItems = list<{ q: string; a: string }>(faq, "items").filter((x) => x.q && x.a).filter((x) => !hasPrice(x.q + x.a)); // 금액은 비공개(대면 상담 안내)

  const gateTracks: GateTrack[] = [
    { key: "social", tab: s(gate, "tabSocial") || "소셜클럽", image: s(gate, "socialImage"), overline: s(gate, "socialOverline"), title: s(gate, "socialTitle"), body: s(gate, "socialBody"), cta: s(gate, "socialCta") || "자세히 보기", href: "/social", applyHref: "/fit-check?track=social" },
    { key: "matching", tab: s(gate, "tabMatching") || "1:1 매칭", image: s(gate, "matchingImage"), overline: s(gate, "matchingOverline"), title: s(gate, "matchingTitle"), body: s(gate, "matchingBody"), cta: s(gate, "matchingCta") || "자세히 보기", href: "/matching", applyHref: "/fit-check?track=matching" },
  ];
  const defaultTrack = s(gate, "defaultTrack") === "matching" ? "matching" : "social";

  return (
    <div className="pt-[56px] md:pt-[64px]">
      <Header />

      {/* 00 게이트 히어로 */}
      <section className="pt-[16px] pb-[8px] md:pt-[24px] md:pb-[16px]">
        <Container wide>
          <GateHero tracks={gateTracks} defaultTrack={defaultTrack} applyLabel={s(gate, "applyCta") || "상담 신청"} />
        </Container>
      </section>

      {/* 00-1 두 가지 방식 */}
      {on(tracks, "visible") && <TrackCards doc={tracks} gate={gate} />}

      {/* 01 NEW DEFINITION */}
      {on(about, "visible") && (
        <section id="about" data-fold className={SECTION}>
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

      {/* 03 BRAND PROMISE */}
      {on(promise, "visible") && (
        <section id="promise" data-fold className={`${SECTION} bg-sand`}>
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

      {/* FAQ */}
      {on(faq, "visible") && <FaqSection eyebrow={eyebrow(s(faq, "label"))} title={s(faq, "title")} lead={s(faq, "lead")} items={faqItems} tone="white" />}

      <CtaBand title={s(cta, "title")} body={s(cta, "body")} socialLabel={s(cta, "socialLabel")} matchingLabel={s(cta, "matchingLabel")} />

      <SiteFooter />
      <UpButton />
      {popups.length > 0 && <SitePopups popups={popups} />}
    </div>
  );
}
