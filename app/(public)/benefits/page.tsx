import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo/get";
import Link from "next/link";
import { Header } from "@/components/site/Header";
import { SiteFooter } from "@/components/site/SiteFooter";
import { UpButton } from "@/components/site/UpButton";
import { Txt, lines } from "@/components/cms/Txt";
import { getPageDocs, list, s } from "@/lib/cms/get";

export async function generateMetadata(): Promise<Metadata> {
  return pageMetadata("benefits");
}

/* deploy/benefits.html 재현. 혜택 목록은 CMS(site_content benefits.rows) */

type Row = { group: string; title: string; badge: string; lines: string; right: string; rightStrong?: string };

/** "회당 평균\n{{strong}} 상당 절감" → strong 자리에 굵은 금액 */
function Right({ v, strong }: { v: string; strong?: string }) {
  const parts = String(v ?? "").split("\n");
  return (
    <>
      {parts.map((line, i) => {
        const seg = line.split("{{strong}}");
        return (
          <span key={i}>
            {seg.map((t, j) => (
              <span key={j}>{t}{j < seg.length - 1 && <b className="text-ink text-[15px]">{strong}</b>}</span>
            ))}
            {i < parts.length - 1 && <br />}
          </span>
        );
      })}
    </>
  );
}

export default async function BenefitsPage() {
  const d = await getPageDocs("benefits");
  const hero = d["benefits.hero"], cta = d["benefits.cta"];
  const items = list<Row>(d["benefits.rows"], "items");
  const groups: { name: string; rows: (Row & { n: string })[] }[] = [];
  items.forEach((r, i) => {
    const n = String(i + 1).padStart(2, "0");
    const g = groups.find((x) => x.name === r.group);
    if (g) g.rows.push({ ...r, n });
    else groups.push({ name: r.group, rows: [{ ...r, n }] });
  });

  return (
    <div className="min-h-screen flex flex-col pt-[57px] md:pt-[76px]">
      <Header />
      <main className="flex-1 px-[18px] pt-[40px] pb-[96px] md:px-[40px] md:pt-[72px] md:pb-[140px]">
        <div className="w-full max-w-[960px] mx-auto">
          <section className="text-center mb-[56px]">
            <div className="text-[11px] tracking-[.3em] text-brownHover mb-[22px]">{s(hero, "label")}</div>
            <h1 className="font-semibold text-[30px] md:text-[clamp(30px,4vw,48px)] leading-[1.28] mb-[20px] text-pretty">{s(hero, "title")}</h1>
            <p className="mx-auto text-[16px] leading-[1.75] text-[rgba(33,30,25,.68)] max-w-[520px] text-pretty"><Txt v={s(hero, "body")} breaks="hard" /></p>
          </section>

          <section className="border border-[rgba(33,30,25,.14)] mb-[64px]">
            <div className="flex justify-between items-center gap-[12px] px-[28px] py-[16px] bg-ink text-cream">
              <span className="text-[12px] tracking-[.2em] font-semibold">{s(hero, "tableTitle")}</span>
              <span className="text-[11px] tracking-[.14em] text-[rgba(247,243,236,.65)]">{items.length} BENEFITS · {groups.length} CATEGORIES</span>
            </div>
            {groups.map((g, gi) => (
              <div key={g.name}>
                <div className="px-[28px] py-[12px] bg-sandDeep text-[12.5px] font-semibold text-brown tracking-[.06em]">{g.name}</div>
                {g.rows.map((r, ri) => {
                  const last = gi === groups.length - 1 && ri === g.rows.length - 1;
                  const ls = lines(r.lines);
                  return (
                    <div key={r.n} className={`grid grid-cols-1 gap-[10px] px-[18px] py-[20px] md:grid-cols-[minmax(0,1.1fr)_minmax(0,1.5fr)_minmax(0,.8fr)] md:gap-[24px] md:px-[28px] md:py-[24px] bg-cream items-start ${last ? "" : "border-b border-[rgba(33,30,25,.1)]"}`}>
                      <div>
                        <div className="text-[11px] text-[rgba(33,30,25,.45)] mb-[6px]">{r.n}</div>
                        <div className="text-[16px] font-semibold mb-[10px]">{r.title}</div>
                        {r.badge && <span className="inline-block text-[11px] px-[10px] py-[4px] border border-[rgba(33,30,25,.25)] rounded-pill text-[rgba(33,30,25,.65)]">{r.badge}</span>}
                      </div>
                      <div className="text-[13.5px] leading-[1.7] text-[rgba(33,30,25,.75)]">
                        {ls.map((l, i) => <span key={i}>{l}{i < ls.length - 1 && <br />}</span>)}
                      </div>
                      <div className="text-left md:text-right text-[13px] leading-[1.6] text-[rgba(33,30,25,.6)]"><Right v={r.right} strong={r.rightStrong} /></div>
                    </div>
                  );
                })}
              </div>
            ))}
          </section>

          <section className="bg-ink text-cream px-[48px] py-[56px] text-center">
            <div className="text-[11px] tracking-[.3em] text-gold mb-[18px]">{s(cta, "label")}</div>
            <h2 className="font-semibold text-[22px] md:text-[clamp(22px,2.6vw,32px)] leading-[1.3] mb-[32px]">{s(cta, "title")}</h2>
            <div className="flex gap-[12px] justify-center flex-wrap">
              {s(cta, "cta1Label") && <Link href={s(cta, "cta1Href") || "/pricing"} className="inline-flex items-center px-[32px] py-[16px] rounded-pill bg-gold text-ink text-[14px] font-bold hover:bg-goldHover hover:text-ink">{s(cta, "cta1Label")}</Link>}
              {s(cta, "cta2Label") && <Link href={s(cta, "cta2Href") || "/fit-check"} className="inline-flex items-center px-[32px] py-[16px] rounded-pill border border-[rgba(247,243,236,.35)] text-cream text-[14px] hover:border-gold hover:text-gold">{s(cta, "cta2Label")}</Link>}
            </div>
          </section>
        </div>
      </main>
      <SiteFooter />
      <UpButton />
    </div>
  );
}
