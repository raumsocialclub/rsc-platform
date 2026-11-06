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
import { Txt, lines } from "@/components/cms/Txt";
import { getPageDocs, list, on, s } from "@/lib/cms/get";
import { pageMetadata } from "@/lib/seo/get";
import { hasPrice } from "@/lib/settings/leadMode";
import { Badge, ButtonLink, CARD, CARD_HOVER, Container, SectionHead } from "@/components/ui/ds";

export async function generateMetadata(): Promise<Metadata> {
  return pageMetadata("matching");
}

const SECTION = "py-[64px] md:py-[112px]";
type Plan = { name: string; tag: string; features: string; badge: string; dark?: boolean };

/**
 * 1:1 매칭(결혼중개 멤버십 ACCESS · SIGNATURE) 트랙 페이지. 사업전략(2026.11.03) 기준.
 * 상단 소개 → 01 가입 심사(아무나 들어올 수 없습니다) → 02 진행 방식 4단계 → 03 멤버십 구성(ACCESS · SIGNATURE · MERRY — 금액은 비공개, 대면 상담 안내)
 * → 회원 전용 행사(SOCIAL NIGHT · GRAND BALL · RAUM SOLO, home.solo 재사용) → 04 다른 점 → 05 이런 분께 → 06 FAQ → CTA.
 * 문구는 CMS(matching.* + home.solo). 모든 상담 버튼은 /fit-check?track=matching.
 */
