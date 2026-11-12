import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo/get";
import { Header } from "@/components/site/Header";
import { SiteFooter } from "@/components/site/SiteFooter";
import { UpButton } from "@/components/site/UpButton";
import { Txt, lines } from "@/components/cms/Txt";
import { CARD, Container } from "@/components/ui/ds";
import { PartnerForm } from "@/components/partner/PartnerForm";
import type { PartnerKind } from "@/lib/partner/types";
import { getBrand, getDoc, list, s } from "@/lib/cms/get";

export async function generateMetadata(): Promise<Metadata> {
  return pageMetadata("partner");
}

type Track = { title: string; body: string; examples: string };

/**
 * 제휴문의 (/partner). 푸터 「제휴문의」 열에서 들어온다.
 * 상단 소개 → 협업 분야 카드(브랜드·콘텐츠 / 기업·단체 / 공간·행사) → 제휴문의 양식(PartnerForm → /api/partner → 어드민 /admin/partners) → 제안서 안내.
 * 문구는 CMS partner.page, 첨부 안내용 제휴 담당 이메일은 global.brand.partnerEmail. ?kind=brand|corporate|venue|other 로 문의 유형을 미리 고를 수 있다(협업 분야 카드 버튼).
 */
const KINDS = ["brand", "corporate", "venue", "other"] as const;

export default async function PartnerPage({ searchParams }: { searchParams: Promise<{ kind?: string }> }) {
  const [{ kind: kindParam }, d, b] = await Promise.all([searchParams, getDoc("partner.page"), getBrand()]);
  const initialKind = (KINDS as readonly string[]).includes(kindParam ?? "") ? (kindParam as PartnerKind) : undefined;
  const tracks = list<Track>(d, "tracks");
  const guide = lines(s(d, "guideItems"));
  const partnerEmail = b.partnerEmail || "";
  const F = (k: string) => s(d, k);
  const copy = {
    formTitle: F("formTitle"), formNote: F("formNote"), kindLabel: F("kindLabel"), kindBrand: F("kindBrand"), kindCorporate: F("kindCorporate"), kindVenue: F("kindVenue"), kindOther: F("kindOther"),
    companyLabel: F("companyLabel"), companyPlaceholder: F("companyPlaceholder"), nameLabel: F("nameLabel"), namePlaceholder: F("namePlaceholder"), phoneLabel: F("phoneLabel"), phoneHelp: F("phoneHelp"), emailLabel: F("emailLabel"), emailPlaceholder: F("emailPlaceholder"),
    messageLabel: F("messageLabel"), messagePlaceholder: F("messagePlaceholder"), messageHelp: F("messageHelp"), readyHint: F("readyHint"), attachLabel: F("attachLabel"), attachHelp: F("attachHelp"), attachButton: F("attachButton"), attachNote: F("attachNote"),
    consentTitle: F("consentTitle"), consentAgree: F("consentAgree"), consentCollect: F("consentCollect"), consentPurpose: F("consentPurpose"), consentRetention: F("consentRetention"), consentRefuse: F("consentRefuse"), consentMore: F("consentMore"),
    submitLabel: F("submitLabel"), submittingLabel: F("submittingLabel"), submitNote: F("submitNote"), doneTitle: F("doneTitle"), doneBody: F("doneBody"), doneHome: F("doneHome"),
  };

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
                    {KINDS[i] && <a href={`?kind=${KINDS[i]}#form`} className="mt-[14px] self-start t-label-1 font-semibold text-primary link-grow">{s(d, "trackCta")} →</a>}
                  </div>
                ))}
              </div>
            </section>
          )}

          <section data-fold id="form" className="mb-[48px] md:mb-[64px] scroll-mt-[80px]" aria-labelledby="partner-contact">
            <h2 id="partner-contact" data-reveal className="t-heading-1 text-label mb-[16px]">{s(d, "contactTitle")}</h2>
            <div data-reveal><PartnerForm copy={copy} partnerEmail={partnerEmail} initialKind={initialKind} /></div>
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
