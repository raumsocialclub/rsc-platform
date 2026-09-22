import type { Metadata } from "next";
import Link from "next/link";
import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";
import { UpButton } from "@/components/site/UpButton";

export const metadata: Metadata = { title: "RSC 멤버십 가격 안내" };

/* deploy/pricing.html 재현. 가격 값은 M5 이후 membership_plans 테이블로 이동 예정. */

const TH = "text-left text-[11.5px] tracking-[.12em] text-[rgba(33,30,25,.5)] font-semibold px-[12px] py-[12px] md:px-[18px] md:py-[14px] border-b border-[rgba(33,30,25,.18)] whitespace-nowrap";
const TD = "text-[13px] md:text-[14.5px] p-[12px] md:p-[18px] border-b border-[rgba(33,30,25,.1)] align-top leading-[1.5]";
const SUB = "text-[12px] text-[rgba(33,30,25,.5)] mt-[3px]";
const CARD = "bg-cream border border-[rgba(33,30,25,.14)] px-[32px] py-[36px] flex flex-col";
const PRICE = "text-[34px] font-semibold tracking-[-.01em] leading-none";
const WON = "text-[15px] font-medium ml-[2px]";
const LIST = "m-0 mb-[28px] p-0 list-none grid gap-[9px] text-[13.5px] leading-[1.5] flex-1";
const SECTION_LABEL = "text-[11px] tracking-[.3em] text-[rgba(33,30,25,.5)]";
const H2 = "font-semibold text-[24px] md:text-[clamp(24px,2.6vw,34px)] leading-[1.3]";
const POLICY_ROW = "grid grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)] gap-[14px] py-[13px] text-[13.5px] leading-[1.5]";

function Li({ children, dark }: { children: React.ReactNode; dark?: boolean }) {
  return (
    <li className="flex gap-[10px]">
      <span className={dark ? "text-gold" : "text-brownHover"}>—</span>
      {children}
    </li>
  );
}

function Scroll({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`bg-cream border border-[rgba(33,30,25,.14)] overflow-x-auto [-webkit-overflow-scrolling:touch] ${className}`}>
      <table className="border-collapse w-full [&_tbody_tr:last-child_td]:border-b-0">{children}</table>
    </div>
  );
}

