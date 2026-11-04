import Link from "next/link";
import { Header } from "@/components/site/Header";
import { SiteFooter } from "@/components/site/SiteFooter";
import { UpButton } from "@/components/site/UpButton";
import { Container } from "@/components/ui/ds";
import { getBrand } from "@/lib/cms/get";
import { getSettings } from "@/lib/settings/get";
import { isLeadHiddenHref } from "@/lib/settings/leadMode";
import { businessInfo } from "@/lib/site/business";

export type LegalSection = { title: string; body: string[] };

const NAV = [
  { href: "/terms", label: "이용약관" },
  { href: "/privacy", label: "개인정보처리방침" },
  { href: "/refund", label: "환불규정" },
];

/**
 * 약관류 공통 레이아웃 (Wanted DS: 제목 + 탭 + 본문 카드). 본문 기본값은 lib/legal/content.ts, 수정본은 CMS(site_content legal.*).
 * 리드 모드면 상단 탭에서 환불규정(숨김 페이지)을 뺀다. 상단 "사업자 정보" 표와 하단 문의 줄은 global.brand 값.
 */
export async function LegalPage({ overline, title, updated, sections, current, placeholder = true }: { overline: string; title: string; updated: string; sections: LegalSection[]; current: string; placeholder?: boolean }) {
  const [{ leadMode }, brand] = await Promise.all([getSettings(), getBrand()]);
  const nav = NAV.filter((n) => !(leadMode && isLeadHiddenHref(n.href)));
  const biz = businessInfo(brand);
  const phone = brand.phone || "02-6925-4786";
  const email = brand.email || "theraumai@gmail.com";
  return (
    <div className="min-h-screen flex flex-col pt-[56px] md:pt-[64px]">
      <Header />
      <main className="flex-1 py-[40px] md:py-[64px]">
        <Container className="!max-w-[860px]">
          <div className="anim-up t-eyebrow text-primary mb-[8px]">{overline}</div>
          <h1 className="anim-up t-title-2 md:t-title-1 text-label mb-[8px]">{title}</h1>
          <div className="t-label-1 text-labelAlt mb-[24px]">시행일 {updated}</div>
          <nav aria-label="약관 문서" className="flex gap-[24px] border-b border-lineAlt mb-[32px]">
            {nav.map((n) => {
              const on = n.href === current;
              return (
                <Link key={n.href} href={n.href} aria-current={on ? "page" : undefined} className={`t-headline-2 py-[12px] -mb-px border-b-2 transition-colors ${on ? "border-label text-label" : "border-transparent text-labelAssist hover:text-label hover:border-lineNeutral"}`}>
                  {n.label}
                </Link>
              );
            })}
          </nav>
          {placeholder && (
            <div className="bg-[rgba(255,146,0,.1)] rounded-ds px-[18px] py-[14px] t-label-1-reading text-cautionaryFg mb-[28px]">
              아래 내용은 <b>자리 문구</b>입니다. 법무 검토를 거친 실제 문구로 교체해야 하며, 토스페이먼츠 심사 전에 반드시 확정해 주세요.
            </div>
          )}
          {biz.length > 0 && (
            <section aria-label="사업자 정보" className="mb-[32px] bg-sand rounded-ds px-[20px] py-[16px]">
              <div className="t-caption-1 font-semibold text-labelAlt mb-[8px]">사업자 정보</div>
              <dl className="grid grid-cols-[auto_1fr] gap-x-[16px] gap-y-[4px] t-label-1-reading text-labelNeutral">
                {biz.map((i) => (
                  <div key={i.label} className="contents">
                    <dt className="text-labelAlt">{i.label}</dt>
                    <dd className="m-0">{i.value}</dd>
                  </div>
                ))}
              </dl>
            </section>
          )}
          <article className="grid gap-[32px]">
            {sections.map((s, i) => {
              const heading = /^(제\s*\d+\s*조|부칙|개정 이력)/.test(s.title) || (i === 0 && /처리방침$/.test(s.title)) ? s.title : `제${i + 1}조 (${s.title})`;
              const autoNumber = s.body.length > 1 && !s.body.some((l) => /^\d+\.\s/.test(l));
              return (
                <section key={i} id={`s${i + 1}`}>
                  <h2 className="t-headline-1 text-label mb-[10px]">{heading}</h2>
                  <div className="grid gap-[8px]">
                    {s.body.map((p, j) => (
                      <p key={j} className="m-0 t-body-2-reading text-labelNeutral text-pretty">{autoNumber ? `${j + 1}. ` : ""}{p}</p>
                    ))}
                  </div>
                </section>
              );
            })}
          </article>
          <div className="mt-[48px] pt-[20px] border-t border-lineAlt t-label-1-reading text-labelAlt">
            문의: RAUM SOCIAL CLUB · {phone} · <a href={`mailto:${email}`} className="text-primary underline">{email}</a>
          </div>
        </Container>
      </main>
      <SiteFooter />
      <UpButton />
    </div>
  );
}