export default async function MatchingPage() {
  const d = await getPageDocs(["matching", "home"]);
  const hero = d["matching.hero"], verify = d["matching.verify"], how = d["matching.how"], plans = d["matching.plans"], diff = d["matching.diff"], who = d["matching.who"], faq = d["matching.faq"], solo = d["home.solo"];
  const planItems = list<Plan>(plans, "items");
  // 가입비·연회비는 비공개(대면 상담 안내): 리드 모드와 무관하게 금액이 들어간 줄은 모두 뺀다
  const extras = lines(s(plans, "extras")).filter((x) => !hasPrice(x));
  const planNote = s(plans, "note");
  const faqItems = list<{ q: string; a: string }>(faq, "items").filter((x) => x.q && x.a).filter((x) => !hasPrice(x.q + x.a));

  return (
    <div className="pt-[56px] md:pt-[64px]">
      <Header />
      <TrackSwitch current="matching" />
      <TrackHero doc={hero} />

      {/* 01 VERIFIED MEMBERS */}
      {on(verify, "visible") && <VerifySection doc={verify} />}

      {/* 02 HOW IT WORKS */}
      {on(how, "visible") && (
        <section id="how" data-fold className={SECTION}>
          <Container>
            <SectionHead eyebrow={s(how, "label")} title={<Txt v={s(how, "title")} breaks="hard" />} lead={<Txt v={s(how, "lead")} />} reveal />
            <ol className="grid grid-cols-1 gap-[12px] md:grid-cols-4 md:gap-[16px] mt-[40px] list-none p-0 m-0">
              {list(how, "steps").map((st, i, arr) => (
                <li key={i} data-reveal style={{ "--d": `${i * 90}ms` } as React.CSSProperties} className={`${CARD} ${CARD_HOVER} p-[24px] md:p-[28px] relative`}>
                  <div className="flex items-center gap-[10px] mb-[16px]">
                    <span className="w-[40px] h-[40px] rounded-full bg-primary text-white flex items-center justify-center t-label-1 font-bold">{String(i + 1).padStart(2, "0")}</span>
                    {i < arr.length - 1 && <span aria-hidden className="hidden md:block flex-1 h-px bg-lineNeutral" />}
                  </div>
                  <h3 className="t-heading-2 text-label mb-[8px]">{st.title}</h3>
                  <p className="t-body-2-reading text-labelAlt text-pretty m-0"><Txt v={st.body} /></p>
                </li>
              ))}
            </ol>
          </Container>
        </section>
      )}

      {/* 03 MEMBERSHIP (ACCESS · SIGNATURE · MERRY) */}
      {on(plans, "visible") && planItems.length > 0 && (
        <section id="plans" data-fold className={`${SECTION} bg-sand`}>
          <Container>
            <SectionHead eyebrow={s(plans, "label")} title={<Txt v={s(plans, "title")} breaks="hard" />} lead={<Txt v={s(plans, "lead")} />} reveal />
            <div className="grid grid-cols-1 gap-[12px] md:grid-cols-3 md:gap-[16px] mt-[40px]">
              {planItems.map((p, i) => (
                <article key={i} data-reveal style={{ "--d": `${i * 90}ms` } as React.CSSProperties} className={`${p.dark ? "bg-inverseBg text-inverseLabel border border-inverseBg" : CARD} ${CARD_HOVER} rounded-ds p-[24px] md:p-[28px] flex flex-col`}>
                  <div className="flex items-center justify-between gap-[8px] mb-[12px]">
                    <h3 className={`t-heading-1 ${p.dark ? "text-white" : "text-label"}`}>{p.name}</h3>
                    {p.badge && <Badge tone={p.dark ? "inverse" : "primary"} className={p.dark ? "!bg-white !text-label" : ""}>{p.badge}</Badge>}
                  </div>
                  <p className={`t-body-2 font-medium m-0 mb-[16px] pb-[16px] border-b ${p.dark ? "text-white/80 border-white/20" : "text-labelNeutral border-lineAlt"}`}>{p.tag}</p>
                  <ul className="list-none p-0 m-0 grid gap-[8px]">
                    {lines(p.features).filter((f) => !hasPrice(f)).map((f, j) => (
                      <li key={j} className={`flex gap-[10px] items-start t-label-1-reading ${p.dark ? "text-white/85" : "text-labelAlt"}`}>
                        <svg aria-hidden width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={`flex-none mt-[3px] ${p.dark ? "text-white" : "text-primary"}`}><path d="M5 12l5 5L20 7" /></svg>
                        <span className="text-pretty">{f}</span>
                      </li>
                    ))}
                  </ul>
                  <div className="mt-auto pt-[20px]">
                    <ButtonLink href="/fit-check?track=matching" variant={p.dark ? "inverse" : "outlined"} size="md" className="w-full">{/MERRY/i.test(p.name) ? "별도 상담 신청" : `${p.name} 상담 신청`}</ButtonLink>
                  </div>
                </article>
              ))}
            </div>
            {extras.length > 0 && (
              <div data-reveal className={`${CARD} mt-[16px] p-[20px] md:p-[24px] grid grid-cols-1 md:grid-cols-[120px_minmax(0,1fr)] gap-[8px] md:gap-[24px]`}>
                <div className="t-label-1 font-semibold text-primary">필요한 만큼 추가</div>
                <ul className="list-none p-0 m-0 grid gap-[6px] md:grid-cols-3 md:gap-[12px]">
                  {extras.map((x, i) => <li key={i} className="t-label-1-reading text-labelNeutral text-pretty">{x}</li>)}
                </ul>
              </div>
            )}
            {planNote && !hasPrice(planNote) && <p data-reveal className="t-label-1-reading text-labelAlt mt-[16px] text-pretty max-w-[800px]"><Txt v={planNote} /></p>}
          </Container>
        </section>
      )}

      {/* MEMBERS ONLY: SOCIAL NIGHT · GRAND BALL · RAUM SOLO */}
      {on(solo, "visible") && <MembersOnly doc={solo} eyebrow="MEMBERS ONLY" title={"1:1 매칭 회원만의\n특별한 시간"} lead="ACCESS · SIGNATURE 회원은 참여권 차감 없이 분기 테마 나이트와 연말 그랜드 볼에 참여합니다. SIGNATURE 회원은 기수제 로테이션 프로그램 RAUM SOLO 1기가 포함됩니다." />}

      {/* 04 WHY RSC */}
      {on(diff, "visible") && (
        <section id="why" data-fold className={`${SECTION} bg-sand`}>
          <Container>
            <SectionHead eyebrow={s(diff, "label")} title={<Txt v={s(diff, "title")} breaks="hard" />} reveal />
            <div className="grid grid-cols-1 gap-[12px] sm:grid-cols-2 md:grid-cols-4 md:gap-[16px] mt-[40px]">
              {list(diff, "items").map((c, i) => (
                <div key={i} data-reveal style={{ "--d": `${i * 90}ms` } as React.CSSProperties} className={`${CARD} ${CARD_HOVER} p-[24px] md:p-[28px]`}>
                  <div className="t-caption-1 font-semibold text-primary mb-[8px]">{c.label}</div>
                  <div className="t-heading-2 text-label mb-[10px] text-pretty">{c.title}</div>
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

      <CtaBand track="matching" title="1:1 매칭, 상담으로 시작해 보세요" body="이름과 연락처만 남기면 담당자가 직접 연락드립니다. 가입이 아닌 상담 신청이며, 비용은 없습니다." />

      <SiteFooter />
      <UpButton />
    </div>
  );
}
