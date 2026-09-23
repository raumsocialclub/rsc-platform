import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo/get";
import Link from "next/link";
import { Header } from "@/components/site/Header";
import { SiteFooter } from "@/components/site/SiteFooter";
import { UpButton } from "@/components/site/UpButton";
import { Txt, lines } from "@/components/cms/Txt";
import { getPageDocs, list, s } from "@/lib/cms/get";

export async function generateMetadata(): Promise<Metadata> {
  return pageMetadata("pricing");
}

/* deploy/pricing.html 재현. 모든 문구·표는 CMS(site_content pricing.*) */

const TH = "text-left text-[11.5px] tracking-[.12em] text-[rgba(33,30,25,.5)] font-semibold px-[12px] py-[12px] md:px-[18px] md:py-[14px] border-b border-[rgba(33,30,25,.18)] whitespace-nowrap";
const TD = "text-[13px] md:text-[14.5px] p-[12px] md:p-[18px] border-b border-[rgba(33,30,25,.1)] align-top leading-[1.5]";
const SUB = "text-[12px] text-[rgba(33,30,25,.5)] mt-[3px]";
const CARD = "bg-cream border border-[rgba(33,30,25,.14)] px-[32px] py-[36px] flex flex-col";
const PRICE = "text-[34px] font-semibold tracking-[-.01em] leading-none";
const WON = "text-[15px] font-medium ml-[2px]";
const LIST = "m-0 mb-[28px] p-0 list-none grid gap-[9px] text-[13.5px] leading-[1.5] flex-1";
const SECTION_LABEL = "text-[11px] tracking-[.3em] text-[rgba(33,30,25,.5)]";
const H2 = "font-semibold text-[24px] md:text-[clamp(24px,2.6vw,34px)] leading-[1.3]";
const POLICY_ROW = "grid grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)] gap-[14px] py-[13px] text-[13.5px] leading-[1.5]";

function Li({ children, dark }: { children: React.ReactNode; dark?: boolean }) {
  return (
    <li className="flex gap-[10px]">
      <span className={dark ? "text-gold" : "text-brownHover"}>—</span>
      {children}
    </li>
  );
}
function Scroll({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`bg-cream border border-[rgba(33,30,25,.14)] overflow-x-auto [-webkit-overflow-scrolling:touch] ${className}`}>
      <table className="border-collapse w-full [&_tbody_tr:last-child_td]:border-b-0">{children}</table>
    </div>
  );
}
function Cta({ href, className, children }: { href: string; className: string; children: React.ReactNode }) {
  return href.startsWith("/") ? <Link href={href} className={className}>{children}</Link> : <a href={href} className={className} target="_blank" rel="noreferrer">{children}</a>;
}
const won = (n: unknown) => Number(n ?? 0).toLocaleString("ko-KR");

