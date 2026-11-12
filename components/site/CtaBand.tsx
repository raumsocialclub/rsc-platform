import { Txt } from "@/components/cms/Txt";
import { ButtonLink, Container } from "@/components/ui/ds";

/**
 * 페이지 하단 검은 띠. track 이 있으면 해당 트랙 상담 버튼 하나, 없으면(홈) 두 트랙 버튼을 나란히.
 * 문구는 CMS(home.cta · social.cta · matching.cta)에서 페이지가 넘겨준다.
 */
export function CtaBand({ track, title, body, ctaLabel, socialLabel, matchingLabel }: { track?: "social" | "matching"; title?: string; body?: string; ctaLabel?: string; socialLabel?: string; matchingLabel?: string }) {
  const t = title || "상담으로 시작해 보세요";
  const b = body || "이름과 연락처만 남기면 담당자가 직접 연락드립니다. 가입이 아닌 상담 신청이며, 비용은 없습니다.";
  const sl = socialLabel || "소셜클럽 상담 신청", ml = matchingLabel || "1:1 매칭 상담 신청";
  return (
    <section data-fold className="py-[64px] md:py-[96px]">
      <Container>
        <div data-reveal className="bg-inverseBg rounded-ds px-[24px] py-[40px] md:px-[56px] md:py-[64px] text-center">
          <h2 className="t-title-3 md:t-title-1 text-inverseLabel text-pretty mb-[12px]">{t}</h2>
          <p className="t-body-1-reading text-[rgba(247,247,248,.7)] max-w-[520px] mx-auto mb-[28px] text-pretty"><Txt v={b} /></p>
          {track ? (
            <ButtonLink href={`/fit-check?track=${track}`} size="lg">{ctaLabel || (track === "social" ? sl : ml)}</ButtonLink>
          ) : (
            <div className="flex gap-[10px] justify-center flex-wrap">
              <ButtonLink href="/fit-check?track=social" size="lg">{sl}</ButtonLink>
              <ButtonLink href="/fit-check?track=matching" variant="inverse" size="lg">{ml}</ButtonLink>
            </div>
          )}
        </div>
      </Container>
    </section>
  );
}
