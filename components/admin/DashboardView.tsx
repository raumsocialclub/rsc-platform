import Link from "next/link";
import { CARD, TH, TD, Badge, EmptyRow, PageTitle } from "./ui";
import { orderBadge, won } from "@/lib/admin/format";
import type { DashboardStats, Range } from "@/lib/admin/stats";
import { BOOKING_STATUS_KO } from "@/lib/bookings/types";
import { fmtDay, fmtTime } from "@/lib/programs/format";

const RANGES: { key: Range; label: string }[] = [{ key: "month", label: "이번 달" }, { key: "last", label: "지난 달" }, { key: "year", label: "올해" }];

function delta(cur: number, prev: number, unit: string, prevLabel: string): { text: string; color: string } {
  if (prev === 0 && cur === 0) return { text: `${prevLabel} 0${unit}`, color: "rgba(33,30,25,.55)" };
  if (prev === 0) return { text: `${prevLabel} 0${unit} → 신규`, color: "#2e6b3e" };
  const pct = Math.round(((cur - prev) / prev) * 100);
  if (pct === 0) return { text: `${prevLabel}과 동일`, color: "rgba(33,30,25,.55)" };
  return { text: `${pct > 0 ? "▲" : "▼"} ${Math.abs(pct)}% vs ${prevLabel}`, color: pct > 0 ? "#2e6b3e" : "#a3402c" };
}

