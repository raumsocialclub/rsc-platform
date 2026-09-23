"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { CARD, BTN_SECONDARY, FIELD } from "./ui";
import { Badge } from "./ui";
import { orderBadge, won } from "@/lib/admin/format";
import type { OrderRow } from "@/lib/admin/types";
import { BOOKING_STATUS_KO } from "@/lib/bookings/types";
import { fmtFull } from "@/lib/programs/format";

/** 예약 상세 패널: 결제 정보(토스 paymentKey, 영수증) + 환불(취소) 버튼 (README 어드민 5) */
export function OrderDetail({ order }: { order: OrderRow }) {
  const router = useRouter();
  const pay = order.payment;
  const refundable = order.status === "confirmed" || order.status === "attended" || order.status === "pending";
  const balance = pay?.balance ?? 0;
  const [amount, setAmount] = useState(String(balance));
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const refund = async () => {
    const n = Number(amount);
    if (!Number.isInteger(n) || n < 0 || n > balance) {
      setMsg(`환불 금액은 0 ~ ${won(balance)} 사이여야 합니다.`);
      return;
    }
    if (reason.trim().length < 2) {
      setMsg("사유를 입력해 주세요. (활동 로그와 토스 취소 사유에 기록됩니다)");
      return;
    }
    const what = n > 0 ? `${won(n)} 환불하고 예약을 취소할까요?` : "환불 없이 예약만 취소할까요?";
    if (!confirm(`${order.order_id}\n${what}`)) return;
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch(`/api/admin/orders/${order.id}/refund`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ amount: n, reason: reason.trim() }) });
      const j = (await res.json().catch(() => null)) as { ok?: boolean; message?: string; refunded?: number } | null;
      if (!j?.ok) throw new Error(j?.message ?? "처리하지 못했습니다.");
      setMsg(j.refunded ? `${won(j.refunded)} 환불 완료` : "예약을 취소했습니다.");
      router.refresh();
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "처리하지 못했습니다.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className={`${CARD} p-[26px]`}>
      <div className="flex justify-between items-start gap-[12px] mb-[18px]">
        <div>
          <div className="text-[12px] tracking-[.2em] text-[rgba(33,30,25,.5)] mb-[8px]">예약 상세</div>
          <b className="text-[15px]">{order.order_id}</b>
        </div>
        <Badge style={orderBadge(order.status)}>{BOOKING_STATUS_KO[order.status]}</Badge>
      </div>
      <div className="grid gap-[10px] mb-[20px]">
        <Row k="회원" v={order.member ? `${order.member.name}${order.member.phone ? ` · ${order.member.phone}` : ""}` : "—"} />
        <Row k="이메일" v={order.member?.email ?? "—"} />
        <Row k="프로그램" v={order.program?.name ?? "—"} />
        <Row k="프로그램 일시" v={order.session ? fmtFull(order.session.starts_at) : "—"} />
        <Row k="인원 · 금액" v={`${order.qty}명 · ${won(order.amount)}`} />
        <Row k="예약 생성" v={fmtFull(order.created_at)} />
        {order.status === "pending" && <Row k="결제 기한" v={fmtFull(order.expires_at)} />}
        {order.cancelled_at && <Row k="취소 일시" v={fmtFull(order.cancelled_at)} />}
      </div>

      <div className="text-[12px] tracking-[.2em] text-[rgba(33,30,25,.5)] mb-[10px]">결제</div>
      {pay ? (
        <div className="grid gap-[10px] mb-[20px]">
          <Row k="결제수단" v={pay.method ?? "—"} />
          <Row k="승인 금액" v={won(pay.amount)} />
          <Row k="남은 금액" v={won(pay.balance)} />
          <Row k="상태" v={{ paid: "결제 완료", cancelled: "전액 환불", partial_cancelled: "부분 환불", ready: "대기", failed: "실패" }[pay.status]} />
          <Row k="승인 일시" v={pay.approved_at ? fmtFull(pay.approved_at) : "—"} />
          <Row k="paymentKey" v={<span className="text-[11.5px] font-normal">{pay.payment_key ?? "—"}</span>} />
          {pay.receipt_url && <Row k="영수증" v={<a href={pay.receipt_url} target="_blank" rel="noreferrer" className="text-brown">토스 영수증 열기 ↗</a>} />}
        </div>
      ) : (
        <div className="text-[13px] text-[rgba(33,30,25,.5)] mb-[20px]">{order.status === "pending" ? "아직 결제되지 않았습니다 (15분 후 자동 만료)." : "결제 기록이 없습니다."}</div>
      )}

      {refundable && (
        <div className="border-t border-[rgba(33,30,25,.1)] pt-[18px]">
          <div className="text-[12px] tracking-[.2em] text-[rgba(33,30,25,.5)] mb-[10px]">{pay && balance > 0 ? "환불 · 취소" : "예약 취소"}</div>
          {pay && balance > 0 && (
            <div className="grid grid-cols-[1fr_auto] gap-[8px] mb-[8px]">
              <input type="number" min={0} max={balance} step={1000} value={amount} onChange={(e) => setAmount(e.target.value)} className={FIELD} />
              <button type="button" onClick={() => setAmount(String(balance))} className={`${BTN_SECONDARY} px-[12px] py-[8px] text-[12px]`}>전액</button>
            </div>
          )}
          <input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="사유 (필수 · 활동 로그와 토스 취소 사유에 기록)" className={`${FIELD} mb-[8px]`} required />
          <button type="button" onClick={refund} disabled={busy} className="w-full border border-[rgba(163,64,44,.5)] bg-transparent text-error px-[14px] py-[10px] text-[13px] font-semibold cursor-pointer hover:bg-[rgba(163,64,44,.06)] disabled:opacity-50">
            {busy ? "처리 중…" : pay && balance > 0 ? (Number(amount) > 0 ? `${won(Number(amount) || 0)} 환불하고 취소` : "환불 없이 취소") : "예약 취소"}
          </button>
          <div className="mt-[8px] text-[11.5px] text-[rgba(33,30,25,.45)]">관리자 환불은 환불 정책과 무관하게 금액을 지정합니다. 사유는 필수이며 처리자·금액과 함께 활동 로그에 남습니다. 토스 취소 API 가 호출되며 되돌릴 수 없습니다.</div>
        </div>
      )}
      {msg && <div className="mt-[12px] text-[12.5px] text-brown">{msg}</div>}
    </div>
  );
}

function Row({ k, v }: { k: string; v: React.ReactNode }) {
  return <div className="flex justify-between gap-[12px] text-[13.5px]"><span className="text-[rgba(33,30,25,.55)] flex-none">{k}</span><span className="text-right font-semibold break-all">{v}</span></div>;
}
