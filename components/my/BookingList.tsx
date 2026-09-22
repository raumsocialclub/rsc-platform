import Link from "next/link";
import { CancelBookingButton } from "./CancelBookingButton";
import { refundQuote, REFUND_POLICY_TEXT } from "@/lib/bookings/refund";
import { BOOKING_STATUS_KO, type BookingDetail } from "@/lib/bookings/types";
import { fmtDay, fmtTime, won } from "@/lib/programs/format";

const BADGE: Record<BookingDetail["status"], { background: string; color: string }> = {
  confirmed: { background: "rgba(46,107,62,.12)", color: "#2e6b3e" },
  pending: { background: "rgba(226,180,120,.25)", color: "#7a5420" },
  cancelled: { background: "rgba(163,64,44,.12)", color: "#a3402c" },
  expired: { background: "rgba(33,30,25,.08)", color: "rgba(33,30,25,.6)" },
  attended: { background: "rgba(33,30,25,.08)", color: "rgba(33,30,25,.6)" },
};

/** deploy/member.html MY 뷰: 예약 카드 목록 + 다가오는/지난 탭 (ToDo M6) */
export function BookingList({ bookings, tab, name, now }: { bookings: BookingDetail[]; tab: "upcoming" | "past"; name: string; now: number }) {
  const isPast = (b: BookingDetail) => new Date(b.session.starts_at).getTime() < now || b.status === "cancelled" || b.status === "expired" || b.status === "attended";
  const rows = bookings.filter((b) => (tab === "past" ? isPast(b) : !isPast(b)));

  return (
    <>
      <div className="text-[11px] tracking-[.3em] text-[rgba(33,30,25,.5)] mb-[16px]">MY RSC</div>
      <h1 className="font-medium text-[28px] md:text-[clamp(28px,3.4vw,42px)] leading-[1.3] mb-[24px]">{name ? `${name}님의 예약` : "내 예약"}</h1>
      <div className="flex gap-[8px] mb-[24px]">
        {[{ key: "upcoming", label: "다가오는 예약" }, { key: "past", label: "지난 예약" }].map((t) => {
          const on = t.key === tab;
          return (
            <Link key={t.key} href={t.key === "upcoming" ? "/my" : "/my?tab=past"} className="border border-[rgba(33,30,25,.2)] px-[16px] py-[8px] rounded-pill text-[12.5px] font-semibold hover:text-brownHover" style={{ background: on ? "#5a3d24" : "transparent", color: on ? "#f7f3ec" : "#5a3d24" }}>
              {t.label}
            </Link>
          );
        })}
      </div>
      {rows.length === 0 ? (
        <div className="bg-cream border border-[rgba(33,30,25,.14)] px-[28px] py-[56px] text-center">
          <div className="text-[15px] font-medium mb-[8px]">{tab === "past" ? "지난 예약이 없습니다" : "아직 예약한 프로그램이 없습니다"}</div>
          <Link href="/programs" className="text-[13px] font-semibold text-brown">프로그램 보기</Link>
        </div>
      ) : (
        <div className="grid gap-[14px]">
          {rows.map((b) => {
            const q = b.status === "confirmed" ? refundQuote(b.session.starts_at, b.amount) : null;
            const pendingAlive = b.status === "pending" && new Date(b.expires_at).getTime() > now;
            return (
              <div key={b.id} className="bg-white border border-[rgba(33,30,25,.12)] px-[20px] py-[20px] md:px-[26px] md:py-[22px] flex items-center justify-between gap-[16px] flex-wrap">
                <div className="min-w-0">
                  <div className="text-[11.5px] text-brownHover tracking-[.06em] mb-[6px]">{fmtDay(b.session.starts_at)} · {fmtTime(b.session.starts_at)}{b.program.kind === "season" ? " · 시즌권" : ""}</div>
                  <Link href={`/programs/${b.program_id}`} className="text-[17px] font-semibold text-ink hover:text-brownHover">{b.program.name}</Link>
                  <div className="text-[13px] text-[rgba(33,30,25,.55)] mt-[4px]">{b.order_id} · {won(b.amount)}{b.payment?.method ? ` · ${b.payment.method}` : ""}</div>
                  {b.payment?.receipt_url && b.status === "confirmed" && <a href={b.payment.receipt_url} target="_blank" rel="noreferrer" className="text-[12px] text-brown font-semibold">영수증 ↗</a>}
                </div>
                <div className="flex items-center gap-[14px] flex-wrap">
                  <span className="text-[12px] tracking-[.1em] px-[14px] py-[8px]" style={BADGE[b.status]}>{b.status === "pending" && !pendingAlive ? "만료" : BOOKING_STATUS_KO[b.status]}</span>
                  {pendingAlive && <Link href={`/checkout/${b.id}`} className="bg-brown text-cream hover:text-cream px-[14px] py-[8px] text-[12.5px] font-semibold">결제 이어하기</Link>}
                  {tab === "upcoming" && b.status === "confirmed" && q && (
                    <CancelBookingButton bookingId={b.id} refundText={q.allowed ? `${q.label} (${won(q.amount)})` : q.label} disabledReason={q.allowed ? null : `취소 불가 · ${q.label}`} />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
      <div className="mt-[20px] text-[12px] text-[rgba(33,30,25,.45)]">환불 규정: {REFUND_POLICY_TEXT}</div>
    </>
  );
}
