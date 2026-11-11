import Image from "next/image";
import Link from "next/link";
import { Txt } from "@/components/cms/Txt";
import { getBrand, getNav } from "@/lib/cms/get";
import { getSettings } from "@/lib/settings/get";
import { InstagramButton } from "./InstagramButton";
import { businessInfo } from "@/lib/site/business";

const INK_FILTER = "invert(1) brightness(0.15)";
const LINK = "t-label-1 text-labelAlt hover:text-label hover:translate-x-[2px] inline-block transition-[color,transform] duration-200";

/**
 * 푸터 (Wanted DS): 연회색 배경, 브랜드 한 줄 + 메뉴·연락처·제휴문의 열, 맨 아래 약관 링크·사업자 정보.
 * 연락처·제휴 담당 연락처는 CMS(global.brand), 메뉴 이름·열 제목은 CMS(global.nav). 리드 모드면 멤버십·환불규정 링크를 숨긴다.
 * 「패밀리 사이트」 열은 2026-11 요청으로 「제휴문의 →」(/partner 로 가는 제목 링크 하나, 연락처는 페이지에서)로 바꿨다. 2열 제목은 「서비스 문의」.
 */
export async function SiteFooter() {
  const [b, n, settings] = await Promise.all([getBrand(), getNav(), getSettings()]);
  const L = (k: string, fb: string) => n[k] || fb;
  const lead = settings.leadMode;
  const biz = businessInfo(b);
  return (
    <footer className="bg-sand border-t border-lineAlt">
      <div className="max-w-[1200px] mx-auto px-[20px] md:px-[32px] pt-[56px] pb-[40px] md:pt-[72px] md:pb-[48px]">
        <div className="grid grid-cols-1 gap-[40px] md:grid-cols-[minmax(0,1.4fr)_repeat(3,minmax(0,1fr))] md:gap-[32px] mb-[48px]">
          <div>
            <Link href="/" className="inline-flex items-center gap-[10px] mb-[20px]">
              <Image src={b.logoEmblem || "/images/logo-emblem.png"} alt="RAUM SOCIAL CLUB" width={529} height={638} className="h-[28px] w-auto" style={{ filter: INK_FILTER }} unoptimized={(b.logoEmblem || "").startsWith("http")} />
              <Image src="/images/logo-text-footer.png" alt="" width={2612} height={332} className="h-[12px] w-auto" style={{ filter: INK_FILTER }} />
            </Link>
            <p className="t-headline-2 text-label max-w-[380px] text-pretty"><Txt v={b.footerHeadline} /></p>
            <div className="mt-[20px]"><InstagramButton href={b.instagramUrl} size="sm" /></div>
          </div>
          <div>
            <div className="t-label-1 font-semibold text-label mb-[14px]">{L("footerMenuTitle", "메뉴")}</div>
            <nav className="flex flex-col gap-[10px]">
              <Link href="/#about" className={LINK}>{L("navAbout", "브랜드소개")}</Link>
              <Link href="/social" className={LINK}>{L("navSocial", "소셜클럽")}</Link>
              <Link href="/matching" className={LINK}>{L("navMatching", "1:1 매칭")}</Link>
              {!lead && <Link href="/pricing" className={LINK}>{L("navMembership", "멤버십")}</Link>}
              <Link href="/news" className={LINK}>{L("navNews", "소식")}</Link>
              <Link href="/#faq" className={LINK}>{L("footerFaq", "자주 묻는 질문")}</Link>
              <Link href="/fit-check" className={LINK}>{L("footerApply", "상담 신청")}</Link>
            </nav>
          </div>
          <div>
            <div className="t-label-1 font-semibold text-label mb-[14px]">{L("footerContactTitle", "문의")}</div>
            <div className="flex flex-col gap-[10px] t-label-1 text-labelAlt">
              <a href={`tel:${b.phone}`} className="hover:text-label">{b.phone}</a>
              <a href={`mailto:${b.email}`} className="hover:text-label">{b.email}</a>
              <a href={b.instagramUrl || "#"} target="_blank" rel="noreferrer" className="hover:text-label">@{b.instagramHandle}</a>
              <span className="whitespace-pre-line"><Txt v={b.address} /></span>
            </div>
          </div>
          <div data-testid="footer-partner">
            <Link href="/partner" className="t-label-1 font-semibold text-label hover:text-primary hover:translate-x-[2px] inline-block transition-[color,transform] duration-200">{L("footerPartnerTitle", "제휴문의")} →</Link>
          </div>
        </div>
        <div className="border-t border-lineNeutral pt-[20px] flex flex-col gap-[12px] md:flex-row md:items-start md:justify-between">
          <div className="t-caption-1 text-labelAlt leading-[1.8]" data-testid="business-info">
            {biz.length > 0 && <div className="flex flex-wrap gap-x-[12px]">{biz.map((i) => <span key={i.label}><span className="text-labelAssist mr-[4px]">{i.label}</span>{i.value}</span>)}</div>}
            <div>{b.copyright}</div>
          </div>
          <div className="flex items-center gap-[16px] flex-wrap t-caption-1">
            <Link href="/terms" className="text-labelAlt hover:text-label">{L("legalTerms", "이용약관")}</Link>
            <Link href="/privacy" className="text-labelAlt hover:text-label">{L("legalPrivacy", "개인정보처리방침")}</Link>
            {!lead && <Link href="/refund" className="text-labelAlt hover:text-label">{L("legalRefund", "환불규정")}</Link>}
          </div>
        </div>
      </div>
    </footer>
  );
}
