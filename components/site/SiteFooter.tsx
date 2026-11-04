import Image from "next/image";
import Link from "next/link";
import { Txt } from "@/components/cms/Txt";
import { getBrand } from "@/lib/cms/get";
import { getSettings } from "@/lib/settings/get";
import { InstagramButton } from "./InstagramButton";
import { businessInfo } from "@/lib/site/business";

const INK_FILTER = "invert(1) brightness(0.15)";
const LINK = "t-label-1 text-labelAlt hover:text-label hover:translate-x-[2px] inline-block transition-[color,transform] duration-200";

/**
 * 푸터 (Wanted DS): 연회색 배경, 브랜드 한 줄 + 메뉴·연락처·패밀리 사이트 열, 맨 아래 약관 링크·사업자 정보.
 * 연락처·문구는 CMS(global.brand). 리드 모드면 멤버십·환불규정 링크를 숨긴다.
 */
export async function SiteFooter() {
  const [b, settings] = await Promise.all([getBrand(), getSettings()]);
  const lead = settings.leadMode;
  const biz = businessInfo(b);
  const family = [{ label: b.familySite1Label, url: b.familySite1Url }, { label: b.familySite2Label, url: b.familySite2Url }].filter((f) => f.label && f.url);
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
            <div className="t-label-1 font-semibold text-label mb-[14px]">메뉴</div>
            <nav className="flex flex-col gap-[10px]">
              <Link href="/#about" className={LINK}>소개</Link>
              {!lead && <Link href="/pricing" className={LINK}>멤버십</Link>}
              <Link href="/news" className={LINK}>소식</Link>
              <Link href="/#faq" className={LINK}>자주 묻는 질문</Link>
              <Link href="/fit-check" className={LINK}>상담 신청</Link>
            </nav>
          </div>
          <div>
            <div className="t-label-1 font-semibold text-label mb-[14px]">문의</div>
            <div className="flex flex-col gap-[10px] t-label-1 text-labelAlt">
              <a href={`tel:${b.phone}`} className="hover:text-label">{b.phone}</a>
              <a href={`mailto:${b.email}`} className="hover:text-label">{b.email}</a>
              <a href={b.instagramUrl || "#"} target="_blank" rel="noreferrer" className="hover:text-label">@{b.instagramHandle}</a>
              <span className="whitespace-pre-line"><Txt v={b.address} /></span>
            </div>
          </div>
          <div>
            <div className="t-label-1 font-semibold text-label mb-[14px]">패밀리 사이트</div>
            <nav className="flex flex-col gap-[10px]">
              {family.map((f) => <a key={f.url} href={f.url} target="_blank" rel="noreferrer" className={LINK}>{f.label} ↗</a>)}
            </nav>
          </div>
        </div>
        <div className="border-t border-lineNeutral pt-[20px] flex flex-col gap-[12px] md:flex-row md:items-start md:justify-between">
          <div className="t-caption-1 text-labelAlt leading-[1.8]" data-testid="business-info">
            {biz.length > 0 && <div className="flex flex-wrap gap-x-[12px]">{biz.map((i) => <span key={i.label}><span className="text-labelAssist mr-[4px]">{i.label}</span>{i.value}</span>)}</div>}
            <div>{b.copyright}</div>
          </div>
          <div className="flex items-center gap-[16px] flex-wrap t-caption-1">
            <Link href="/terms" className="text-labelAlt hover:text-label">이용약관</Link>
            <Link href="/privacy" className="font-semibold text-label">개인정보처리방침</Link>
            {!lead && <Link href="/refund" className="text-labelAlt hover:text-label">환불규정</Link>}
          </div>
        </div>
      </div>
    </footer>
  );
}
