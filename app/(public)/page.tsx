import type { Metadata } from "next";
import Link from "next/link";
import { Header } from "@/components/site/Header";
import { SiteFooter } from "@/components/site/SiteFooter";
import { UpButton } from "@/components/site/UpButton";
import { ImageBlock } from "@/components/site/ImageBlock";
import { Txt } from "@/components/cms/Txt";
import { getPageDocs, list, on, s } from "@/lib/cms/get";
import { JsonLd } from "@/components/seo/JsonLd";
import { pageMetadata } from "@/lib/seo/get";
import { faqJsonLd } from "@/lib/seo/jsonld";

export async function generateMetadata(): Promise<Metadata> {
  return pageMetadata("home");
}

/* ---------- 공통 조각 (deploy/index.html 인라인 스타일을 그대로 옮김) ---------- */

const SECTION = "px-[20px] py-[72px] md:px-[40px] md:py-[140px] border-t border-[rgba(33,30,25,.09)]";
const INNER = "max-w-[1240px] mx-auto";
const H2 = "font-semibold text-[25px] leading-[1.36] md:text-[clamp(28px,2.8vw,44px)] text-pretty";
const BODY_M = "text-[15px] leading-[1.6]";
const LINE_GRID = "bg-[rgba(33,30,25,.14)] border border-[rgba(33,30,25,.14)]";
const SPACE_LAYOUT = [
  { span: "md:col-span-4", h: "h-[220px] md:h-[520px]" },
  { span: "md:col-span-2", h: "h-[220px] md:h-[520px]" },
  { span: "md:col-span-3", h: "h-[200px] md:h-[380px]" },
  { span: "md:col-span-3", h: "h-[200px] md:h-[380px]" },
];

function SectionLabel({ children, className = "mb-[40px]" }: { children: React.ReactNode; className?: string }) {
  return <div className={`text-[11px] tracking-[.34em] text-brownHover ${className}`}>{children}</div>;
}
/** "01  /  NEW DEFINITION" 형태의 라벨: 슬래시 양쪽에 &nbsp; */
function Label({ v }: { v: string }) {
  const [a, b] = v.split("/").map((x) => x.trim());
  return b ? <>{a} &nbsp;/&nbsp; {b}</> : <>{v}</>;
}
function Cta({ href, className, children }: { href: string; className: string; children: React.ReactNode }) {
  return href.startsWith("/") ? <Link href={href} className={className}>{children}</Link> : <a href={href} className={className} {...(href.startsWith("http") ? { target: "_blank", rel: "noreferrer" } : {})}>{children}</a>;
}

