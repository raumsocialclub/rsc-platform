import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo/get";
import { Header } from "@/components/site/Header";
import { SiteFooter } from "@/components/site/SiteFooter";
import { UpButton } from "@/components/site/UpButton";
import { Txt, lines } from "@/components/cms/Txt";
import { ButtonLink, CARD, CARD_ALT, Container, btn } from "@/components/ui/ds";
import { getBrand, getDoc, list, s } from "@/lib/cms/get";

export async function generateMetadata(): Promise<Metadata> {
  return pageMetadata("partner");
}

type Track = { title: string; body: string; examples: string };

/**
 * 제휴문의 (/partner). 푸터 「제휴문의」 열에서 들어온다.
 * 상단 소개 → 협업 분야 카드(브랜드·콘텐츠 / 기업·단체 / 공간·행사) → 연락처 두 카드(제휴 담당 · 일반 문의) → 제안서 안내.
 * 문구는 CMS partner.page, 연락처는 global.brand(partnerPhone·partnerEmail / phone·email). 신청 양식 대신 메일·전화로 받는다.
 */
export default async function PartnerPage() {
  const [d, b] = await Promise.all([getDoc("partner.page"), getBrand()]);
  const tracks = list<Track>(d, "tracks");
  const guide = lines(s(d, "guideItems"));
  const partnerPhone = b.partnerPhone || "", partnerEmail = b.partnerEmail || "";
  const mailto = partnerEmail ? `mailto:${partnerEmail}?subject=${encodeURIComponent(s(d, "mailSubject"))}` : "";

  return (
    <div className="min-h-screen flex flex-col pt-[56px] md:pt-[64px]">
      <Header />
      <main className="flex-1 py-[48px] md:py-[80px]">
        <Container>
          <section className="text-center max-w-[680px] mx-auto mb-[40px] md:mb-[56px]">
            <div className="anim-up t-eyebrow text-primary mb-[10px]">{s(d, "eyebrow")}</div>
            <h1 className="anim-up t-title-1 md:t-display-3 text-label mb-[14px] text-pretty"><Txt v={s(d, "title")} /></h1>
            <p className="anim-up-2 t-body-1-reading text-labelAlt text-pretty"><Txt v={s(d, "body")} /></p>
          </section>

          {tracks.length > 0 && (
            <section data-fold className="mb-[48px] md:mb-[64px]" aria-labelledby="partner-tracks">
              <h2 id="partner-tracks" data-reveal className="t-heading-1 text-label mb-[16px]">{s(d, "tracksTitle")}</h2>
              <div className="grid gap-[16px] md:grid-cols-3">
                {tracks.map((t, i) => (
                  <div key={t.title} data-reveal style={{ "--d": `${i * 80}ms` } as React.CSSProperties} className={`${CARD} p-[24px] flex flex-col`}>
                    <div className="t-caption-1 text-labelAssist mb-[6px]">{String(i + 1).padStart(2, "0")}</div>
                    <h3 className="t-headline-1 text-label mb-[10px] text-pretty">{t.title}</h3>
                    <p className="t-body-2-reading text-labelAlt text-pretty mb-[14px]"><Txt v={t.body} /></p>
                    {t.examples && <p className="mt-auto t-caption-1 text-labelNeutral">{t.examples}</p>}
                  </div>
                ))}
              </div>
            </section>
          )}

          <section data-fold className="mb-[48px] md:mb-[64px]" aria-labelledby="partner-contact">
            <h2 id="partner-contact" data-reveal className="t-heading-1 text-label mb-[16px]">{s(d, "contactTitle")}</h2>
            <div className="grid gap-[16px] md:grid-cols-2">
              <div data-reveal className={`${CARD} p-[24px] md:p-[32px] flex flex-col`} data-testid="partner-card">
                <h3 className="t-headline-1 text-label mb-[8px]">{s(d, "partnerCardTitle")}</h3>
                <p className="t-body-2-reading text-labelAlt text-pretty mb-[20px]"><Txt v={s(d, "partnerCardBody")} /></p>
                <div className="flex flex-col gap-[6px] mb-[24px]">
                  {partnerPhone && <a href={`tel:${partnerPhone}`} className="t-title-3 md:t-title-2 text-primary tabular-nums hover:underline">{partnerPhone}</a>}
                  {partnerEmail && <a href={`mailto:${partnerEmail}`} className="t-body-1 text-label break-all hover:text-primary">{partnerEmail}</a>}
                </div>
                {mailto && <a href={mailto} className={btn("solid", "lg", "mt-auto self-start max-md:w-full")}>{s(d, "partnerCtaLabel")}</a>}
              </div>
              <div data-reveal style={{ "--d": "80ms" } as React.CSSProperties} className={`${CARD_ALT} p-[24px] md:p-[32px] flex flex-col`} data-testid="general-card">
                <h3 className="t-headline-1 text-label mb-[8px]">{s(d, "generalCardTitle")}</h3>
                <p className="t-body-2-reading text-labelAlt text-pretty mb-[20px]"><Txt v={s(d, "generalCardBody")} /></p>
                <div className="flex flex-col gap-[6px] mb-[24px]">
                  {b.phone && <a href={`tel:${b.phone}`} className="t-title-3 md:t-title-2 text-label tabular-nums hover:underline">{b.phone}</a>}
                  {b.email && <a href={`mailto:${b.email}`} className="t-body-1 text-label break-all hover:text-primary">{b.email}</a>}
                </div>
                <ButtonLink href="/fit-check" variant="outlined" size="lg" className="mt-auto self-start max-md:w-full">{s(d, "generalCtaLabel")}</ButtonLink>
              </div>
            </div>
          </section>

          {guide.length > 0 && (
            <section data-fold aria-labelledby="partner-guide">
              <div data-reveal className={`${CARD} p-[24px] md:p-[32px]`}>
                <h2 id="partner-guide" className="t-heading-1 text-label mb-[14px]">{s(d, "guideTitle")}</h2>
                <ol className="grid gap-[10px] md:grid-cols-2 list-none m-0 p-0">
                  {guide.map((g, i) => (
                    <li key={g} className="flex items-start gap-[10px] t-body-2 text-labelNeutral">
                      <span className="flex-none w-[24px] h-[24px] rounded-full bg-sand text-labelAlt t-caption-1 flex items-center justify-center tabular-nums">{i + 1}</span>
                      <span className="pt-[2px]">{g}</span>
                    </li>
                  ))}
                </ol>
                {s(d, "guideNote") && <p className="mt-[16px] t-caption-1 text-labelAlt text-pretty"><Txt v={s(d, "guideNote")} /></p>}
              </div>
            </section>
          )}
        </Container>
      </main>
      <SiteFooter />
      <UpButton />
    </div>
  );
}
