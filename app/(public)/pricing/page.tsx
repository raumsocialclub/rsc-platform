import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo/get";
import { Header } from "@/components/site/Header";
import { SiteFooter } from "@/components/site/SiteFooter";
import { UpButton } from "@/components/site/UpButton";
import { Txt, lines } from "@/components/cms/Txt";
import { Badge, ButtonLink, CARD, CARD_HOVER, Container, SectionHead } from "@/components/ui/ds";
import { getPageDocs, list, s } from "@/lib/cms/get";

export async function generateMetadata(): Promise<Metadata> {
  return pageMetadata("pricing");
}

/* 모든 문구·표는 CMS(site_content pricing.*) */
const TH = "text-left t-caption-1 font-semibold text-labelAlt px-[16px] py-[12px] bg-sand border-b border-lineAlt whitespace-nowrap";
const TD = "t-body-2 text-labelNeutral px-[16px] py-[14px] border-b border-lineAlt align-top";
const TR = "transition-colors hover:bg-[rgba(0,102,255,.03)]";
const SUB = "t-caption-1 text-labelAlt mt-[3px]";
const SEC = "mb-[56px] md:mb-[80px]";

function Li({ children, dark }: { children: React.ReactNode; dark?: boolean }) {
  return (
    <li className="flex gap-[10px]">
      <svg aria-hidden width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className={`flex-none mt-[2px] ${dark ? "text-inversePrimary" : "text-primary"}`}><path d="M5 12l5 5L20 7" /></svg>
      <span>{children}</span>
    </li>
  );
}
function Scroll({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`${CARD} overflow-x-auto [-webkit-overflow-scrolling:touch] hidden md:block ${className}`} data-reveal>
      <table className="border-collapse w-full [&_tbody_tr:last-child_td]:border-b-0">{children}</table>
    </div>
  );
}
const won = (n: unknown) => Number(n ?? 0).toLocaleString("ko-KR");

