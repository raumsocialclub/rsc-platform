import Image from "next/image";
import Link from "next/link";

const INK_FILTER = "invert(1) brightness(0.15)";

/** 메인 페이지 푸터. deploy/index.html <footer> 재현. */
export function SiteFooter() {
  return (
    <footer className="px-[40px] pt-[110px] pb-[140px] border-t border-[rgba(33,30,25,.09)] bg-sand">
      <div className="max-w-[1240px] mx-auto">
        <div className="font-semibold text-[clamp(22px,2.2vw,32px)] leading-[1.35] mb-[80px] max-w-[820px] text-pretty">
          아름다운 공간에서,<br className="hidden md:inline" /> 서로의 특별함을 발견하는 곳.
        </div>
        <div className="grid grid-cols-2 gap-[32px] md:grid-cols-[repeat(auto-fit,minmax(220px,1fr))] md:gap-[48px] mb-[80px]">
          <div>
            <div className="text-[10.5px] tracking-[.28em] text-brownHover mb-[16px]">ADDRESS</div>
            <div className="text-[15px] leading-[1.28] text-[rgba(33,30,25,.72)]">
              서울특별시 강남구 언주로 564<br className="hidden md:inline" /> (역삼동 680-1)
            </div>
          </div>
          <div>
            <div className="text-[10.5px] tracking-[.28em] text-brownHover mb-[16px]">CONTACT</div>
            <div className="text-[15px] leading-[1.28] text-[rgba(33,30,25,.72)]">
              02-538-3366<br />
              <a href="mailto:support@theraum.co.kr">support@theraum.co.kr</a>
            </div>
          </div>
          <div>
            <div className="text-[10.5px] tracking-[.28em] text-brownHover mb-[16px]">INSTAGRAM</div>
            <div className="text-[15px] leading-[1.28] text-[rgba(33,30,25,.72)]">
              <a href="https://www.instagram.com/raum_socialclub/" target="_blank" rel="noreferrer">@raum_socialclub</a>
            </div>
          </div>
          <div>
            <div className="text-[10.5px] tracking-[.28em] text-brownHover mb-[16px]">MENU</div>
            <nav className="flex flex-col gap-[8px] text-[15px] text-[rgba(33,30,25,.72)]">
              <Link href="/#about">소개</Link>
              <Link href="/#why">포지셔닝</Link>
              <Link href="/#social">RSC SOCIAL</Link>
              <Link href="/#solo">RAUM SOLO</Link>
              <Link href="/#membership">멤버십</Link>
            </nav>
          </div>
        </div>
        <div className="flex items-center justify-between gap-[24px] flex-wrap pt-[32px] pb-[12px] border-t border-[rgba(33,30,25,.12)]">
          <Link href="/" className="flex items-center gap-[12px]">
            <Image src="/images/logo-emblem.png" alt="RAUM SOCIAL CLUB" width={529} height={638} className="h-[26px] w-auto" style={{ filter: INK_FILTER }} />
            <Image src="/images/logo-text-footer.png" alt="" width={2612} height={332} className="h-[11px] w-auto opacity-80" style={{ filter: INK_FILTER }} />
          </Link>
          <div className="text-[12px] text-[rgba(33,30,25,.4)]">© 2026 RAUM SOCIAL CLUB</div>
        </div>
      </div>
    </footer>
  );
}
