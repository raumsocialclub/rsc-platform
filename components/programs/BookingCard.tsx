import { BookButton } from "./BookButton";

type Props = {
  sessionId: string | null;
  date: string;
  place: string;
  capacity: number;
  remaining: number;
  priceText: string;
  seasonWeeks: number | null;
};

/**
 * 예약 카드. 데스크톱은 sticky(top 120px), 모바일은 본문 아래 + 하단 고정바(가격 · 결제 버튼).
 * 결제 버튼 → POST /api/bookings (pending 예약) → /checkout/[bookingId] 토스 결제위젯. (FLOWS.md 2)
 */
export function BookingCard({ sessionId, date, place, capacity, remaining, priceText, seasonWeeks }: Props) {
  const soldOut = remaining <= 0 || !sessionId;
  const cta = soldOut ? "마감되었습니다" : `${priceText} 결제하기`;
  const btnBase = "w-full border-0 px-[18px] py-[18px] text-[14px] tracking-[.06em] font-semibold text-center block rounded-none";
  const btnClass = soldOut
    ? `${btnBase} bg-[rgba(33,30,25,.15)] text-[rgba(33,30,25,.5)] cursor-not-allowed`
    : `${btnBase} bg-brown text-cream hover:bg-brownHover hover:text-cream cursor-pointer`;

  return (
    <>
      <div className="md:sticky md:top-[120px] bg-white border border-[rgba(33,30,25,.12)] p-[24px] md:p-[30px]">
        <div className="grid gap-[14px] text-[14px] mb-[24px]">
          <Row k="일시" v={date} />
          {seasonWeeks ? <Row k="구성" v={`${seasonWeeks}주 · 시즌권`} /> : null}
          <Row k="장소" v={place} />
          <Row k="정원" v={`${capacity}명 (잔여 ${remaining})`} />
          <div className="flex justify-between items-center"><span className="text-[rgba(33,30,25,.55)]">참가비</span><b className="text-[20px]">{priceText}</b></div>
        </div>
        <div className="flex items-center justify-between border-t border-[rgba(33,30,25,.1)] pt-[20px] mb-[22px]">
          <span className="text-[14px]">인원</span>
          <b className="text-[14px]">회원 본인 1명</b>
        </div>
        {soldOut || !sessionId ? <div className={btnClass}>{cta}</div> : <BookButton sessionId={sessionId} label={cta} className={btnClass} />}
        <div className="mt-[14px] text-[12px] text-[rgba(33,30,25,.45)] text-center">프로그램은 회원 본인만 예약할 수 있습니다</div>
      </div>

      {/* 모바일 하단 고정바 */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-[50] bg-[rgba(247,243,236,.96)] backdrop-blur-[12px] border-t border-[rgba(33,30,25,.12)] px-[18px] py-[12px] flex items-center gap-[14px]">
        <div className="min-w-0">
          <div className="text-[11px] text-[rgba(33,30,25,.5)]">잔여 {remaining}석</div>
          <div className="text-[17px] font-semibold whitespace-nowrap">{priceText}</div>
        </div>
        {soldOut ? (
          <div className="ml-auto bg-[rgba(33,30,25,.15)] text-[rgba(33,30,25,.5)] px-[22px] py-[14px] text-[13.5px] font-semibold whitespace-nowrap">마감</div>
        ) : (
          <div className="ml-auto"><BookButton sessionId={sessionId!} label="결제하기" busyLabel="잠시만요…" className="bg-brown text-cream hover:bg-brownHover px-[22px] py-[14px] text-[13.5px] font-semibold whitespace-nowrap border-0 cursor-pointer rounded-none" /></div>
        )}
      </div>
    </>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex justify-between gap-[12px]"><span className="text-[rgba(33,30,25,.55)] flex-none">{k}</span><b className="text-right">{v}</b></div>
  );
}
