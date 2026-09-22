import Image from "next/image";
import Link from "next/link";
import { BookingCard } from "./BookingCard";
import { fmtDay, fmtFull, fmtTime, scheduleText, won } from "@/lib/programs/format";
import { bookingTarget } from "@/lib/programs/queries";
import { categoryLabel, memberPrice, type ProgramWithSessions } from "@/lib/programs/types";

/** deploy/member.html DETAIL 뷰: 좌 본문(460px 이미지·설명·PROGRAM FLOW·NOTICE) + 우 sticky 예약 카드 */
export function ProgramDetail({ p, refundText = "프로그램 3일 전까지 100% 환불, 이후 환불 불가" }: { p: ProgramWithSessions; refundText?: string }) {
  const sch = scheduleText(p.kind, p.sessions);
  const { session, remaining } = bookingTarget(p);
  const price = memberPrice(p);
  const live = p.sessions.filter((s) => s.status !== "cancelled");
  const flowLabel = p.kind === "season" ? "SEASON SCHEDULE" : "PROGRAM FLOW";
  const flow = p.flow.length
    ? p.flow
    : p.kind === "season"
      ? live.map((s, i) => ({ t: `${i + 1}주`, d: fmtFull(s.starts_at) }))
      : [];

  return (
    <>
      <Link href="/programs" className="inline-block text-[13px] text-[rgba(33,30,25,.55)] mb-[24px]">← 프로그램 목록</Link>
      <div className="grid grid-cols-1 md:grid-cols-[minmax(0,1.4fr)_minmax(320px,1fr)] gap-[36px] md:gap-[48px] items-start">
        <div>
          <div className="relative h-[260px] md:h-[460px] bg-[#e7e0d3] overflow-hidden mb-[36px]">
            {p.image_url && <Image src={p.image_url} alt={p.name} fill priority sizes="(max-width: 760px) 100vw, 60vw" className="object-cover" style={{ filter: "brightness(0.95) saturate(0.92)" }} />}
          </div>
          <div className="text-[11px] tracking-[.3em] text-brownHover mb-[16px]">{categoryLabel(p.category)}{p.subtitle ? ` · ${p.subtitle}` : ""}</div>
          <h1 className="font-medium text-[28px] md:text-[clamp(28px,3.4vw,40px)] leading-[1.3] mb-[20px]">{p.name}</h1>
          <p className="mb-[36px] text-[16px] leading-[1.85] text-[rgba(33,30,25,.75)] whitespace-pre-line" style={{ textWrap: "pretty" }}>{p.description || p.short_desc}</p>

          {flow.length > 0 && (
            <>
              <div className="text-[12px] tracking-[.2em] text-[rgba(33,30,25,.5)] mb-[16px]">{flowLabel}</div>
              <div className="grid border-t border-[rgba(33,30,25,.12)]">
                {flow.map((f, i) => (
                  <div key={i} className="grid grid-cols-[80px_1fr] gap-[16px] py-[16px] border-b border-[rgba(33,30,25,.12)] text-[14.5px]">
                    <span className="text-brownHover font-semibold">{f.t}</span>
                    <span className="text-[rgba(33,30,25,.8)]">{f.d}</span>
                  </div>
                ))}
              </div>
            </>
          )}

          {p.kind === "season" && p.flow.length > 0 && live.length > 0 && (
            <>
              <div className="mt-[36px] text-[12px] tracking-[.2em] text-[rgba(33,30,25,.5)] mb-[16px]">DATES</div>
              <ul className="m-0 pl-[18px] text-[13.5px] leading-[1.8] text-[rgba(33,30,25,.65)]">
                {live.map((s, i) => <li key={s.id}>{i + 1}주차 · {fmtDay(s.starts_at)} {fmtTime(s.starts_at)}</li>)}
              </ul>
            </>
          )}

          <div className="mt-[36px] text-[12px] tracking-[.2em] text-[rgba(33,30,25,.5)] mb-[16px]">NOTICE</div>
          <ul className="m-0 pl-[18px] text-[13.5px] leading-[1.8] text-[rgba(33,30,25,.65)] list-disc">
            <li>{refundText}</li>
            <li>정원 마감 시 대기 신청으로 전환됩니다</li>
            <li>드레스코드 및 상세 안내는 결제 후 문자로 발송됩니다</li>
          </ul>
        </div>

        <BookingCard
          sessionId={session?.id ?? null}
          date={`${sch.date}${sch.time ? ` ${sch.time}` : ""}`}
          place={p.place || "라움"}
          capacity={session?.capacity ?? p.capacity}
          remaining={remaining}
          priceText={won(price)}
          seasonWeeks={p.kind === "season" ? live.length : null}
        />
      </div>
      {/* 모바일 하단 고정바 높이만큼 여백 */}
      <div className="h-[72px] md:hidden" aria-hidden />
    </>
  );
}
