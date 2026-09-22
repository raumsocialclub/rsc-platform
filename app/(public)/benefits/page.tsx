import type { Metadata } from "next";
import Link from "next/link";
import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";
import { UpButton } from "@/components/site/UpButton";

export const metadata: Metadata = { title: "RSC 정회원 혜택 안내" };

/* deploy/benefits.html 재현 */

type Row = { n: string; title: string; badge: string; lines: string[]; right: React.ReactNode };
type Group = { name: string; rows: Row[] };

const GROUPS: Group[] = [
  {
    name: "이벤트 · 커뮤니티",
    rows: [
      { n: "01", title: "카테고리 행사 우선참여", badge: "무료 · 우선권", lines: ["· ART WALK, TASTE TABLE 등 6개 카테고리 행사 참가비 무료", "· 비회원보다 먼저 예약 가능"], right: <>회당 평균<br /><b className="text-ink text-[15px]">160,000원</b> 상당 절감</> },
      { n: "02", title: "지인 초대권", badge: "연 8회", lines: ["· 분기당 2매, 연 8매 제공", "· 초대받은 지인도 참가비 없이 동행"], right: <>연 8매<br />분기당 2매 제공</> },
    ],
  },
  {
    name: "스페이스",
    rows: [
      { n: "03", title: "전용 미팅룸 · 세미나룸", badge: "회원 전용 예약", lines: ["· 프라이빗 미팅룸 2개, 세미나룸 2개", "· 사용한 시간만큼만 별도 결제"], right: <>미팅룸 5만원/h<br />세미나룸 10만원/h</> },
      { n: "04", title: "RSC 라운지", badge: "무료 제공", lines: ["· 행사 전후, 미팅 사이 자유롭게 이용", "· 물 · 티 · 커피 무료 제공"], right: <>상시<br />무료 이용</> },
      { n: "05", title: "평일 무료주차", badge: "평일 1일 1회", lines: ["· 평일 1일 1회, 3시간까지 주차료 무료"], right: <>1일 최대<br /><b className="text-ink text-[15px]">54,000원</b> 상당 절감</> },
      { n: "06", title: "라움 아트센터 대관", badge: "회원 우선", lines: ["· 브리제홀, 마제스틱볼룸 등 7개 공간 협의", "· 개인 행사부터 소셜 파티까지 폭넓게 활용"], right: <>대관료<br />별도 문의</> },
    ],
  },
  {
    name: "파트너 혜택",
    rows: [
      { n: "07", title: "브런치카페 할인", badge: "할인 제공", lines: ["· 지하 1층 브런치 베이커리 카페"], right: <>회원 할인가<br />적용</> },
      { n: "08", title: "라움 제휴 브랜드 이용", badge: "등록 할인", lines: ["· 호텔, 병원, 웰니스센터 등 제휴 브랜드 혜택 이용"], right: <>이용 시<br />할인 제공</> },
    ],
  },
];

export default function BenefitsPage() {
  const total = GROUPS.reduce((n, g) => n + g.rows.length, 0);
  return (
    <div className="min-h-screen flex flex-col pt-[57px] md:pt-[76px]">
      <SiteHeader />

      <main className="flex-1 px-[18px] pt-[40px] pb-[96px] md:px-[40px] md:pt-[72px] md:pb-[140px]">
        <div className="w-full max-w-[960px] mx-auto">
          <section className="text-center mb-[56px]">
            <div className="text-[11px] tracking-[.3em] text-brownHover mb-[22px]">RSC MEMBER BENEFITS</div>
            <h1 className="font-semibold text-[30px] md:text-[clamp(30px,4vw,48px)] leading-[1.28] mb-[20px] text-pretty">정회원 혜택 안내</h1>
            <p className="mx-auto text-[16px] leading-[1.75] text-[rgba(33,30,25,.68)] max-w-[520px] text-pretty">
              “아름다운 공간에서, 서로의 특별함을 발편하는 곳”<br />라움이 검증한 멤버가 모이는, 싱글 라이프스타일 커뮤니티
            </p>
          </section>

          <section className="border border-[rgba(33,30,25,.14)] mb-[64px]">
            <div className="flex justify-between items-center gap-[12px] px-[28px] py-[16px] bg-ink text-cream">
              <span className="text-[12px] tracking-[.2em] font-semibold">회원 혜택 구성</span>
              <span className="text-[11px] tracking-[.14em] text-[rgba(247,243,236,.65)]">{total} BENEFITS · {GROUPS.length} CATEGORIES</span>
            </div>

            {GROUPS.map((g, gi) => (
              <div key={g.name}>
                <div className="px-[28px] py-[12px] bg-sandDeep text-[12.5px] font-semibold text-brown tracking-[.06em]">{g.name}</div>
                {g.rows.map((r, ri) => {
                  const last = gi === GROUPS.length - 1 && ri === g.rows.length - 1;
                  return (
                    <div
                      key={r.n}
                      className={`grid grid-cols-1 gap-[10px] px-[18px] py-[20px] md:grid-cols-[minmax(0,1.1fr)_minmax(0,1.5fr)_minmax(0,.8fr)] md:gap-[24px] md:px-[28px] md:py-[24px] bg-cream items-start ${last ? "" : "border-b border-[rgba(33,30,25,.1)]"}`}
                    >
                      <div>
                        <div className="text-[11px] text-[rgba(33,30,25,.45)] mb-[6px]">{r.n}</div>
                        <div className="text-[16px] font-semibold mb-[10px]">{r.title}</div>
                        <span className="inline-block text-[11px] px-[10px] py-[4px] border border-[rgba(33,30,25,.25)] rounded-pill text-[rgba(33,30,25,.65)]">{r.badge}</span>
                      </div>
                      <div className="text-[13.5px] leading-[1.7] text-[rgba(33,30,25,.75)]">
                        {r.lines.map((l, i) => (
                          <span key={i}>{l}{i < r.lines.length - 1 && <br />}</span>
                        ))}
                      </div>
                      <div className="text-left md:text-right text-[13px] leading-[1.6] text-[rgba(33,30,25,.6)]">{r.right}</div>
                    </div>
                  );
                })}
              </div>
            ))}
          </section>

          <section className="bg-ink text-cream px-[48px] py-[56px] text-center">
            <div className="text-[11px] tracking-[.3em] text-gold mb-[18px]">RAUM SOCIAL CLUB</div>
            <h2 className="font-semibold text-[22px] md:text-[clamp(22px,2.6vw,32px)] leading-[1.3] mb-[32px]">멤버십 가격과 혜택을 함께 확인해보세요</h2>
            <div className="flex gap-[12px] justify-center flex-wrap">
              <Link href="/pricing" className="inline-flex items-center px-[32px] py-[16px] rounded-pill bg-gold text-ink text-[14px] font-bold hover:bg-goldHover hover:text-ink">멤버십 가격 안내</Link>
              <Link href="/fit-check" className="inline-flex items-center px-[32px] py-[16px] rounded-pill border border-[rgba(247,243,236,.35)] text-cream text-[14px] hover:border-gold hover:text-gold">RSC 상담 신청하기</Link>
            </div>
          </section>
        </div>
      </main>
      <SiteFooter />
      <UpButton />
    </div>
  );
}
