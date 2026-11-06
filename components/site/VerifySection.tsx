import { Txt, nowrap } from "@/components/cms/Txt";
import { CARD, CARD_HOVER, Container, SectionHead } from "@/components/ui/ds";
import type { DocData } from "@/lib/cms/get";
import { list, s } from "@/lib/cms/get";

const ICONS: Record<string, React.ReactNode> = {
  shield: <path d="M12 3l7 3v5c0 4.5-3 8-7 10-4-2-7-5.5-7-10V6l7-3zm-3 9l2 2 4-4" />,
  briefcase: <path d="M4 8h16v11H4zM9 8V5h6v3M4 13h16" />,
  chat: <path d="M4 5h16v11H9l-5 4zM8 9h8M8 12h5" />,
  people: <path d="M9 11a3 3 0 100-6 3 3 0 000 6zm8 0a2.5 2.5 0 100-5 2.5 2.5 0 000 5zM3 20c0-3 3-5 6-5s6 2 6 5M15 15c3 0 6 1.5 6 4.5" />,
};

/**
 * 가입 심사 섹션 「아무나, 들어올 수 없습니다」. 검정 원 안의 선 아이콘 + 제목 + 한 줄 설명 카드.
 * 사업전략: 가입 심사(신분증·혼인관계증명서·재직 증빙) + 프로필·취향 인터뷰·매너 서약 + 실제 커뮤니티 활동으로 2차 검증.
 */
export function VerifySection({ doc, tone = "sand" }: { doc: DocData; tone?: "sand" | "white" }) {
  const items = list<{ icon: string; title: string; body: string }>(doc, "items");
  return (
    <section id="verify" data-fold className={`py-[64px] md:py-[112px] ${tone === "sand" ? "bg-sand" : ""}`}>
      <Container>
        <SectionHead eyebrow={s(doc, "label")} title={<Txt v={s(doc, "title")} breaks="hard" />} lead={<Txt v={s(doc, "lead")} />} reveal />
        <div className="grid grid-cols-1 gap-[10px] md:grid-cols-4 md:gap-[16px] mt-[32px] md:mt-[40px]">
          {items.map((it, i) => (
            <div key={i} data-reveal style={{ "--d": `${i * 90}ms` } as React.CSSProperties} className={`${CARD} ${CARD_HOVER} p-[20px] md:p-[28px] flex gap-[16px] items-start md:block`}>
              <div className="w-[48px] h-[48px] md:w-[56px] md:h-[56px] rounded-full bg-inverseBg text-white flex items-center justify-center flex-none md:mb-[24px]">
                <svg aria-hidden width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">{ICONS[it.icon] ?? ICONS.shield}</svg>
              </div>
              <div className="min-w-0">
                <h3 className="t-headline-1 md:t-heading-2 text-label mb-[6px] md:mb-[8px] text-pretty">{nowrap(it.title)}</h3>
                <p className="t-body-2-reading text-labelAlt text-pretty m-0"><Txt v={it.body} /></p>
              </div>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}