/** design/RSC Admin.dc.html DASHBOARD 뷰: KPI 4 · 일별(월별) 매출 바 · 프로그램별 매출 · 최근 예약 + 마감 임박 (ToDo M7) */
export function DashboardView({ s }: { s: DashboardStats }) {
  const prevLabel = s.range === "year" ? "작년" : "지난 달";
  const rev = delta(s.revenue, s.prevRevenue, "원", prevLabel);
  const bk = delta(s.bookings, s.prevBookings, "건", prevLabel);
  const cards = [
    { label: s.range === "year" ? "올해 매출" : "이번 달 매출", value: won(s.revenue), delta: s.refunds ? `${rev.text} · 환불 ${won(s.refunds)}` : rev.text, color: rev.color },
    { label: "예약 건수", value: `${s.bookings}건`, delta: bk.text, color: bk.color },
    { label: "활동 회원", value: `${s.activeMembers}명`, delta: `신규 ${s.newMembers}명`, color: "rgba(33,30,25,.55)" },
    { label: "상담 대기", value: `${s.pendingInquiries}건`, delta: s.pendingInquiries ? "확인이 필요합니다" : "대기 없음", color: s.pendingInquiries ? "#7a5420" : "rgba(33,30,25,.55)" },
  ];
  const max = Math.max(1, ...s.bars.map((b) => b.value));
  const lastIdx = s.bars.length - 1;
  const shareMax = Math.max(1, ...s.shares.map((x) => x.value));
  const manwon = (v: number) => `${Math.round(v / 10000).toLocaleString("ko-KR")}만`;

  return (
    <>
      <PageTitle overline="DASHBOARD" title={s.label}>
        <div className="flex gap-[8px]">
          {RANGES.map((r) => (
            <Link key={r.key} href={r.key === "month" ? "/admin" : `/admin?range=${r.key}`} className="border border-[rgba(33,30,25,.2)] px-[16px] py-[9px] text-[12.5px]" style={{ background: s.range === r.key ? "#fff" : "transparent", fontWeight: s.range === r.key ? 600 : 400 }}>
              {r.label}
            </Link>
          ))}
        </div>
      </PageTitle>

      <div className="grid grid-cols-2 min-[1201px]:grid-cols-4 gap-[16px] mb-[28px]">
        {cards.map((c) => (
          <div key={c.label} className={`${CARD} px-[24px] py-[22px]`}>
            <div className="text-[11.5px] tracking-[.08em] text-[rgba(33,30,25,.5)] mb-[12px]">{c.label}</div>
            <div className="text-[clamp(18px,1.6vw,26px)] font-semibold tracking-[-.01em] whitespace-nowrap">{c.value}</div>
            <div className="text-[12px] mt-[8px]" style={{ color: c.color }}>{c.delta}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 min-[1201px]:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)] gap-[16px] mb-[28px]">
        <div className={`${CARD} p-[24px]`}>
          <div className="flex justify-between mb-[20px]"><b className="text-[14px]">{s.range === "year" ? "월별 매출" : "일별 매출"}</b><span className="text-[12px] text-[rgba(33,30,25,.5)]">단위: 만원</span></div>
          <div className="flex items-end gap-[4px] h-[160px]">
            {s.bars.map((b, i) => (
              <div key={b.label} title={`${b.label} · ${manwon(b.value)}원`} className="flex-1 min-w-0" style={{ height: `${Math.max(3, Math.round((b.value / max) * 100))}%`, background: b.value === 0 ? "rgba(33,30,25,.06)" : i === lastIdx ? "#5a3d24" : "#c9b79a" }} />
            ))}
          </div>
          <div className="flex justify-between text-[11px] text-[rgba(33,30,25,.45)] mt-[8px]">
            <span>{s.bars[0]?.label}</span><span>{s.bars[Math.floor(lastIdx / 2)]?.label}</span><span>{s.bars[lastIdx]?.label}</span>
          </div>
        </div>
        <div className={`${CARD} p-[24px]`}>
          <b className="text-[14px] block mb-[18px]">프로그램별 매출</b>
          {s.shares.length === 0 ? <div className="text-[13px] text-[rgba(33,30,25,.5)]">기간 내 결제가 없습니다.</div> : (
            <div className="grid gap-[14px]">
              {s.shares.map((p) => (
                <div key={p.name}>
                  <div className="flex justify-between text-[13px] mb-[6px]"><span className="truncate mr-[8px]">{p.name}</span><b className="whitespace-nowrap">{manwon(p.value)}</b></div>
                  <div className="h-[6px] bg-[rgba(33,30,25,.08)]"><div className="h-full bg-brown" style={{ width: `${Math.round((p.value / shareMax) * 100)}%` }} /></div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 min-[1201px]:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)] gap-[16px]">
        <div className={`${CARD} p-[24px]`}>
          <div className="flex justify-between mb-[14px]"><b className="text-[14px]">최근 예약</b><Link href="/admin/orders" className="text-[12.5px] text-brown font-semibold">전체 보기 →</Link></div>
          <div className="overflow-x-auto">
            <table className="border-collapse w-full">
              <thead><tr>{["예약번호", "회원", "프로그램", "인원", "결제", "금액", "상태"].map((h) => <th key={h} className={TH}>{h}</th>)}</tr></thead>
              <tbody>
                {s.recent.length === 0 && <EmptyRow colSpan={7}>아직 예약이 없습니다.</EmptyRow>}
                {s.recent.map((o) => (
                  <tr key={o.id} className="hover:bg-[#faf7f1]">
                    <td className={`${TD} text-[12.5px] text-[rgba(33,30,25,.6)]`}><Link href={`/admin/orders?id=${o.id}`}>{o.order_id}</Link></td>
                    <td className={TD}><b>{o.member?.name ?? "—"}</b></td>
                    <td className={TD}>{o.program?.name ?? "—"}</td>
                    <td className={TD}>{o.qty}</td>
                    <td className={TD}>{o.payment?.method ?? "—"}</td>
                    <td className={TD}><b>{won(o.amount)}</b></td>
                    <td className={TD}><Badge style={orderBadge(o.status)}>{BOOKING_STATUS_KO[o.status]}</Badge></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <div className={`${CARD} p-[24px]`}>
          <div className="flex justify-between mb-[14px]"><b className="text-[14px]">마감 임박 · 2주 내 회차</b><Link href="/admin/programs" className="text-[12.5px] text-brown font-semibold">프로그램 →</Link></div>
          {s.closing.length === 0 ? <div className="text-[13px] text-[rgba(33,30,25,.5)]">2주 내 예정된 회차가 없습니다.</div> : (
            <div className="grid gap-[12px]">
              {s.closing.map((c) => {
                const booked = c.capacity - c.remaining;
                const pct = c.capacity ? Math.round((booked / c.capacity) * 100) : 0;
                return (
                  <Link key={c.session_id} href={`/admin/programs/${c.program_id}`} className="block">
                    <div className="flex justify-between text-[13px] mb-[6px]"><span className="truncate mr-[8px]">{c.name}<span className="text-[11.5px] text-[rgba(33,30,25,.5)] ml-[6px]">{fmtDay(c.starts_at)} {fmtTime(c.starts_at)}</span></span><b className="whitespace-nowrap" style={{ color: c.remaining === 0 ? "#a3402c" : c.remaining <= 3 ? "#7a5420" : "inherit" }}>{c.remaining === 0 ? "마감" : `잔여 ${c.remaining}`} · {booked}/{c.capacity}</b></div>
                    <div className="h-[6px] bg-[rgba(33,30,25,.08)]"><div className="h-full" style={{ width: `${pct}%`, background: c.remaining === 0 ? "#a3402c" : "#5a3d24" }} /></div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