export default async function PricingPage() {
  const d = await getPageDocs("pricing");
  const hero = d["pricing.hero"], plans = d["pricing.plans"], programs = d["pricing.programs"], path = d["pricing.path"], policy = d["pricing.policy"], cta = d["pricing.cta"];
  type Plan = { name: string; price: number; unit: string; desc: string; features: string; note: string; dark?: boolean; badge?: string };
  type Row = { name: string; sub: string; price: string; priceSub: string; unit: string; desc: string };
  type PathRow = { a: string; b: string; c: string; d: string; highlight?: boolean };

  return (
    <div className="min-h-screen flex flex-col pt-[56px] md:pt-[64px]">
      <Header />
      <main className="flex-1 py-[48px] md:py-[80px]">
        <Container>
          <section className={SEC}>
            <div className="anim-up t-eyebrow text-primary mb-[10px]">{s(hero, "label")}</div>
            <h1 className="anim-up t-title-1 md:t-display-2 text-label mb-[16px] text-pretty"><Txt v={s(hero, "title")} breaks="hard" /></h1>
            <p className="anim-up-2 t-body-1-reading text-labelAlt max-w-[600px] text-pretty"><Txt v={s(hero, "body")} breaks="hard" /></p>
          </section>

          <section className={SEC}>
            <div className="t-label-1 font-semibold text-labelAlt mb-[16px]" data-reveal>{s(plans, "label")}</div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-[16px] items-stretch">
              {list<Plan>(plans, "items").map((p, i) => (
                <div key={i} data-reveal style={{ "--d": `${i * 90}ms` } as React.CSSProperties} className={`${p.dark ? "bg-inverseBg text-inverseLabel border border-transparent" : CARD} ${CARD_HOVER} rounded-ds p-[24px] md:p-[28px] flex flex-col relative`}>
                  {p.badge && <Badge tone={p.dark ? "primary" : "primary"} className="absolute top-[20px] right-[20px]">{p.badge}</Badge>}
                  <div className={`t-label-1 font-semibold mb-[14px] ${p.dark ? "text-inversePrimary" : "text-primary"}`}>{p.name}</div>
                  <div className="t-title-1 leading-none">{won(p.price)}<span className="t-body-1 font-medium ml-[2px]">원</span></div>
                  <div className={`t-label-1 mt-[8px] mb-[20px] ${p.dark ? "text-[rgba(247,247,248,.6)]" : "text-labelAlt"}`}>{p.unit}</div>
                  <p className={`mb-[20px] t-body-2-reading ${p.dark ? "text-[rgba(247,247,248,.85)]" : "text-labelNeutral"}`}><Txt v={p.desc} breaks="hard" /></p>
                  <ul className={`m-0 mb-[24px] p-0 list-none grid gap-[8px] t-body-2 flex-1 ${p.dark ? "text-[rgba(247,247,248,.9)]" : "text-labelNeutral"}`}>{lines(p.features).map((f, j) => <Li key={j} dark={p.dark}>{f}</Li>)}</ul>
                  <div className={`border-t pt-[14px] t-caption-1 ${p.dark ? "border-[rgba(247,247,248,.16)] text-inversePrimary" : "border-lineAlt text-primary"}`}><Txt v={p.note} breaks="hard" /></div>
                </div>
              ))}
            </div>
          </section>

          <section className={SEC}>
            <SectionHead eyebrow={s(programs, "label")} title={s(programs, "title")} lead={s(programs, "lead")} reveal />
            <div className="md:hidden grid gap-[12px] mt-[24px]">
              {list<Row>(programs, "rows").map((r, i) => (
                <div key={i} data-reveal style={{ "--d": `${(i % 3) * 70}ms` } as React.CSSProperties} className={`${CARD} p-[20px]`}>
                  <div className="flex justify-between items-start gap-[12px]">
                    <div><b className="t-headline-2 text-label">{r.name}</b>{r.sub && <div className={SUB}>{r.sub}</div>}</div>
                    <div className="text-right flex-none"><b className="t-headline-2 text-label whitespace-nowrap">{r.price}</b>{r.priceSub && <div className={SUB}><Txt v={r.priceSub} breaks="hard" /></div>}</div>
                  </div>
                  <div className="mt-[10px] t-caption-1 text-labelAlt">{r.unit}</div>
                  <p className="mt-[8px] t-body-2-reading text-labelNeutral m-0 text-pretty"><Txt v={r.desc} /></p>
                </div>
              ))}
            </div>
            <Scroll className="mt-[28px]">
              <thead><tr><th className={TH}>프로그램</th><th className={TH}>가격</th><th className={TH}>단위</th><th className={TH}>내용</th></tr></thead>
              <tbody>
                {list<Row>(programs, "rows").map((r, i) => (
                  <tr key={i} className={TR}>
                    <td className={TD}><b className="text-label">{r.name}</b>{r.sub && <div className={SUB}>{r.sub}</div>}</td>
                    <td className={`${TD} whitespace-nowrap`}><b className="text-label">{r.price}</b>{r.priceSub && <div className={SUB}><Txt v={r.priceSub} breaks="hard" /></div>}</td>
                    <td className={`${TD} whitespace-nowrap`}>{r.unit}</td>
                    <td className={TD}>{r.desc}</td>
                  </tr>
                ))}
              </tbody>
            </Scroll>
          </section>

          <section className={SEC}>
            <SectionHead eyebrow={s(path, "label")} title={s(path, "title")} reveal />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-[12px] md:gap-[16px] mt-[28px]">
              {list(path, "steps").map((c, i) => (
                <div key={i} data-reveal style={{ "--d": `${i * 90}ms` } as React.CSSProperties} className={`${CARD} ${CARD_HOVER} p-[24px]`}>
                  <div className="t-eyebrow text-primary mb-[10px]">{c.s}</div>
                  <div className="t-headline-1 text-label mb-[6px]">{c.t}</div>
                  <div className="t-body-2-reading text-labelAlt text-pretty"><Txt v={c.d} /></div>
                </div>
              ))}
            </div>
            <div className="md:hidden grid gap-[12px] mt-[16px]">
              {list<PathRow>(path, "rows").map((r, i) => (
                <div key={i} data-reveal style={{ "--d": `${(i % 3) * 70}ms` } as React.CSSProperties} className={`${CARD} p-[20px] ${r.highlight ? "border-primary bg-[rgba(0,102,255,.04)]" : ""}`}>
                  <div className="flex justify-between items-start gap-[12px]">
                    <b className="t-headline-2 text-label">{r.a}</b>
                    <b className="t-headline-2 text-label whitespace-nowrap flex-none">{r.b}</b>
                  </div>
                  <dl className="mt-[10px] grid gap-[4px] t-body-2 text-labelNeutral m-0">
                    <div><dt className="inline t-caption-1 text-labelAlt">포함 구성 · </dt><dd className="inline">{r.c}</dd></div>
                    <div><dt className="inline t-caption-1 text-labelAlt">적합 고객 · </dt><dd className="inline">{r.d}</dd></div>
                  </dl>
                </div>
              ))}
            </div>
            <Scroll className="mt-[16px]">
              <thead><tr><th className={TH}>선택안</th><th className={TH}>결제액</th><th className={TH}>포함 구성</th><th className={TH}>적합 고객</th></tr></thead>
              <tbody>
                {list<PathRow>(path, "rows").map((r, i) => (
                  <tr key={i} className={`${TR} ${r.highlight ? "bg-[rgba(0,102,255,.05)]" : ""}`}>
                    <td className={TD}>{r.highlight ? <b className="text-label">{r.a}</b> : r.a}</td>
                    <td className={`${TD} whitespace-nowrap`}>{r.highlight ? <b className="text-label">{r.b}</b> : r.b}</td>
                    <td className={TD}>{r.highlight ? <b className="text-label">{r.c}</b> : r.c}</td>
                    <td className={TD}>{r.highlight ? <b className="text-label">{r.d}</b> : r.d}</td>
                  </tr>
                ))}
              </tbody>
            </Scroll>
          </section>

          <section className={SEC}>
            <SectionHead eyebrow={s(policy, "label")} title={s(policy, "title")} reveal />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-[16px] items-start mt-[28px]">
              {(["conversions", "rules"] as const).map((key, ki) => {
                const rows = list<{ k: string; v: string }>(policy, key);
                return (
                  <div key={key} data-reveal style={{ "--d": `${ki * 90}ms` } as React.CSSProperties} className={`${CARD} p-[24px]`}>
                    <div className="t-headline-2 text-label mb-[12px]">{s(policy, key === "conversions" ? "leftTitle" : "rightTitle")}</div>
                    <div className="grid">
                      {rows.map((r, i) => (
                        <div key={i} className={`grid grid-cols-1 gap-[4px] md:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)] md:gap-[14px] py-[12px] t-body-2 -mx-[8px] px-[8px] rounded-ds-sm transition-colors hover:bg-fillAlt ${i < rows.length - 1 ? "border-b border-lineAlt" : ""}`}>
                          <b className="text-label">{r.k}</b><span className="text-labelNeutral">{r.v}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
            {s(policy, "note") && <p className="mt-[16px] t-caption-1 text-labelAlt text-pretty"><Txt v={s(policy, "note")} /></p>}
          </section>

          <section data-reveal className="bg-inverseBg rounded-ds px-[24px] py-[40px] md:px-[48px] md:py-[56px] text-center">
            <div className="t-label-1 font-semibold text-inversePrimary mb-[10px]">{s(cta, "label")}</div>
            <h2 className="t-title-3 md:t-title-2 text-inverseLabel mb-[12px] text-pretty">{s(cta, "title")}</h2>
            <p className="mx-auto mb-[28px] t-body-1-reading text-[rgba(247,247,248,.7)] max-w-[520px]"><Txt v={s(cta, "body")} breaks="hard" /></p>
            <div className="flex gap-[10px] justify-center flex-wrap">
              {s(cta, "cta1Label") && <ButtonLink href={s(cta, "cta1Href")} size="lg">{s(cta, "cta1Label")}</ButtonLink>}
              {s(cta, "cta2Label") && <ButtonLink href={s(cta, "cta2Href")} variant="inverse" size="lg">{s(cta, "cta2Label")}</ButtonLink>}
            </div>
          </section>
        </Container>
      </main>
      <SiteFooter />
      <UpButton />
    </div>
  );
}
