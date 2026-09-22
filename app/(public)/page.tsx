import Link from "next/link";
import { Header } from "@/components/site/Header";
import { SiteFooter } from "@/components/site/SiteFooter";
import { UpButton } from "@/components/site/UpButton";
import { ImageBlock } from "@/components/site/ImageBlock";

/* ---------- 공통 조각 (deploy/index.html 인라인 스타일을 그대로 옮김) ---------- */

const SECTION = "px-[20px] py-[72px] md:px-[40px] md:py-[140px] border-t border-[rgba(33,30,25,.09)]";
const INNER = "max-w-[1240px] mx-auto";
const H2 = "font-semibold text-[25px] leading-[1.36] md:text-[clamp(28px,2.8vw,44px)] text-pretty";
/* 본문 계열: 데스크톱 값은 요소마다 다르고, 모바일은 일괄 15px / 1.6 */
const BODY_M = "text-[15px] leading-[1.6]";
/* 1px 선으로 나뉜 셀 그리드 */
const LINE_GRID = "bg-[rgba(33,30,25,.14)] border border-[rgba(33,30,25,.14)]";
const LB = "hidden md:inline"; // <br class="lb"> — 모바일에서 줄바꿈 제거

function SectionLabel({ children, className = "mb-[40px]" }: { children: React.ReactNode; className?: string }) {
  return <div className={`text-[11px] tracking-[.34em] text-brownHover ${className}`}>{children}</div>;
}

/* ---------- 데이터 ---------- */

const SOCIAL = [
  { img: "art-walk", cat: "ART & CULTURE", title: "RAUM ART WALK", filter: "brightness(0.97) saturate(0.94)", desc: <>전시 관람 → 큐레이터 토크 → 자유 소셜로<br className={LB} /> 이어지는 시간입니다.</> },
  { img: "sunday-reset", cat: "SOCIAL WELLNESS", title: "SUNDAY RESET", filter: "brightness(1.12) saturate(0.94)", desc: <>요가·바레·명상으로 시작해, 브런치와 커뮤니티 테이블로 이어집니다.</> },
  { img: "taste-table", cat: "WINE & SPIRITS", title: "TASTE TABLE", filter: "brightness(0.97) saturate(0.94)", desc: <>와인 또는 위스키 테이스팅 후,<br className={LB} /> 취향별 테이블에서 자유롭게 이야기합니다.</> },
  { img: "talk-insight", cat: "TALK & INSIGHT", title: "ONE QUESTION SALON", filter: "brightness(0.97) saturate(0.94)", desc: <>하나의 질문을 중심으로 4~6명이 서로의 생각을 나누는<br className={LB} /> 소규모 살롱입니다.</> },
  { img: "after-hours", cat: "MUSIC & PERFORMANCE", title: "RAUM AFTER HOURS", filter: "brightness(1.1) saturate(0.94)", desc: <>공연을 보고, 음악과 함께 애프터 소셜로 밤이 이어집니다.</> },
  { img: "run-brunch", cat: "SPORTS & MOVEMENT", title: "RUN & BRUNCH", filter: "brightness(1.15) saturate(0.94)", desc: <>러닝과 트레이닝 후, 브런치를 나누며 소셜 타임을 갖습니다.</> },
];

const SPACES = [
  { img: "lounge", n: "01", title: "RSC 라운지", desc: "프로그램 사이, 익숙한 얼굴들과 마주치게 되는 자리입니다.", span: "md:col-span-4", h: "h-[220px] md:h-[520px]" },
  { img: "hall-chamber", n: "02", title: "체임버 홀", desc: "클래식 공연·북토크 및 웰니스 행사를 위한 홀.", span: "md:col-span-2", h: "h-[220px] md:h-[520px]" },
  { img: "garden-grass", n: "03", title: "그라스 가든", desc: "RAUM SOCIAL NIGHT와 야외 행사가 열리는 정원.", span: "md:col-span-3", h: "h-[200px] md:h-[380px]" },
  { img: "hall-majestic", n: "04", title: "마제스틱 볼룸", desc: "RAUM SOLO 와 같은 시즌의 Finale를 위한 공간.", span: "md:col-span-3", h: "h-[200px] md:h-[380px]" },
];

const VALUES = [
  { label: "SPACE", text: <>아름다운 라움의 프라이빗 공간.</> },
  { label: "PEOPLE", text: <>선별되고, 활동을 통해 다시 확인되는 회원.</> },
  { label: "EXPERIENCE", text: <>1년 동안 이어지는 문화와<br />취향의 경험.</> },
  { label: "COMMUNITY", text: <>같은 공간에서 반복적으로 마주치는 소속감.</> },
  { label: "OPPORTUNITY", text: <>자연스럽게 새로운 관계가 시작될 가능성.</> },
];