/** 메인 페이지. 모든 문구·사진은 CMS(site_content home.*) — 기본값은 lib/cms/schema.ts */
export default async function HomePage() {
  const d = await getPageDocs("home");
  const hero = d["home.hero"], about = d["home.about"], why = d["home.why"], promise = d["home.promise"], social = d["home.social"], solo = d["home.solo"], spaces = d["home.spaces"], mem = d["home.membership"], faq = d["home.faq"];
  const faqItems = list<{ q: string; a: string }>(faq, "items").filter((x) => x.q && x.a);
  const showFaq = on(faq, "visible") && faqItems.length > 0;
  const promiseSize = (i: number) => (i === 1 ? "text-[22px]" : "text-[23px]");

  return (
    <>
      <Header />

      {/* HERO */}
      <section id="top" className="relative h-screen min-h-[640px] md:min-h-[660px] w-full">
        <ImageBlock src={s(hero, "image")} alt="" className="absolute inset-0" filter="brightness(0.55)" priority />
        <div className="absolute left-[20px] right-[20px] bottom-[28px] md:left-[40px] md:right-[40px] md:bottom-[64px] flex flex-col items-start gap-[22px] md:flex-row md:items-end md:justify-between md:gap-[48px] md:flex-wrap pointer-events-none">
          <div className="max-w-[820px]">
            <div className="text-[11px] tracking-[.3em] text-gold mb-[28px]">{s(hero, "overline")}</div>
            <h1 className="font-medium text-[30px] leading-[1.32] md:text-[clamp(32px,4.1vw,64px)] md:leading-[1.24] tracking-[-.01em] mb-[26px] text-pretty text-cream">
              <Txt v={s(hero, "title")} breaks="hard" />
            </h1>
            <p className={`${BODY_M} md:text-[16.5px] md:leading-[1.7] text-[rgba(247,243,236,.9)] max-w-[560px] text-pretty`}>
              <Txt v={s(hero, "body")} />
            </p>
          </div>
          <div className="flex gap-[12px] pointer-events-auto">
            {s(hero, "cta1Label") && <Cta href={s(hero, "cta1Href")} className="inline-flex items-center px-[28px] py-[15px] rounded-pill bg-ink text-cream text-[13.5px] whitespace-nowrap hover:bg-brownHover hover:text-cream">{s(hero, "cta1Label")}</Cta>}
            {s(hero, "cta2Label") && <Cta href={s(hero, "cta2Href")} className="inline-flex items-center px-[28px] py-[15px] rounded-pill border border-[#FFFFFF4D] text-[13.5px] text-white whitespace-nowrap hover:border-brownHover hover:text-brownHover">{s(hero, "cta2Label")}</Cta>}
          </div>
        </div>
      </section>

      {/* 01 NEW DEFINITION */}
      {on(about, "visible") && (
        <section id="about" className={SECTION}>
          <div className={INNER}>
            <SectionLabel className="mb-[56px]"><Label v={s(about, "label")} /></SectionLabel>
            <div className="grid grid-cols-1 gap-[20px] md:grid-cols-[repeat(auto-fit,minmax(320px,1fr))] md:gap-[80px] items-start">
              <div>
                <h2 className={`${H2} md:leading-[1.3] mb-[34px]`}>{s(about, "title")}</h2>
                <p className={`${BODY_M} md:text-[16px] md:leading-[1.28] mb-[22px] text-[rgba(33,30,25,.7)] text-pretty w-full md:w-[619px] md:h-[61px] font-semibold`}>
                  <Txt v={s(about, "p1")} breaks="hard" />
                </p>
                <p className={`${BODY_M} md:text-[16px] md:leading-[1.28] mb-[22px] text-[rgba(33,30,25,.7)] text-pretty font-semibold`}>
                  <br /><Txt v={s(about, "p2")} />
                </p>
                <div className="border-l-2 border-brownHover pl-[24px] py-[4px] mt-[44px]">
                  <p className={`${BODY_M} md:text-[17px] md:leading-[1.28] text-pretty`}><Txt v={s(about, "quote")} /></p>
                </div>
              </div>
              <ImageBlock src={s(about, "image")} alt="라움의 공간" className="h-[260px] md:h-[600px] min-w-0" filter="brightness(0.97) saturate(0.94)" sizes="(min-width: 761px) 50vw, 100vw" />
            </div>
          </div>
        </section>
      )}

      {/* 02 POSITIONING */}
      {on(why, "visible") && (
        <section id="why" className={`${SECTION} bg-sand`}>
          <div className={INNER}>
            <SectionLabel><Label v={s(why, "label")} /></SectionLabel>
            <h2 className={`${H2} md:leading-[1.28] mb-[26px] max-w-[760px]`}><Txt v={s(why, "title")} breaks="hard" /></h2>
            <p className={`${BODY_M} md:text-[16px] md:leading-[1.28] mb-[72px] text-[rgba(33,30,25,.68)] max-w-[680px] text-pretty`}><Txt v={s(why, "lead")} /></p>
            <div className={`grid grid-cols-1 gap-[20px] md:grid-cols-[repeat(auto-fit,minmax(260px,1fr))] md:gap-px ${LINE_GRID} mb-[56px]`}>
              {list(why, "items").map((c, i) => (
                <div key={i} className="bg-sand px-[22px] py-[26px] md:px-[30px] md:py-[36px]">
                  <div className="text-[10.5px] tracking-[.28em] text-brownHover mb-[16px]">{c.label}</div>
                  <div className={`${BODY_M} md:text-[15px] md:leading-[1.28] text-[rgba(33,30,25,.74)] text-pretty`}><Txt v={c.text} /></div>
                </div>
              ))}
            </div>
            <p className={`${BODY_M} md:text-[18px] md:leading-[1.35] max-w-[700px] text-pretty`}><Txt v={s(why, "closing")} /></p>
          </div>
        </section>
      )}

      {/* 03 BRAND PROMISE */}
      {on(promise, "visible") && (
        <section id="promise" className={SECTION}>
          <div className={INNER}>
            <SectionLabel><Label v={s(promise, "label")} /></SectionLabel>
            <h2 className={`${H2} md:leading-[1.28] mb-[64px] max-w-[700px]`}><Txt v={s(promise, "title")} breaks="hard" /></h2>
            <div className="grid grid-cols-1 gap-[20px] md:grid-cols-[repeat(auto-fit,minmax(300px,1fr))] md:gap-[28px]">
              {list(promise, "items").map((c, i) => (
                <div key={i} className="min-w-0 px-[22px] py-[26px] md:px-[32px] md:py-[36px] border border-[rgba(33,30,25,.16)]">
                  <div className="text-[11px] tracking-[.24em] text-brownHover mb-[18px]">{c.label}</div>
                  <div className={`${promiseSize(i)} mb-[16px]`}>{c.title}</div>
                  <div className={`${BODY_M} md:text-[14.5px] md:leading-[1.32] text-[rgba(33,30,25,.64)] text-pretty`}><Txt v={c.body} /></div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* 04 RSC SOCIAL */}
      {on(social, "visible") && (
        <section id="social" className={`${SECTION} bg-sand`}>
          <div className={INNER}>
            <SectionLabel><Label v={s(social, "label")} /></SectionLabel>
            <div className="flex flex-col items-start gap-[20px] md:flex-row md:items-end md:justify-between md:gap-[40px] md:flex-wrap mb-[64px]">
              <h2 className={`${H2} md:leading-[1.28] max-w-[660px]`}><Txt v={s(social, "title")} breaks="hard" /></h2>
              <p className={`${BODY_M} md:text-[13px] md:leading-[1.85] text-[rgba(33,30,25,.6)] max-w-[380px] w-full md:w-[415px] md:h-[76px] text-pretty`}><Txt v={s(social, "lead")} /></p>
            </div>
            <div className="grid grid-cols-1 gap-[20px] md:grid-cols-[repeat(auto-fit,minmax(300px,1fr))] md:gap-[28px]">
              {list(social, "items").map((c, i) => (
                <div key={i} className="min-w-0">
                  <ImageBlock src={c.image} alt={c.title} className="h-[200px] md:h-[340px] mb-[24px]" filter={c.filter || undefined} sizes="(min-width: 761px) 33vw, 100vw" />
                  <div className="text-[10.5px] tracking-[.28em] text-brownHover mb-[12px]">{c.cat}</div>
                  <div className="text-[22px] mb-[10px] font-semibold">{c.title}</div>
                  <div className={`${BODY_M} md:text-[14.5px] md:leading-[1.28] text-[rgba(33,30,25,.62)] text-pretty`}><Txt v={c.desc} /></div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* 05 MONTHLY & SEASON */}
      {on(solo, "visible") && (
        <section id="solo" className={SECTION}>
          <div className={INNER}>
            <SectionLabel><Label v={s(solo, "label")} /></SectionLabel>
            <div className={`grid grid-cols-1 gap-[20px] md:grid-cols-[repeat(auto-fit,minmax(340px,1fr))] md:gap-px ${LINE_GRID}`}>
              {list(solo, "cards").map((c, i) => (
                <div key={i} className="bg-cream px-[26px] py-[32px] md:px-[48px] md:py-[56px] min-w-0">
                  <ImageBlock src={c.image} alt={c.title} className="h-[180px] md:h-[260px] mb-[32px]" filter={c.filter || undefined} sizes="(min-width: 761px) 50vw, 100vw" />
                  <div className="text-[10.5px] tracking-[.28em] text-brownHover mb-[16px]">{c.label}</div>
                  <div className="text-[26px] mb-[16px] font-semibold">{c.title}</div>
                  <div className={`${BODY_M} md:text-[14.5px] md:leading-[1.32] text-[rgba(33,30,25,.62)] text-pretty`}><Txt v={c.body} /></div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* 06 SPACES */}
      {on(spaces, "visible") && (
        <section id="spaces" className={`${SECTION} bg-sand`}>
          <div className={INNER}>
            <SectionLabel><Label v={s(spaces, "label")} /></SectionLabel>
            <div className="flex flex-col items-start gap-[20px] md:flex-row md:items-end md:justify-between md:gap-[40px] md:flex-wrap mb-[26px]">
              <h2 className={`${H2} md:leading-[1.28] max-w-[660px]`}>{s(spaces, "title")}</h2>
              <p className={`${BODY_M} md:text-[15px] md:leading-[1.32] text-[rgba(33,30,25,.6)] max-w-[340px] text-pretty`}>{s(spaces, "lead")}</p>
            </div>
            <div className="grid grid-cols-1 gap-[20px] md:grid-cols-6 mt-[64px]">
              {list(spaces, "items").map((c, i) => {
                const lay = SPACE_LAYOUT[i % SPACE_LAYOUT.length];
                return (
                  <div key={i} className={`min-w-0 ${lay.span}`}>
                    <ImageBlock src={c.image} alt={c.title} className={lay.h} filter="brightness(0.85) saturate(0.85)" sizes="(min-width: 761px) 66vw, 100vw" />
                    <div className="flex items-baseline gap-[16px] pt-[22px]">
                      <span className="text-[11px] tracking-[.2em] text-brownHover">{c.n}</span>
                      <div>
                        <div className="text-[22px] mb-[8px] font-semibold">{c.title}</div>
                        <div className={`${BODY_M} md:text-[14px] md:leading-[1.28] text-[rgba(33,30,25,.62)] text-pretty`}>{c.desc}</div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* 07 MEMBERSHIP */}
      {on(mem, "visible") && (
        <section id="membership" className={SECTION}>
          <div className={INNER}>
            <SectionLabel><Label v={s(mem, "label")} /></SectionLabel>
            <div className="grid grid-cols-1 gap-[20px] md:grid-cols-[minmax(320px,1.5fr)_minmax(320px,1fr)] md:gap-[80px] items-center mb-[96px]">
              <ImageBlock src={s(mem, "image")} alt="RAUM" className="h-[260px] md:h-[600px] min-w-0" filter="brightness(1.05)" sizes="(min-width: 761px) 60vw, 100vw" />
              <div className="min-w-0">
                <h2 className="font-semibold text-[25px] leading-[1.36] md:text-[clamp(27px,2.7vw,42px)] md:leading-[1.32] mb-[30px] text-pretty"><Txt v={s(mem, "title")} breaks="hard" /></h2>
                <p className={`${BODY_M} md:text-[16px] md:leading-[1.28] mb-[44px] text-[rgba(33,30,25,.7)] max-w-[480px] text-pretty`}><Txt v={s(mem, "body")} /></p>
                <div className={`grid grid-cols-1 md:grid-cols-2 gap-px ${LINE_GRID} max-w-[480px] mb-[36px]`}>
                  <Link href={s(mem, "link1Href") || "/pricing"} className="bg-cream px-[28px] py-[26px] block hover:bg-sandHover">
                    <div className="text-[11px] tracking-[.2em] text-brownHover mb-[10px]">MEMBERSHIP</div>
                    <div className="text-[17px] font-semibold flex justify-between items-center gap-[8px]">{s(mem, "link1Label")}<span className="text-brown">→</span></div>
                  </Link>
                  <Link href={s(mem, "link2Href") || "/benefits"} className="bg-cream px-[28px] py-[26px] block hover:bg-sandHover">
                    <div className="text-[11px] tracking-[.2em] text-brownHover mb-[10px]">BENEFITS</div>
                    <div className="text-[17px] font-semibold flex justify-between items-center gap-[8px]">{s(mem, "link2Label")}<span className="text-brown">→</span></div>
                  </Link>
                </div>
                <div className="flex gap-[12px] flex-wrap">
                  {s(mem, "cta1Label") && <Cta href={s(mem, "cta1Href")} className="inline-flex items-center px-[28px] py-[15px] rounded-pill bg-ink text-cream text-[13.5px] hover:bg-brownHover hover:text-cream">{s(mem, "cta1Label")}</Cta>}
                  {s(mem, "cta2Label") && <Cta href={s(mem, "cta2Href")} className="inline-flex items-center px-[28px] py-[15px] rounded-pill border border-[rgba(33,30,25,.3)] text-[13.5px] hover:border-brownHover hover:text-brownHover">{s(mem, "cta2Label")}</Cta>}
                </div>
              </div>
            </div>
            <div className={`grid grid-cols-1 gap-[20px] md:grid-cols-[repeat(auto-fit,minmax(200px,1fr))] md:gap-px ${LINE_GRID}`}>
              {list(mem, "values").map((v, i) => (
                <div key={i} className="bg-cream px-[26px] py-[32px]">
                  <div className="text-[10.5px] tracking-[.24em] text-brownHover mb-[14px]">{v.label}</div>
                  <div className={`${BODY_M} md:text-[14px] md:leading-[1.28] text-[rgba(33,30,25,.68)]`}><Txt v={v.text} breaks="hard" /></div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* 08 FAQ (M11 — 검색·AI 검색 인용용, FAQPage 구조화 데이터 포함) */}
      {showFaq && (
        <section id="faq" className={`${SECTION} bg-sand`}>
          <div className={INNER}>
            <SectionLabel><Label v={s(faq, "label")} /></SectionLabel>
            <div className="grid grid-cols-1 gap-[32px] md:grid-cols-[minmax(240px,1fr)_minmax(0,2fr)] md:gap-[80px] items-start">
              <div>
                <h2 className={`${H2} md:leading-[1.28] mb-[20px]`}><Txt v={s(faq, "title")} breaks="hard" /></h2>
                <p className={`${BODY_M} md:text-[15px] md:leading-[1.6] text-[rgba(33,30,25,.62)] max-w-[360px] text-pretty`}><Txt v={s(faq, "lead")} /></p>
              </div>
              <div className="border-t border-[rgba(33,30,25,.14)]">
                {faqItems.map((it, i) => (
                  <details key={i} className="group border-b border-[rgba(33,30,25,.14)]">
                    <summary className="flex items-start justify-between gap-[20px] cursor-pointer list-none py-[22px] md:py-[26px] [&::-webkit-details-marker]:hidden">
                      <span className="text-[16px] md:text-[18px] font-semibold leading-[1.45] text-pretty">{it.q}</span>
                      <span aria-hidden className="flex-none text-[20px] leading-none text-brownHover mt-[2px] transition-transform group-open:rotate-45">+</span>
                    </summary>
                    <div className={`${BODY_M} md:text-[15px] md:leading-[1.8] text-[rgba(33,30,25,.72)] pb-[26px] md:pr-[40px] text-pretty`}><Txt v={it.a} breaks="hard" /></div>
                  </details>
                ))}
              </div>
            </div>
          </div>
          <JsonLd data={faqJsonLd(faqItems)} />
        </section>
      )}

      <SiteFooter />
      <UpButton />
    </>
  );
}
