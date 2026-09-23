import Link from "next/link";
import { Header } from "@/components/site/Header";
import { SiteFooter } from "@/components/site/SiteFooter";
import { UpButton } from "@/components/site/UpButton";

export type LegalSection = { title: string; body: string[] };

const NAV = [
  { href: "/terms", label: "이용약관" },
  { href: "/privacy", label: "개인정보처리방침" },
  { href: "/refund", label: "환불규정" },
];

/**
 * 약관류 공통 레이아웃 (Design.md 규칙: 크림 배경, 좌측 정렬 본문, 상단 라벨 + 제목).
 * 본문은 lib/legal/*.ts 의 자리 문구 — 실제 문구는 사용자 제공 후 교체한다.
 */
export function LegalPage({ overline, title, updated, sections, current, placeholder = true }: { overline: string; title: string; updated: string; sections: LegalSection[]; current: string; placeholder?: boolean }) {
  return (
    <div className="min-h-screen flex flex-col pt-[57px] md:pt-[76px]">
      <Header />
      <main className="flex-1 px-[18px] pt-[40px] pb-[96px] md:px-[40px] md:pt-[72px] md:pb-[140px]">
        <div className="w-full max-w-[820px] mx-auto">
          <div className="text-[11px] tracking-[.3em] text-[rgba(33,30,25,.5)] mb-[16px]">{overline}</div>
          <h1 className="font-medium text-[28px] md:text-[clamp(28px,3.4vw,40px)] leading-[1.3] mb-[14px]">{title}</h1>
          <div className="text-[13px] text-[rgba(33,30,25,.62)] mb-[28px]">시행일 {updated}</div>
          <nav aria-label="약관 문서" className="flex gap-[8px] flex-wrap mb-[36px]">
            {NAV.map((n) => {
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
          <article className="grid gap-[32px]">
            {sections.map((s, i) => (
              <section key={i} id={`s${i + 1}`}>
                <h2 className="font-semibold text-[17px] md:text-[19px] leading-[1.4] mb-[12px]">제{i + 1}조 ({s.title})</h2>
                <div className="grid gap-[8px]">
                  {s.body.map((p, j) => (
                    <p key={j} className="m-0 text-[14.5px] leading-[1.85] text-[rgba(33,30,25,.78)]" style={{ textWrap: "pretty" }}>{s.body.length > 1 ? `${j + 1}. ` : ""}{p}</p>
                  ))}
                </div>
              </section>
            ))}
          </article>
          <div className="mt-[48px] pt-[24px] border-t border-[rgba(33,30,25,.12)] text-[13px] leading-[1.7] text-[rgba(33,30,25,.62)]">
            문의: RAUM SOCIAL CLUB · 02-538-3366 · <a href="mailto:support@theraum.co.kr" className="text-brown underline">support@theraum.co.kr</a>
          </div>
        </div>
      </main>
      <SiteFooter />
      <UpButton />
    </div>
  );
}