export default async function PricingPage() {
  const d = await getPageDocs("pricing");
  const hero = d["pricing.hero"], plans = d["pricing.plans"], programs = d["pricing.programs"], path = d["pricing.path"], policy = d["pricing.policy"], cta = d["pricing.cta"];
  type Plan = { name: string; price: number; unit: string; desc: string; features: string; note: string; dark?: boolean; badge?: string };
  type Row = { name: string; sub: string; price: string; priceSub: string; unit: string; desc: string };
  type PathRow = { a: string; b: string; c: string; d: string; highlight?: boolean };

  return (
    <div className="min-h-screen flex flex-col pt-[57px] md:pt-[76px]">
      <Header />
      <main className="flex-1 px-[18px] pt-[40px] pb-[96px] md:px-[40px] md:pt-[72px] md:pb-[140px]">
        <div className="w-full max-w-[1100px] mx-auto">
          <section className="mb-[64px] md:mb-[96px]">
            <div className="text-[11px] tracking-[.3em] text-brownHover mb-[22px]">{s(hero, "label")}</div>
            <h1 className="font-semibold text-[30px] md:text-[clamp(30px,4vw,52px)] leading-[1.28] mb-[24px] text-pretty"><Txt v={s(hero, "title")} breaks="hard" /></h1>
            <p className="text-[16.5px] leading-[1.75] text-[rgba(33,30,25,.68)] max-w-[600px] text-pretty"><Txt v={s(hero, "body")} breaks="hard" /></p>
          </section>

          <section className="mb-[64px] md:mb-[96px]">
            <div className={`${SECTION_LABEL} mb-[28px]`}>{s(plans, "label")}</div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-[16px] items-stretch">
              {list<Plan>(plans, "items").map((p, i) =>
                p.dark ? (
                  <div key={i} className="bg-ink text-cream px-[32px] py-[36px] flex flex-col relative">
                    {p.badge && <div className="absolute top-[18px] right-[18px] text-[10px] tracking-[.2em] px-[10px] py-[6px] bg-gold text-ink font-bold">{p.badge}</div>}
                    <div className="text-[11px] tracking-[.24em] text-gold mb-[14px]">{p.name}</div>
                    <div className={PRICE}>{won(p.price)}<span className={WON}>원</span></div>
                    <div className="text-[13px] text-[rgba(247,243,236,.6)] mt-[10px] mb-[26px]">{p.unit}</div>
                    <p className="mb-[26px] text-[14.5px] leading-[1.65] text-[rgba(247,243,236,.85)]"><Txt v={p.desc} breaks="hard" /></p>
                    <ul className={`${LIST} text-[rgba(247,243,236,.9)]`}>{lines(p.features).map((f, j) => <Li key={j} dark>{f}</Li>)}</ul>
                    <div className="border-t border-[rgba(247,243,236,.15)] pt-[16px] text-[12.5px] leading-[1.55] text-gold"><Txt v={p.note} breaks="hard" /></div>
                  </div>
                ) : (
                  <div key={i} className={CARD}>
                    <div className="text-[11px] tracking-[.24em] text-brownHover mb-[14px]">{p.name}</div>
                    <div className={PRICE}>{won(p.price)}<span className={WON}>원</span></div>
                    <div className="text-[13px] text-[rgba(33,30,25,.55)] mt-[10px] mb-[26px]">{p.unit}</div>
                    <p className="mb-[26px] text-[14.5px] leading-[1.65] text-[rgba(33,30,25,.75)]"><Txt v={p.desc} breaks="hard" /></p>
                    <ul className={`${LIST} text-[rgba(33,30,25,.8)]`}>{lines(p.features).map((f, j) => <Li key={j}>{f}</Li>)}</ul>
                    <div className="border-t border-[rgba(33,30,25,.12)] pt-[16px] text-[12.5px] leading-[1.55] text-brown"><Txt v={p.note} breaks="hard" /></div>
                  </div>
                ),
              )}
            </div>
          </section>

          <section className="mb-[64px] md:mb-[96px]">
            <div className={`${SECTION_LABEL} mb-[16px]`}>{s(programs, "label")}</div>
            <h2 className={`${H2} mb-[12px]`}>{s(programs, "title")}</h2>
            <p className="mb-[32px] text-[15px] leading-[1.7] text-[rgba(33,30,25,.65)] max-w-[600px]">{s(programs, "lead")}</p>
            <Scroll>
              <thead><tr><th className={TH}>프로그램</th><th className={TH}>가격</th><th className={TH}>단위</th><th className={TH}>내용</th></tr></thead>
              <tbody>
                {list<Row>(programs, "rows").map((r, i) => (
                  <tr key={i}>
                    <td className={TD}><b>{r.name}</b>{r.sub && <div className={SUB}>{r.sub}</div>}</td>
                    <td className={`${TD} whitespace-nowrap`}><b>{r.price}</b>{r.priceSub && <div className={SUB}><Txt v={r.priceSub} breaks="hard" /></div>}</td>
                    <td className={`${TD} whitespace-nowrap`}>{r.unit}</td>
                    <td className={TD}>{r.desc}</td>
                  </tr>
                ))}
              </tbody>
            </Scroll>
          </section>

          <section className="mb-[64px] md:mb-[96px]">
            <div className={`${SECTION_LABEL} mb-[16px]`}>{s(path, "label")}</div>
            <h2 className={`${H2} mb-[32px]`}>{s(path, "title")}</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-[rgba(33,30,25,.14)] border border-[rgba(33,30,25,.14)]">
              {list(path, "steps").map((c, i) => (
                <div key={i} className="bg-cream px-[28px] py-[30px]">
                  <div className="text-[11px] tracking-[.2em] text-brownHover mb-[12px]">{c.s}</div>
                  <div className="text-[17px] font-semibold mb-[8px]">{c.t}</div>
                  <div className="text-[13.5px] leading-[1.6] text-[rgba(33,30,25,.65)]">{c.d}</div>
                </div>
              ))}
            </div>
            <Scroll className="mt-[28px]">
              <thead><tr><th className={TH}>선택안</th><th className={TH}>결제액</th><th className={TH}>포함 구성</th><th className={TH}>적합 고객</th></tr></thead>
              <tbody>
                {list<PathRow>(path, "rows").map((r, i) => (
                  <tr key={i} className={r.highlight ? "bg-[rgba(226,180,120,.18)]" : ""}>
                    <td className={TD}>{r.highlight ? <b>{r.a}</b> : r.a}</td>
                    <td className={`${TD} whitespace-nowrap`}>{r.highlight ? <b>{r.b}</b> : r.b}</td>
                    <td className={TD}>{r.highlight ? <b>{r.c}</b> : r.c}</td>
                    <td className={TD}>{r.highlight ? <b>{r.d}</b> : r.d}</td>
                  </tr>
                ))}
              </tbody>
            </Scroll>
          </section>

          <section className="mb-[64px] md:mb-[96px]">
            <div className={`${SECTION_LABEL} mb-[16px]`}>{s(policy, "label")}</div>
            <h2 className={`${H2} mb-[32px]`}>{s(policy, "title")}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-[16px] items-start">
              {(["conversions", "rules"] as const).map((key) => {
                const rows = list<{ k: string; v: string }>(policy, key);
                return (
                  <div key={key} className="bg-cream border border-[rgba(33,30,25,.14)] p-[30px]">
                    <div className="text-[12px] tracking-[.2em] text-brownHover mb-[18px]">{s(policy, key === "conversions" ? "leftTitle" : "rightTitle")}</div>
                    <div className="grid">
                      {rows.map((r, i) => (
                        <div key={i} className={`${POLICY_ROW} ${i < rows.length - 1 ? "border-b border-[rgba(33,30,25,.1)]" : ""}`}>
                          <b>{r.k}</b><span className="text-[rgba(33,30,25,.7)]">{r.v}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
            {s(policy, "note") && <p className="mt-[24px] text-[12.5px] leading-[1.7] text-[rgba(33,30,25,.5)]">{s(policy, "note")}</p>}
          </section>

          <section className="bg-ink text-cream px-[48px] py-[64px] text-center">
            <div className="text-[11px] tracking-[.3em] text-gold mb-[20px]">{s(cta, "label")}</div>
            <h2 className="font-semibold text-[24px] md:text-[clamp(24px,2.8vw,36px)] leading-[1.3] mb-[16px]">{s(cta, "title")}</h2>
            <p className="mx-auto mb-[36px] text-[15px] leading-[1.7] text-[rgba(247,243,236,.7)] max-w-[520px]"><Txt v={s(cta, "body")} breaks="hard" /></p>
            <div className="flex gap-[12px] justify-center flex-wrap">
              {s(cta, "cta1Label") && <Cta href={s(cta, "cta1Href")} className="inline-flex items-center px-[32px] py-[16px] rounded-pill bg-gold text-ink text-[14px] font-bold hover:bg-goldHover hover:text-ink">{s(cta, "cta1Label")}</Cta>}
              {s(cta, "cta2Label") && <Cta href={s(cta, "cta2Href")} className="inline-flex items-center px-[32px] py-[16px] rounded-pill border border-[rgba(247,243,236,.35)] text-cream text-[14px] hover:border-gold hover:text-gold">{s(cta, "cta2Label")}</Cta>}
            </div>
          </section>
        </div>
      </main>
      <SiteFooter />
      <UpButton />
    </div>
  );
}