export default function PricingPage() {
  return (
    <div className="min-h-screen flex flex-col pt-[57px] md:pt-[76px]">
      <SiteHeader />

      <main className="flex-1 px-[18px] pt-[40px] pb-[96px] md:px-[40px] md:pt-[72px] md:pb-[140px]">
        <div className="w-full max-w-[1100px] mx-auto">
          {/* HERO */}
          <section className="mb-[64px] md:mb-[96px]">
            <div className="text-[11px] tracking-[.3em] text-brownHover mb-[22px]">MEMBERSHIP &amp; PRICING</div>
            <h1 className="font-semibold text-[30px] md:text-[clamp(30px,4vw,52px)] leading-[1.28] mb-[24px] text-pretty">경험에서 시작해<br />관계로 이어지는 멤버십</h1>
            <p className="text-[16.5px] leading-[1.75] text-[rgba(33,30,25,.68)] max-w-[600px] text-pretty">
              한 번의 경험으로 시작하고, 커뮤니티로 머물고, 원할 때 관계 프로그램으로 확장합니다. <br />모든 금액은 VAT 포함 총액입니다.
            </p>
          </section>

          {/* MEMBERSHIP CARDS */}
          <section className="mb-[64px] md:mb-[96px]">
            <div className={`${SECTION_LABEL} mb-[28px]`}>01 · MEMBERSHIP</div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-[16px] items-stretch">
              <div className={CARD}>
                <div className="text-[11px] tracking-[.24em] text-brownHover mb-[14px]">RSC PREVIEW</div>
                <div className={PRICE}>165,000<span className={WON}>원</span></div>
                <div className="text-[13px] text-[rgba(33,30,25,.55)] mt-[10px] mb-[26px]">1회 · 생애 최초 1회 한정</div>
                <p className="mb-[26px] text-[14.5px] leading-[1.65] text-[rgba(33,30,25,.75)]">가입 전, RSC의 공간·회원·프로그램을 <br />실제 행사로 먼저 경험합니다.</p>
                <ul className={`${LIST} text-[rgba(33,30,25,.8)]`}>
                  <Li>RSC Basic Event 1회</Li>
                  <Li>호스트 온보딩 · 공간 안내</Li>
                  <Li>행사 후 멤버십 상담</Li>
                  <Li>행사 당일 주차 3시간</Li>
                </ul>
                <div className="border-t border-[rgba(33,30,25,.12)] pt-[16px] text-[12.5px] leading-[1.55] text-brown">7일 이내 ACCESS·SIGNATURE 가입 시<br />165,000원 전액 차감</div>
              </div>

              <div className={CARD}>
                <div className="text-[11px] tracking-[.24em] text-brownHover mb-[14px]">RSC ACCESS</div>
                <div className={PRICE}>3,300,000<span className={WON}>원</span></div>
                <div className="text-[13px] text-[rgba(33,30,25,.55)] mt-[10px] mb-[26px]">연간 · 월 환산 275,000원</div>
                <p className="mb-[26px] text-[14.5px] leading-[1.65] text-[rgba(33,30,25,.75)]">검증된 싱글 커뮤니티. 1년 동안 라움의 공간과 <br />프로그램을 일상으로 누립니다.</p>
                <ul className={`${LIST} text-[rgba(33,30,25,.8)]`}>
                  <Li>RSC Basic Event 연 8회 포함</Li>
                  <Li>6개 카테고리 행사 우선 예약</Li>
                  <Li>지인 초대권 연 8매</Li>
                  <Li>CONECTION SELECT 1회 포함</Li>
                  <Li>RSC 라운지 상시 · 평일 무료주차</Li>
                  <Li>아트센터 대관 우선 · 파트너 할인</Li>
                  <Li>PRIVATE CONNECTION 1회 포함</Li>
                </ul>
                <div className="border-t border-[rgba(33,30,25,.12)] pt-[16px] text-[12.5px] leading-[1.55] text-brown">Founding Member 100명 한정 2,400,000원</div>
              </div>

              <div className="bg-ink text-cream px-[32px] py-[36px] flex flex-col relative">
                <div className="absolute top-[18px] right-[18px] text-[10px] tracking-[.2em] px-[10px] py-[6px] bg-gold text-ink font-bold">RECOMMENDED</div>
                <div className="text-[11px] tracking-[.24em] text-gold mb-[14px]">RSC SIGNATURE</div>
                <div className={PRICE}>8,800,000<span className={WON}>원</span></div>
                <div className="text-[13px] text-[rgba(247,243,236,.6)] mt-[10px] mb-[26px]">연간 · 월 환산 733,000원</div>
                <p className="mb-[26px] text-[14.5px] leading-[1.65] text-[rgba(247,243,236,.85)]">커뮤니티와 관계 형성을 하나로. ACCESS 전 혜택에 관계 프로그램과 전담 컨시어지를 더했습니다.</p>
                <ul className={`${LIST} text-[rgba(247,243,236,.9)]`}>
                  <Li dark>Basic Event 연 18회 + Premium Night 4회</Li>
                  <Li dark>CONNECTION SELECT 3회 포함</Li>
                  <Li dark>RAUM SOLO 1시즌 무료 · 추가 시즌 50% 할인</Li>
                  <Li dark>지인 초대권 연 12매</Li>
                  <Li dark>미팅룸·세미나룸 각 연 4회</Li>
                  <Li dark>전담 Relationship Concierge</Li>
                </ul>
                <div className="border-t border-[rgba(247,243,236,.15)] pt-[16px] text-[12.5px] leading-[1.55] text-gold">개별 환산 약 10,110,000원 → 1,310,000원 절감<br />Founding Member 100명 한정 7,200,000원</div>
              </div>
            </div>
          </section>

          {/* RELATIONSHIP PROGRAMS */}
          <section className="mb-[64px] md:mb-[96px]">
            <div className={`${SECTION_LABEL} mb-[16px]`}>02 · RELATIONSHIP PROGRAMS</div>
            <h2 className={`${H2} mb-[12px]`}>관계 프로그램</h2>
            <p className="mb-[32px] text-[15px] leading-[1.7] text-[rgba(33,30,25,.65)] max-w-[600px]">
              멤버십과 별도로 선택하는 프로그램입니다. CONNECTION은 실제 대면이 이루어진 경우에만 1회 차감되며(프로필 열람만으로 차감하지 않음), 교제·성혼은 보장하지 않고 성혼비는 없습니다.
            </p>
            <Scroll>
              <thead>
                <tr><th className={TH}>프로그램</th><th className={TH}>가격</th><th className={TH}>단위</th><th className={TH}>내용</th></tr>
              </thead>
              <tbody>
                <tr>
                  <td className={TD}><b>RAUM SOLO</b><div className={SUB}>6주 시즌 · 기수제</div></td>
                  <td className={`${TD} whitespace-nowrap`}><b>660,000원</b><div className={SUB}>ACCESS 회원 550,000원<br />SIGNATURE 첫 시즌 무료</div></td>
                  <td className={`${TD} whitespace-nowrap`}>6회 · 회당 110,000원</td>
                  <td className={TD}>취향 기반 반복 만남. Welcome Table → Taste Pairing → Social Rotation → Team Experience → Date Lab → Final Soirée</td>
                </tr>
                <tr>
                  <td className={TD}><b>CONNECTION ESSENTIAL</b></td>
                  <td className={`${TD} whitespace-nowrap`}><b>550,000원</b></td>
                  <td className={`${TD} whitespace-nowrap`}>실제 대면 1회</td>
                  <td className={TD}>기본 상담, RSC 내부 회원 큐레이션, 일정 조율</td>
                </tr>
                <tr>
                  <td className={TD}><b>CONNECTION SELECT</b></td>
                  <td className={`${TD} whitespace-nowrap`}><b>1,100,000원</b></td>
                  <td className={`${TD} whitespace-nowrap`}>실제 대면 1회</td>
                  <td className={TD}>심층 인터뷰, 우선 큐레이션, 프로필 정비, 만남 후 피드백</td>
                </tr>
                <tr>
                  <td className={TD}><b>CONNECTION BESPOKE</b></td>
                  <td className={`${TD} whitespace-nowrap`}><b>2,200,000원</b></td>
                  <td className={`${TD} whitespace-nowrap`}>실제 대면 1회</td>
                  <td className={TD}>시니어 디렉터 전담, 고난도 조건 설계, 집중 탐색, 전담 피드백</td>
                </tr>
                <tr>
                  <td className={TD}><b>RAUM MERRY</b><div className={SUB}>결혼 목적 플래그십</div></td>
                  <td className={`${TD} whitespace-nowrap`}><b>33,000,000원부터</b></td>
                  <td className={`${TD} whitespace-nowrap`}>12개월 · 실제 만남 8회</td>
                  <td className={TD}>Relationship Director 전담. 별도 신청·심사, 탐색 난이도에 따른 맞춤 견적</td>
                </tr>
              </tbody>
            </Scroll>
          </section>

          {/* PATH */}
          <section className="mb-[64px] md:mb-[96px]">
            <div className={`${SECTION_LABEL} mb-[16px]`}>03 · YOUR PATH</div>
            <h2 className={`${H2} mb-[32px]`}>어디서 시작하든, 다음 단계가 있습니다</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-[rgba(33,30,25,.14)] border border-[rgba(33,30,25,.14)]">
              {[
                { s: "STEP 1 · 경험", t: "PREVIEW", d: "가입 전 행사 1회로 RSC를 확인합니다." },
                { s: "STEP 2 · 커뮤니티", t: "ACCESS", d: "1년 동안 같은 공간에서 반복해 마주칩니다." },
                { s: "STEP 3 · 관계", t: "SOLO · CONNECTION · SIGNATURE", d: "원하는 깊이로 관계 프로그램을 더합니다." },
              ].map((c) => (
                <div key={c.t} className="bg-cream px-[28px] py-[30px]">
                  <div className="text-[11px] tracking-[.2em] text-brownHover mb-[12px]">{c.s}</div>
                  <div className="text-[17px] font-semibold mb-[8px]">{c.t}</div>
                  <div className="text-[13.5px] leading-[1.6] text-[rgba(33,30,25,.65)]">{c.d}</div>
                </div>
              ))}
            </div>
            <Scroll className="mt-[28px]">
              <thead>
                <tr><th className={TH}>선택안</th><th className={TH}>결제액</th><th className={TH}>포함 구성</th><th className={TH}>적합 고객</th></tr>
              </thead>
              <tbody>
                <tr><td className={TD}>ACCESS</td><td className={`${TD} whitespace-nowrap`}>3,300,000원</td><td className={TD}>연간 커뮤니티 혜택 + CONNECTION 1회</td><td className={TD}>커뮤니티 중심</td></tr>
                <tr><td className={TD}>ACCESS + SELECT 1회</td><td className={`${TD} whitespace-nowrap`}>4,400,000원</td><td className={TD}>커뮤니티 + 1:1 만남 2회</td><td className={TD}>가벼운 관계 탐색</td></tr>
                <tr><td className={TD}>ACCESS + SELECT 3회 + SOLO</td><td className={`${TD} whitespace-nowrap`}>7,150,000원</td><td className={TD}>커뮤니티 + 1:1 만남 4회 + 6주 프로그램</td><td className={TD}>적극적 관계 탐색</td></tr>
                <tr className="bg-[rgba(226,180,120,.18)]"><td className={TD}><b>SIGNATURE</b></td><td className={`${TD} whitespace-nowrap`}><b>8,800,000원</b></td><td className={TD}><b>위 구성 + 프리미엄 행사·초청·공간·컨시어지</b></td><td className={TD}><b>대표 선택</b></td></tr>
              </tbody>
            </Scroll>
          </section>

          {/* UPGRADE / POLICY */}
          <section className="mb-[64px] md:mb-[96px]">
            <div className={`${SECTION_LABEL} mb-[16px]`}>04 · UPGRADE &amp; POLICY</div>
            <h2 className={`${H2} mb-[32px]`}>전환 · 운영 기준</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-[16px] items-start">
              <div className="bg-cream border border-[rgba(33,30,25,.14)] p-[30px]">
                <div className="text-[12px] tracking-[.2em] text-brownHover mb-[18px]">전환 시 차감 기준</div>
                <div className="grid">
                  {[
                    ["PREVIEW → ACCESS·SIGNATURE", "7일 이내 165,000원 전액 차감"],
                    ["ACCESS → SIGNATURE", "60일 이내 전액 차감 · 이후 잔여기간 비례 차감"],
                    ["SOLO → SIGNATURE", "시즌 시작 14일 이내 SOLO 결제액 차감"],
                    ["CONNECTION → SIGNATURE", "30일 이내 미사용 SELECT 결제액 전액 차감"],
                    ["SIGNATURE → MERRY", "잔여 횟수·기간을 MERRY 계약에 반영"],
                  ].map(([k, v], i, arr) => (
                    <div key={k} className={`${POLICY_ROW} ${i < arr.length - 1 ? "border-b border-[rgba(33,30,25,.1)]" : ""}`}>
                      <b>{k}</b><span className="text-[rgba(33,30,25,.7)]">{v}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="bg-cream border border-[rgba(33,30,25,.14)] p-[30px]">
                <div className="text-[12px] tracking-[.2em] text-brownHover mb-[18px]">운영 원칙</div>
                <div className="grid">
                  {[
                    ["가격 표시", "VAT 포함 총액 · 공개 할인 미운영 (Founding Member 100명 한정 혜택가 제외)"],
                    ["분납", "ACCESS 최대 2회 · SIGNATURE 최대 3회 · MERRY 별도 협의"],
                    ["갱신", "자동 갱신 없음 · 만료 30일 전 안내 후 재결제"],
                    ["홀드", "계약기간 중 1회 · 30~90일 · 객관적 사유 시"],
                    ["양도·재판매", "불가"],
                    ["가입 자격", "만 19세 이상 · 법률상 배우자 없음 · 상담·적합성 심사"],
                  ].map(([k, v], i, arr) => (
                    <div key={k} className={`${POLICY_ROW} ${i < arr.length - 1 ? "border-b border-[rgba(33,30,25,.1)]" : ""}`}>
                      <b>{k}</b><span className="text-[rgba(33,30,25,.7)]">{v}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <p className="mt-[24px] text-[12.5px] leading-[1.7] text-[rgba(33,30,25,.5)]">
              환불은 상품별 산정 기준에 따르며, 관계 법령과 소비자분쟁해결기준 중 회원에게 유리한 기준을 우선 적용합니다. 상세 환불·노쇼·홀드 기준은 상담 시 안내드립니다.
            </p>
          </section>

          {/* CTA */}
          <section className="bg-ink text-cream px-[48px] py-[64px] text-center">
            <div className="text-[11px] tracking-[.3em] text-gold mb-[20px]">START WITH A CONVERSATION</div>
            <h2 className="font-semibold text-[24px] md:text-[clamp(24px,2.8vw,36px)] leading-[1.3] mb-[16px]">어떤 멤버십이 맞을지, 함께 찾아드립니다</h2>
            <p className="mx-auto mb-[36px] text-[15px] leading-[1.7] text-[rgba(247,243,236,.7)] max-w-[520px]">
              상담 후 PREVIEW 행사로 먼저 경험해보세요. <br />가입을 결정하시면 PREVIEW 비용은 전액 차감됩니다.
            </p>
            <div className="flex gap-[12px] justify-center flex-wrap">
              <Link href="/fit-check" className="inline-flex items-center px-[32px] py-[16px] rounded-pill bg-gold text-ink text-[14px] font-bold hover:bg-goldHover hover:text-ink">RSC 상담 신청하기</Link>
              <a href="https://www.instagram.com/raum_socialclub/" target="_blank" rel="noreferrer" className="inline-flex items-center px-[32px] py-[16px] rounded-pill border border-[rgba(247,243,236,.35)] text-cream text-[14px] hover:border-gold hover:text-gold">인스타그램</a>
            </div>
          </section>
        </div>
      </main>
      <SiteFooter />
      <UpButton />
    </div>
  );
}
