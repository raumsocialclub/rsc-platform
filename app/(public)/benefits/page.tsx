import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo/get";
import { Header } from "@/components/site/Header";
import { SiteFooter } from "@/components/site/SiteFooter";
import { UpButton } from "@/components/site/UpButton";
import { Txt, lines } from "@/components/cms/Txt";
import { Badge, ButtonLink, CARD, Container } from "@/components/ui/ds";
import { getPageDocs, list, s } from "@/lib/cms/get";
import { getSettings } from "@/lib/settings/get";
import { hasPrice, isLeadHiddenHref } from "@/lib/settings/leadMode";

export async function generateMetadata(): Promise<Metadata> {
  return pageMetadata("benefits");
}

/* 혜택 목록은 CMS(site_content benefits.rows). 리드 모드면 금액이 들어간 오른쪽 요약과 가격 안내 버튼만 뺀다. */
const LEAD_CTA_TITLE = "멤버십 혜택은 상담에서 자세히 안내해 드립니다";

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
            {seg.map((t, j) => <span key={j}>{t}{j < seg.length - 1 && <b className="text-label">{strong}</b>}</span>)}
            {i < parts.length - 1 && <br />}
          </span>
        );
      })}
    </>
  );
}

export default async function BenefitsPage() {
  const [d, settings] = await Promise.all([getPageDocs("benefits"), getSettings()]);
  const lead = settings.leadMode;
  const hero = d["benefits.hero"], cta = d["benefits.cta"];
  const items = list<Row>(d["benefits.rows"], "items").map((r) => (lead && hasPrice(`${r.right ?? ""} ${r.rightStrong ?? ""}`) ? { ...r, right: "", rightStrong: "" } : r));
  const ctaTitle = lead && /가격/.test(s(cta, "title")) ? LEAD_CTA_TITLE : s(cta, "title");
  const showCta = (label: string, href: string) => !!label && !(lead && isLeadHiddenHref(href));
  const groups: { name: string; rows: (Row & { n: string })[] }[] = [];
  items.forEach((r, i) => {
    const n = String(i + 1).padStart(2, "0");
    const g = groups.find((x) => x.name === r.group);
    if (g) g.rows.push({ ...r, n });
    else groups.push({ name: r.group, rows: [{ ...r, n }] });
  });

  return (
    <div className="min-h-screen flex flex-col pt-[56px] md:pt-[64px]">
      <Header />
      <main className="flex-1 py-[48px] md:py-[80px]">
        <Container>
          <section className="text-center max-w-[640px] mx-auto mb-[40px] md:mb-[56px]">
            <div className="anim-up t-label-1 font-semibold text-primary mb-[10px]">{s(hero, "label")}</div>
            <h1 className="anim-up t-title-1 md:t-display-3 text-label mb-[14px] text-pretty">{s(hero, "title")}</h1>
            <p className="anim-up-2 t-body-1-reading text-labelAlt text-pretty"><Txt v={s(hero, "body")} breaks="hard" /></p>
          </section>

          <section className="mb-[48px] md:mb-[64px]">
            <div className="flex justify-between items-center gap-[12px] mb-[16px]" data-reveal>
              <h2 className="t-heading-1 text-label">{s(hero, "tableTitle")}</h2>
              <span className="t-caption-1 text-labelAlt">{items.length}개 혜택 · {groups.length}개 분류</span>
            </div>
            <div className="grid gap-[16px]">
              {groups.map((g, gi) => (
                <div key={g.name} data-reveal style={{ "--d": `${gi * 80}ms` } as React.CSSProperties} className={`${CARD} overflow-hidden`}>
                  <div className="px-[20px] py-[12px] bg-sand t-label-1 font-semibold text-labelNeutral">{g.name}</div>
                  {g.rows.map((r, ri) => {
                    const ls = lines(r.lines);
                    return (
                      <div key={r.n} className={`grid grid-cols-1 gap-[10px] px-[20px] py-[18px] md:grid-cols-[minmax(0,1.1fr)_minmax(0,1.5fr)_minmax(0,.8fr)] md:gap-[24px] md:py-[20px] items-start transition-colors hover:bg-[rgba(0,102,255,.03)] ${ri < g.rows.length - 1 ? "border-b border-lineAlt" : ""}`}>
                        <div>
                          <div className="t-caption-1 text-labelAssist mb-[4px]">{r.n}</div>
                          <div className="t-headline-2 text-label mb-[8px]">{r.title}</div>
                          {r.badge && <Badge tone="neutral">{r.badge}</Badge>}
                        </div>
                        <div className="t-body-2-reading text-labelNeutral">{ls.map((l, i) => <span key={i}>{l}{i < ls.length - 1 && <br />}</span>)}</div>
                        <div className="text-left md:text-right t-label-1-reading text-labelAlt"><Right v={r.right} strong={r.rightStrong} /></div>
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </section>

          <section data-reveal className="bg-inverseBg rounded-ds px-[24px] py-[40px] md:px-[48px] md:py-[56px] text-center">
            <div className="t-label-1 font-semibold text-inversePrimary mb-[10px]">{s(cta, "label")}</div>
            <h2 className="t-title-3 md:t-title-2 text-inverseLabel mb-[24px] text-pretty">{ctaTitle}</h2>
            <div className="flex gap-[10px] justify-center flex-wrap">
              {showCta(s(cta, "cta1Label"), s(cta, "cta1Href") || "/pricing") && <ButtonLink href={s(cta, "cta1Href") || "/pricing"} size="lg">{s(cta, "cta1Label")}</ButtonLink>}
              {showCta(s(cta, "cta2Label"), s(cta, "cta2Href") || "/fit-check") && <ButtonLink href={s(cta, "cta2Href") || "/fit-check"} variant="inverse" size="lg">{s(cta, "cta2Label")}</ButtonLink>}
            </div>
          </section>
        </Container>
      </main>
      <SiteFooter />
      <UpButton />
    </div>
  );
}
