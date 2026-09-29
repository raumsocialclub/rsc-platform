import Image from "next/image";
import Link from "next/link";
import { Txt } from "@/components/cms/Txt";
import { getBrand } from "@/lib/cms/get";
import { getSettings } from "@/lib/settings/get";
import { InstagramButton } from "./InstagramButton";
import { FamilySiteMenu } from "./FamilySiteMenu";

const INK_FILTER = "invert(1) brightness(0.15)";

/**
 * 메인 페이지 푸터. deploy/index.html <footer> 재현. 연락처·문구는 CMS(global.brand).
 * 리드 모드면 멤버십·환불규정 링크를 숨긴다 (결제를 다시 켜면 같이 돌아온다).
 */
export async function SiteFooter() {
  const [b, settings] = await Promise.all([getBrand(), getSettings()]);
  const lead = settings.leadMode;
  return (
    <footer className="px-[40px] pt-[110px] pb-[140px] border-t border-[rgba(33,30,25,.09)] bg-sand">
      <div className="max-w-[1240px] mx-auto">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-[28px] mb-[80px]">
          <div className="font-semibold text-[clamp(22px,2.2vw,32px)] leading-[1.35] max-w-[820px] text-pretty">
            <Txt v={b.footerHeadline} />
          </div>
          <FamilySiteMenu sites={[{ label: b.familySite1Label, url: b.familySite1Url }, { label: b.familySite2Label, url: b.familySite2Url }]} />
        </div>
        <div className="grid grid-cols-2 gap-[32px] md:grid-cols-[repeat(auto-fit,minmax(220px,1fr))] md:gap-[48px] mb-[80px]">
          <div>
            <div className="text-[10.5px] tracking-[.28em] text-brownHover mb-[16px]">ADDRESS</div>
            <div className="text-[15px] leading-[1.28] text-[rgba(33,30,25,.72)]"><Txt v={b.address} /></div>
          </div>
          <div>
            <div className="text-[10.5px] tracking-[.28em] text-brownHover mb-[16px]">CONTACT</div>
            <div className="text-[15px] leading-[1.28] text-[rgba(33,30,25,.72)]">
              {b.phone}<br />
              <a href={`mailto:${b.email}`}>{b.email}</a>
            </div>
          </div>
          <div>
            <div className="text-[10.5px] tracking-[.28em] text-brownHover mb-[16px]">INSTAGRAM</div>
            <div className="text-[15px] leading-[1.28] text-[rgba(33,30,25,.72)]">
              <a href={b.instagramUrl || "#"} target="_blank" rel="noreferrer">@{b.instagramHandle}</a>
            </div>
            <div className="mt-[14px]">
              <InstagramButton href={b.instagramUrl} size="sm" />
            </div>
          </div>
          <div>
            <div className="text-[10.5px] tracking-[.28em] text-brownHover mb-[16px]">MENU</div>
            <nav className="flex flex-col gap-[8px] text-[15px] text-[rgba(33,30,25,.72)]">
              <Link href="/#about">소개</Link>
              <Link href="/#why">포지셔닝</Link>
              <Link href="/#social">RSC SOCIAL</Link>
              <Link href="/#solo">RAUM SOLO</Link>
              {!lead && <Link href="/#membership">멤버십</Link>}
              <Link href="/#faq">FAQ</Link>
              <Link href="/news">소식</Link>
            </nav>
          </div>
        </div>
        <div className="flex items-center justify-between gap-[24px] flex-wrap pt-[32px] pb-[12px] border-t border-[rgba(33,30,25,.12)]">
          <Link href="/" className="flex items-center gap-[12px]">
            <Image src={b.logoEmblem || "/images/logo-emblem.png"} alt="RAUM SOCIAL CLUB" width={529} height={638} className="h-[26px] w-auto" style={{ filter: INK_FILTER }} unoptimized={(b.logoEmblem || "").startsWith("http")} />
            <Image src="/images/logo-text-footer.png" alt="" width={2612} height={332} className="h-[11px] w-auto opacity-80" style={{ filter: INK_FILTER }} />
          </Link>
          <div className="flex items-center gap-[16px] flex-wrap text-[12px] text-[rgba(33,30,25,.55)]">
            <Link href="/terms">이용약관</Link>
            <Link href="/privacy" className="font-semibold">개인정보처리방침</Link>
            {!lead && <Link href="/refund">환불규정</Link>}
            <span className="text-[rgba(33,30,25,.4)]">{b.copyright}</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
