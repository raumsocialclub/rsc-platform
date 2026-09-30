import Link from "next/link";
import { Header } from "@/components/site/Header";
import { SiteFooter } from "@/components/site/SiteFooter";
import { UpButton } from "@/components/site/UpButton";
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
 * 약관류 공통 레이아웃 (Design.md 규칙: 크림 배경, 좌측 정렬 본문, 상단 라벨 + 제목).
 * 본문 기본값은 lib/legal/content.ts, 수정본은 CMS(site_content legal.*).
 * 리드 모드면 상단 탭에서 환불규정(숨김 페이지)을 뺀다 (푸터 링크와 같은 스위치).
 * 상단 "사업자 정보" 표와 하단 문의 줄은 global.brand 값(정식 상호가 있을 때만 표 표시).
 */
export async function LegalPage({ overline, title, updated, sections, current, placeholder = true }: { overline: string; title: string; updated: string; sections: LegalSection[]; current: string; placeholder?: boolean }) {
  const [{ leadMode }, brand] = await Promise.all([getSettings(), getBrand()]);
  const nav = NAV.filter((n) => !(leadMode && isLeadHiddenHref(n.href)));
  const biz = businessInfo(brand);
  const phone = brand.phone || "02-538-3366";
  const email = brand.email || "theraumai@gmail.com";
  return (
    <div className="min-h-screen flex flex-col pt-[57px] md:pt-[76px]">
      <Header />
      <main className="flex-1 px-[18px] pt-[40px] pb-[96px] md:px-[40px] md:pt-[72px] md:pb-[140px]">
        <div className="w-full max-w-[820px] mx-auto">
          <div className="text-[11px] tracking-[.3em] text-[rgba(33,30,25,.5)] mb-[16px]">{overline}</div>
          <h1 className="font-medium text-[28px] md:text-[clamp(28px,3.4vw,40px)] leading-[1.3] mb-[14px]">{title}</h1>
          <div className="text-[13px] text-[rgba(33,30,25,.62)] mb-[28px]">시행일 {updated}</div>
          <nav aria-label="약관 문서" className="flex gap-[8px] flex-wrap mb-[36px]">
            {nav.map((n) => {
              const on = n.href === current;
              return (
                <Link key={n.href} href={n.href} className="border border-[rgba(33,30,25,.2)] px-[16px] py-[8px] rounded-pill text-[12.5px] font-semibold" style={{ background: on ? "#5a3d24" : "transparent", color: on ? "#f7f3ec" : "#5a3d24" }} aria-current={on ? "page" : undefined}>
                  {n.label}
                </Link>
              );
            })}
          </nav>
          {placeholder && (
            <div className="bg-[rgba(226,180,120,.18)] border border-[rgba(226,180,120,.6)] px-[18px] py-[14px] text-[13px] leading-[1.7] text-[#7a5420] mb-[36px]">
              아래 내용은 <b>자리 문구</b>입니다. 법무 검토를 거친 실제 문구로 교체해야 하며, 토스페이먼츠 심사 전에 반드시 확정해 주세요.
            </div>
          )}
          {biz.length > 0 && (
            <section aria-label="사업자 정보" className="mb-[36px] border border-[rgba(33,30,25,.12)] bg-[rgba(255,255,255,.35)] px-[18px] py-[14px]">
              <div className="text-[11px] tracking-[.24em] text-[rgba(33,30,25,.5)] mb-[8px]">사업자 정보</div>
              <dl className="grid grid-cols-[auto_1fr] gap-x-[16px] gap-y-[4px] text-[13.5px] leading-[1.7] text-[rgba(33,30,25,.78)]">
                {biz.map((i) => (
                  <div key={i.label} className="contents">
                    <dt className="text-[rgba(33,30,25,.55)]">{i.label}</dt>
                    <dd className="m-0">{i.value}</dd>
                  </div>
                ))}
              </dl>
            </section>
          )}
          <article className="grid gap-[32px]">
            {sections.map((s, i) => {
              // 제목이 "제N조 (…)"·"부칙"이거나 서문이면 그대로, 짧은 제목이면 번호를 붙인다
              const heading = /^(제\s*\d+\s*조|부칙|개정 이력)/.test(s.title) || (i === 0 && /처리방침$/.test(s.title)) ? s.title : `제${i + 1}조 (${s.title})`;
              // 본문 줄에 이미 "1." 같은 번호가 있으면 자동 번호를 붙이지 않는다
              const autoNumber = s.body.length > 1 && !s.body.some((l) => /^\d+\.\s/.test(l));
              return (
                <section key={i} id={`s${i + 1}`}>
                  <h2 className="font-semibold text-[17px] md:text-[19px] leading-[1.4] mb-[12px]">{heading}</h2>
                  <div className="grid gap-[8px]">
                    {s.body.map((p, j) => (
                      <p key={j} className="m-0 text-[14.5px] leading-[1.85] text-[rgba(33,30,25,.78)]" style={{ textWrap: "pretty" }}>{autoNumber ? `${j + 1}. ` : ""}{p}</p>
                    ))}
                  </div>
                </section>
              );
            })}
          </article>
          <div className="mt-[48px] pt-[24px] border-t border-[rgba(33,30,25,.12)] text-[13px] leading-[1.7] text-[rgba(33,30,25,.62)]">
            문의: RAUM SOCIAL CLUB · {phone} · <a href={`mailto:${email}`} className="text-brown underline">{email}</a>
          </div>
        </div>
      </main>
      <SiteFooter />
      <UpButton />
    </div>
  );
}
