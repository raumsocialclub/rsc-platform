import Link from "next/link";
import { CARD, TH, TD, Badge, EmptyRow, PageTitle } from "./ui";
import { OrderDetail } from "./OrderDetail";
import { OrdersFilter } from "./OrdersFilter";
import { orderBadge, won } from "@/lib/admin/format";
import type { OrderRow } from "@/lib/admin/types";
import { BOOKING_STATUS_KO } from "@/lib/bookings/types";
import { fmtDay, fmtTime } from "@/lib/programs/format";

type Props = { rows: OrderRow[]; selected: OrderRow | null; programs: { id: string; name: string }[]; filter: { program: string; status: string } };

/** design/RSC Admin.dc.html ORDERS 뷰 + 상세 패널 (상담 신청 화면과 같은 2단 구성) */
export function OrdersView({ rows, selected, programs, filter }: Props) {
  const qs = (id?: string) => {
    const p = new URLSearchParams();
    if (filter.program) p.set("program", filter.program);
    if (filter.status) p.set("status", filter.status);
    if (id) p.set("id", id);
    const s = p.toString();
    return `/admin/orders${s ? `?${s}` : ""}`;
  };
  const paid = rows.filter((r) => r.status === "confirmed" || r.status === "attended");
  const total = paid.reduce((s, r) => s + (r.payment?.balance ?? r.amount), 0);
  return (
    <>
      <PageTitle overline="ORDERS" title="예약 · 결제 내역" aside={<span className="text-[16px] text-[rgba(33,30,25,.5)]">{rows.length}건 · {won(total)}</span>}>
        <OrdersFilter programs={programs} filter={filter} />
      </PageTitle>
      <div className="grid grid-cols-1 min-[1201px]:grid-cols-[minmax(0,1fr)_minmax(0,380px)] gap-[20px] items-start">
        <div className={CARD}>
          <div className="overflow-x-auto">
            <table className="border-collapse w-full">
              <thead><tr>{["예약번호", "예약일시", "회원", "프로그램", "인원", "결제수단", "금액", "상태"].map((h) => <th key={h} className={TH}>{h}</th>)}</tr></thead>
              <tbody>
                {rows.length === 0 && <EmptyRow colSpan={8}>조건에 맞는 예약이 없습니다.</EmptyRow>}
                {rows.map((r) => {
                  const active = selected?.id === r.id;
                  return (
                    <tr key={r.id} className={active ? "bg-[rgba(226,180,120,.18)]" : "hover:bg-[#faf7f1]"}>
                      <td className={`${TD} text-[12.5px] text-[rgba(33,30,25,.6)]`}><Link href={qs(r.id)} className="block">{r.order_id}</Link></td>
                      <td className={`${TD} text-[rgba(33,30,25,.6)]`}>{fmtDay(r.created_at)} {fmtTime(r.created_at)}</td>
                      <td className={TD}><Link href={qs(r.id)} className="block font-bold">{r.member?.name ?? "—"}</Link></td>
                      <td className={TD}>{r.program?.name ?? "—"}<span className="block text-[11.5px] text-[rgba(33,30,25,.5)]">{r.session ? `${fmtDay(r.session.starts_at)} ${fmtTime(r.session.starts_at)}` : ""}</span></td>
                      <td className={TD}>{r.qty}</td>
                      <td className={TD}>{r.payment?.method ?? "—"}</td>
                      <td className={TD}><b>{won(r.amount)}</b>{r.payment && r.payment.balance !== r.amount && <span className="block text-[11.5px] text-error">환불 {won(r.amount - r.payment.balance)}</span>}</td>
                      <td className={TD}><Badge style={orderBadge(r.status)}>{BOOKING_STATUS_KO[r.status]}</Badge></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
        {selected ? <OrderDetail key={`${selected.id}-${selected.status}-${selected.payment?.status ?? ""}`} order={selected} /> : <div className={`${CARD} p-[26px] text-[13px] text-[rgba(33,30,25,.5)]`}>목록에서 예약을 선택하면 상세와 환불 버튼이 표시됩니다.</div>}
      </div>
    </>
  );
}