export default function HomePage() {
  return (
    <>
      <Header />

      {/* HERO */}
      <section id="top" className="relative h-screen min-h-[640px] md:min-h-[660px] w-full">
        <ImageBlock src="/images/hero.jpg" alt="" className="absolute inset-0" filter="brightness(0.55)" priority />
        <div className="absolute left-[20px] right-[20px] bottom-[28px] md:left-[40px] md:right-[40px] md:bottom-[64px] flex flex-col items-start gap-[22px] md:flex-row md:items-end md:justify-between md:gap-[48px] md:flex-wrap pointer-events-none">
          <div className="max-w-[820px]">
            <div className="text-[11px] tracking-[.3em] text-gold mb-[28px]">A CURATED LIFESTYLE COMMUNITY FOR SINGLES</div>
            <h1 className="font-medium text-[30px] leading-[1.32] md:text-[clamp(32px,4.1vw,64px)] md:leading-[1.24] tracking-[-.01em] mb-[26px] text-pretty text-cream">
              라움이 검증한 멤버가 모이는<br />싱글 라이프스타일 커뮤니티
            </h1>
            <p className={`${BODY_M} md:text-[16.5px] md:leading-[1.7] text-[rgba(247,243,236,.9)] max-w-[560px] text-pretty`}>
              아름다운 공간에서, 서로의 특별함을 발견하는 곳.<br className={LB} /> 문화와 취향을 함께하며 자연스럽게 서로를 발견합니다.
            </p>
          </div>
          <div className="flex gap-[12px] pointer-events-auto">
            <Link href="/fit-check" className="inline-flex items-center px-[28px] py-[15px] rounded-pill bg-ink text-cream text-[13.5px] whitespace-nowrap hover:bg-brownHover hover:text-cream">
              RSC 상담 신청
            </Link>
            <a href="#social" className="inline-flex items-center px-[28px] py-[15px] rounded-pill border border-[#FFFFFF4D] text-[13.5px] text-white whitespace-nowrap hover:border-brownHover hover:text-brownHover">
              프로그램 보기
            </a>
          </div>
        </div>
      </section>

      {/* 01 NEW DEFINITION */}
      <section id="about" className={SECTION}>
        <div className={INNER}>
          <SectionLabel className="mb-[56px]">01 &nbsp;/&nbsp; NEW DEFINITION</SectionLabel>
          <div className="grid grid-cols-1 gap-[20px] md:grid-cols-[repeat(auto-fit,minmax(320px,1fr))] md:gap-[80px] items-start">
            <div>
              <h2 className={`${H2} md:leading-[1.3] mb-[34px]`}>라움소셜클럽이란</h2>
              <p className={`${BODY_M} md:text-[16px] md:leading-[1.28] mb-[22px] text-[rgba(33,30,25,.7)] text-pretty w-full md:w-[619px] md:h-[61px] font-semibold`}>
                소개팅을 하기 위해 한 번 만나는 곳이 아니라, <br />문화·예술·와인·웰니스·뮤직·스포츠 등 <br />자신이 좋아하는 경험을 함께하며 <br />결이 맞는 사람을 반복적으로 만나고 관계를 만들어가는 곳입니다.
              </p>
              <p className={`${BODY_M} md:text-[16px] md:leading-[1.28] mb-[22px] text-[rgba(33,30,25,.7)] text-pretty font-semibold`}>
                <br />라움은 누군가를 억지로 연결하지 않습니다.<br className={LB} /> 아름다운 공간에 멋진 싱글들을 모으고,<br className={LB} /> 함께 경험할 이유를 만들고, 다시 만날 기회를 설계합니다.
              </p>
              <div className="border-l-2 border-brownHover pl-[24px] py-[4px] mt-[44px]">
                <p className={`${BODY_M} md:text-[17px] md:leading-[1.28] text-pretty`}>
                  RSC는 소개팅 클럽이 아니라,<br className={LB} />싱글들의 라이프스타일을 가장 매력적으로 만드는 커뮤니티입니다.
                </p>
              </div>
            </div>
            <ImageBlock src="/images/about.jpg" alt="라움의 공간" className="h-[260px] md:h-[600px] min-w-0" filter="brightness(0.97) saturate(0.94)" sizes="(min-width: 761px) 50vw, 100vw" />
          </div>
        </div>
      </section>

      {/* 02 POSITIONING */}
      <section id="why" className={`${SECTION} bg-sand`}>
        <div className={INNER}>
          <SectionLabel>02 &nbsp;/&nbsp; POSITIONING</SectionLabel>
          <h2 className={`${H2} md:leading-[1.28] mb-[26px] max-w-[760px]`}>MATCHING이 아니라<br />COMMUNITY 입니다</h2>
          <p className={`${BODY_M} md:text-[16px] md:leading-[1.28] mb-[72px] text-[rgba(33,30,25,.68)] max-w-[680px] text-pretty`}>
            매칭은 목적이 아니라, 잘 설계된 커뮤니티 안에서 자연스럽게 발생하는 결과입니다.
          </p>
          <div className={`grid grid-cols-1 gap-[20px] md:grid-cols-[repeat(auto-fit,minmax(260px,1fr))] md:gap-px ${LINE_GRID} mb-[56px]`}>
            {[
              { l: "01 EXPERIENCE", t: <>아름다운 공간에서<br className={LB} /> 매력적인 경험을 합니다.</> },
              { l: "02 PEOPLE", t: <>그 경험을 함께하는<br className={LB} /> 멋진 사람들을 발견합니다.</> },
              { l: "03 RELATIONSHIP", t: <>반복적으로 만나면서<br className={LB} /> 자연스럽게 관계가 시작됩니다.</> },
            ].map((c) => (
              <div key={c.l} className="bg-sand px-[22px] py-[26px] md:px-[30px] md:py-[36px]">
                <div className="text-[10.5px] tracking-[.28em] text-brownHover mb-[16px]">{c.l}</div>
                <div className={`${BODY_M} md:text-[15px] md:leading-[1.28] text-[rgba(33,30,25,.74)] text-pretty`}>{c.t}</div>
              </div>
            ))}
          </div>
          <p className={`${BODY_M} md:text-[18px] md:leading-[1.35] max-w-[700px] text-pretty`}>
            좋은 사람을 소개하는 것이 아니라,<br className={LB} /> 멋진 사람을 발견할 수 있는 환경을 만드는 것.
          </p>
        </div>
      </section>

      {/* 03 BRAND PROMISE */}
      <section id="promise" className={SECTION}>
        <div className={INNER}>
          <SectionLabel>03 &nbsp;/&nbsp; RSC BRAND PROMISE</SectionLabel>
          <h2 className={`${H2} md:leading-[1.28] mb-[64px] max-w-[700px]`}>RSC가 싱글 회원에게 제공하는<br />세 가지 가치</h2>
          <div className="grid grid-cols-1 gap-[20px] md:grid-cols-[repeat(auto-fit,minmax(300px,1fr))] md:gap-[28px]">
            {[
              { l: "01 BETTER LIFE", size: "text-[23px]", t: "더 매력적인 싱글 라이프", d: <>전시, 공연, 와인, 운동, 다이닝 등<br className={LB} /> 혼자서는 쉽게 경험하지 않았던 순간을 함께합니다. 가입하는 순간부터 삶 자체가 더 풍성해집니다.</> },
              { l: "02 BETTER PEOPLE", size: "text-[22px]", t: "검증된 사람들과의 새로운 연결", d: <>불특정 다수가 아니라,<br className={LB} /> 라움이라는 브랜드와 멤버십을 선택하고<br className={LB} /> 실제로 커뮤니티에 참여하는 사람들을 만납니다.</> },
              { l: "03 BETTER RELATIONSHIP", size: "text-[23px]", t: "자연스럽게 깊어지는 관계", d: <>한 번의 만남으로 상대를 판단하지 않습니다.<br className={LB} /> 여러 프로그램에서 반복적으로 만나며<br className={LB} /> 서로의 결을 알아갑니다.</> },
            ].map((c) => (
              <div key={c.l} className="min-w-0 px-[22px] py-[26px] md:px-[32px] md:py-[36px] border border-[rgba(33,30,25,.16)]">
                <div className="text-[11px] tracking-[.24em] text-brownHover mb-[18px]">{c.l}</div>
                <div className={`${c.size} mb-[16px]`}>{c.t}</div>
                <div className={`${BODY_M} md:text-[14.5px] md:leading-[1.32] text-[rgba(33,30,25,.64)] text-pretty`}>{c.d}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 04 RSC SOCIAL */}
      <section id="social" className={`${SECTION} bg-sand`}>
        <div className={INNER}>
          <SectionLabel>04 &nbsp;/&nbsp; RSC SOCIAL — EVERYDAY</SectionLabel>
          <div className="flex flex-col items-start gap-[20px] md:flex-row md:items-end md:justify-between md:gap-[40px] md:flex-wrap mb-[64px]">
            <h2 className={`${H2} md:leading-[1.28] max-w-[660px]`}>RSC를 일상적으로 찾게 만드는<br />취향 프로그램</h2>
            <p className={`${BODY_M} md:text-[13px] md:leading-[1.85] text-[rgba(33,30,25,.6)] max-w-[380px] w-full md:w-[415px] md:h-[76px] text-pretty`}>
              연애를 앞세우지 않습니다.<br className={LB} /> 좋아하는 것을 함께 경험하다 보면 자연스럽게 사람을 알게 됩니다.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-[20px] md:grid-cols-[repeat(auto-fit,minmax(300px,1fr))] md:gap-[28px]">
            {SOCIAL.map((s) => (
              <div key={s.title} className="min-w-0">
                <ImageBlock src={`/images/${s.img}.jpg`} alt={s.title} className="h-[200px] md:h-[340px] mb-[24px]" filter={s.filter} sizes="(min-width: 761px) 33vw, 100vw" />
                <div className="text-[10.5px] tracking-[.28em] text-brownHover mb-[12px]">{s.cat}</div>
                <div className="text-[22px] mb-[10px] font-semibold">{s.title}</div>
                <div className={`${BODY_M} md:text-[14.5px] md:leading-[1.28] text-[rgba(33,30,25,.62)] text-pretty`}>{s.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 05 MONTHLY & SEASON */}
      <section id="solo" className={SECTION}>
        <div className={INNER}>
          <SectionLabel>05 &nbsp;/&nbsp; MONTHLY &amp; SEASON</SectionLabel>
          <div className={`grid grid-cols-1 gap-[20px] md:grid-cols-[repeat(auto-fit,minmax(340px,1fr))] md:gap-px ${LINE_GRID}`}>
            <div className="bg-cream px-[26px] py-[32px] md:px-[48px] md:py-[56px] min-w-0">
              <ImageBlock src="/images/social-night.jpg" alt="RAUM SOCIAL NIGHT" className="h-[180px] md:h-[260px] mb-[32px]" filter="brightness(1.1) saturate(0.94)" sizes="(min-width: 761px) 50vw, 100vw" />
              <div className="text-[10.5px] tracking-[.28em] text-brownHover mb-[16px]">MONTHLY</div>
              <div className="text-[26px] mb-[16px] font-semibold">RAUM SOCIAL NIGHT</div>
              <div className={`${BODY_M} md:text-[14.5px] md:leading-[1.32] text-[rgba(33,30,25,.62)] text-pretty`}>
                매월 한 번 열리는 RSC 대표 싱글 소셜. 공연, 다이닝, 와인, 음악 안에서<br className={LB} /> 자연스럽게 사람을 만납니다.
              </div>
            </div>
            <div className="bg-cream px-[26px] py-[32px] md:px-[48px] md:py-[56px] min-w-0">
              <ImageBlock src="/images/raum-solo.jpg" alt="RAUM SOLO" className="h-[180px] md:h-[260px] mb-[32px]" filter="grayscale(1) brightness(1.05) contrast(1.05)" sizes="(min-width: 761px) 50vw, 100vw" />
              <div className="text-[10.5px] tracking-[.28em] text-brownHover mb-[16px]">QUARTERLY · FLAGSHIP</div>
              <div className="text-[26px] mb-[16px] font-semibold">RAUM SOLO</div>
              <div className={`${BODY_M} md:text-[14.5px] md:leading-[1.32] text-[rgba(33,30,25,.62)] text-pretty`}>
                한 번의 소개팅이 아닌, 함께 보내는 한 시즌. 선별된 RSC 싱글 회원들이<br className={LB} /> 6주 동안 다양한 경험을 함께하며 서로를 발견하는 시즌형 프로그램입니다.
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 06 SPACES */}
      <section id="spaces" className={`${SECTION} bg-sand`}>
        <div className={INNER}>
          <SectionLabel>06 &nbsp;/&nbsp; SPACES</SectionLabel>
          <div className="flex flex-col items-start gap-[20px] md:flex-row md:items-end md:justify-between md:gap-[40px] md:flex-wrap mb-[26px]">
            <h2 className={`${H2} md:leading-[1.28] max-w-[660px]`}>모든 경험이 열리는 곳, 라움아트센터</h2>
            <p className={`${BODY_M} md:text-[15px] md:leading-[1.32] text-[rgba(33,30,25,.6)] max-w-[340px] text-pretty`}>아름다운 공간이 없다면, 이 모든 만남도 없습니다.</p>
          </div>
          <div className="grid grid-cols-1 gap-[20px] md:grid-cols-6 mt-[64px]">
            {SPACES.map((s) => (
              <div key={s.n} className={`min-w-0 ${s.span}`}>
                <ImageBlock src={`/images/${s.img}.jpg`} alt={s.title} className={s.h} filter="brightness(0.85) saturate(0.85)" sizes="(min-width: 761px) 66vw, 100vw" />
                <div className="flex items-baseline gap-[16px] pt-[22px]">
                  <span className="text-[11px] tracking-[.2em] text-brownHover">{s.n}</span>
                  <div>
                    <div className="text-[22px] mb-[8px] font-semibold">{s.title}</div>
                    <div className={`${BODY_M} md:text-[14px] md:leading-[1.28] text-[rgba(33,30,25,.62)] text-pretty`}>{s.desc}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 07 MEMBERSHIP */}
      <section id="membership" className={SECTION}>
        <div className={INNER}>
          <SectionLabel>07 &nbsp;/&nbsp; MEMBERSHIP</SectionLabel>
          <div className="grid grid-cols-1 gap-[20px] md:grid-cols-[minmax(320px,1.5fr)_minmax(320px,1fr)] md:gap-[80px] items-center mb-[96px]">
            <ImageBlock src="/images/membership.jpg" alt="RAUM" className="h-[260px] md:h-[600px] min-w-0" filter="brightness(1.05)" sizes="(min-width: 761px) 60vw, 100vw" />
            <div className="min-w-0">
              <h2 className="font-semibold text-[25px] leading-[1.36] md:text-[clamp(27px,2.7vw,42px)] md:leading-[1.32] mb-[30px] text-pretty">
                검증된 멤버들이 모이는<br />싱글 라이프스타일 커뮤니티
              </h2>
              <p className={`${BODY_M} md:text-[16px] md:leading-[1.28] mb-[44px] text-[rgba(33,30,25,.7)] max-w-[480px] text-pretty`}>
                문화와 취향을 함께하며 자연스럽게 서로를 발견하는 곳.<br className={LB} /> 회원이 구매하는 것은 매칭 횟수가 아니라,<br className={LB} /> 1년 동안 이어지는 경험과 관계의 가능성입니다.
              </p>
              <div className={`grid grid-cols-1 md:grid-cols-2 gap-px ${LINE_GRID} max-w-[480px] mb-[36px]`}>
                <Link href="/pricing" className="bg-cream px-[28px] py-[26px] block hover:bg-sandHover">
                  <div className="text-[11px] tracking-[.2em] text-brownHover mb-[10px]">MEMBERSHIP</div>
                  <div className="text-[17px] font-semibold flex justify-between items-center gap-[8px]">멤버십 가격 안내<span className="text-brown">→</span></div>
                </Link>
                <Link href="/benefits" className="bg-cream px-[28px] py-[26px] block hover:bg-sandHover">
                  <div className="text-[11px] tracking-[.2em] text-brownHover mb-[10px]">BENEFITS</div>
                  <div className="text-[17px] font-semibold flex justify-between items-center gap-[8px]">혜택 확인<span className="text-brown">→</span></div>
                </Link>
              </div>
              <div className="flex gap-[12px] flex-wrap">
                <Link href="/fit-check" className="inline-flex items-center px-[28px] py-[15px] rounded-pill bg-ink text-cream text-[13.5px] hover:bg-brownHover hover:text-cream">
                  RSC 상담 신청하기
                </Link>
                <a href="https://www.instagram.com/raum_socialclub/" target="_blank" rel="noreferrer" className="inline-flex items-center px-[28px] py-[15px] rounded-pill border border-[rgba(33,30,25,.3)] text-[13.5px] hover:border-brownHover hover:text-brownHover">
                  인스타그램
                </a>
              </div>
            </div>
          </div>

          <div className={`grid grid-cols-1 gap-[20px] md:grid-cols-[repeat(auto-fit,minmax(200px,1fr))] md:gap-px ${LINE_GRID}`}>
            {VALUES.map((v) => (
              <div key={v.label} className="bg-cream px-[26px] py-[32px]">
                <div className="text-[10.5px] tracking-[.24em] text-brownHover mb-[14px]">{v.label}</div>
                <div className={`${BODY_M} md:text-[14px] md:leading-[1.28] text-[rgba(33,30,25,.68)]`}>{v.text}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <SiteFooter />
      <UpButton />
    </>
  );
}
