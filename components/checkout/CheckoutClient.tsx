"use client";

import { loadPaymentWidget, type PaymentWidgetInstance } from "@tosspayments/payment-widget-sdk";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { describeTossError } from "@/lib/toss/errors";
import { won } from "@/lib/programs/format";

export type CheckoutProps = {
  bookingId: string;
  orderId: string;
  orderName: string;
  amount: number;
  unitPrice: number;
  programName: string;
  when: string;
  place: string;
  expiresAt: string;
  member: { name: string; email: string | null; phone: string | null };
  clientKey: string | null;
  customerKey: string;
  successUrl: string;
  failUrl: string;
  backHref: string;
  refundPolicy: string;
};

const SECTION = "text-[12px] tracking-[.2em] text-[rgba(33,30,25,.5)] mb-[18px]";
const CARD = "bg-white border border-[rgba(33,30,25,.12)] p-[20px] md:p-[28px]";

function useCountdown(expiresAt: string) {
  // 서버 렌더와 첫 클라이언트 렌더를 맞추기 위해 초기값은 15분, 마운트 후 실제 남은 시간으로 갱신
  const [left, setLeft] = useState(15 * 60_000);
  useEffect(() => {
    const tick = () => setLeft(Math.max(0, new Date(expiresAt).getTime() - Date.now()));
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, [expiresAt]);
  return left;
}

/**
 * deploy/member.html CHECKOUT 뷰: 좌 참가자 정보 + 결제 수단(토스 위젯) / 우 sticky 다크 ORDER SUMMARY + 골드 결제 버튼.
 * 쿠폰·초대권은 2차(ToDo M6 범위 밖). 결제 시간(15분) 카운트다운을 요약 카드에 표시한다.
 */
export function CheckoutClient(p: CheckoutProps) {
  const widgetRef = useRef<PaymentWidgetInstance | null>(null);
  const [ready, setReady] = useState(false);
  const [agreed, setAgreed] = useState(true);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const left = useCountdown(p.expiresAt);
  const expired = left <= 0;
  const mm = String(Math.floor(left / 60000)).padStart(2, "0");
  const ss = String(Math.floor((left % 60000) / 1000)).padStart(2, "0");

  const configErr = p.clientKey ? null : "결제 설정(NEXT_PUBLIC_TOSS_CLIENT_KEY)이 비어 있습니다. SETUP.md 를 참고해 주세요.";

  useEffect(() => {
    if (!p.clientKey) return;
    let alive = true;
    (async () => {
      try {
        const w = await loadPaymentWidget(p.clientKey!, p.customerKey);
        if (!alive) return;
        widgetRef.current = w;
        const methods = w.renderPaymentMethods("#toss-method", { value: p.amount }, { variantKey: "DEFAULT" });
        const agreement = w.renderAgreement("#toss-agreement", { variantKey: "AGREEMENT" });
        agreement.on("change", (st) => setAgreed(st.agreedRequiredTerms));
        methods.on("ready", () => setReady(true));
      } catch (e) {
        setErr(e instanceof Error ? `결제창을 불러오지 못했습니다. ${e.message}` : "결제창을 불러오지 못했습니다.");
      }
    })();
    return () => {
      alive = false;
    };
    // 위젯은 마운트 시 한 번만 로드한다
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const pay = async () => {
    if (!widgetRef.current || busy || expired) return;
    setBusy(true);
    setErr(null);
    try {
      await widgetRef.current.requestPayment({
        orderId: p.orderId,
        orderName: p.orderName,
        successUrl: p.successUrl,
        failUrl: p.failUrl,
        customerName: p.member.name,
        customerEmail: p.member.email ?? undefined,
        customerMobilePhone: p.member.phone ? p.member.phone.replace(/\D/g, "") : undefined,
      });
    } catch (e) {
      const code = (e as { code?: string })?.code ?? "";
      setErr(describeTossError(code, e instanceof Error ? e.message : "결제를 진행하지 못했습니다."));
      setBusy(false);
    }
  };

  const canPay = ready && agreed && !busy && !expired && !!p.clientKey;

  return (
    <>
      <Link href={p.backHref} className="inline-block text-[13px] text-[rgba(33,30,25,.55)] mb-[24px]">← 프로그램 상세</Link>
      <h1 className="font-medium text-[26px] md:text-[clamp(26px,3vw,36px)] leading-[1.3] mb-[36px]">결제</h1>
      <div className="grid grid-cols-1 md:grid-cols-[minmax(0,1.3fr)_minmax(320px,1fr)] gap-[28px] md:gap-[40px] items-start">
        <div className="grid gap-[24px] md:gap-[32px] min-w-0">
          <div className={CARD}>
            <div className={SECTION}>참가자 정보</div>
            <div className="grid gap-[10px] text-[14px]">
              <Row k="이름" v={p.member.name || "—"} />
              <Row k="휴대폰" v={p.member.phone || "—"} />
              <Row k="이메일" v={p.member.email || "—"} />
            </div>
            <div className="mt-[14px] text-[12px] text-[rgba(33,30,25,.45)]">프로그램은 회원 본인만 예약할 수 있습니다. 정보 수정은 고객센터로 문의해 주세요.</div>
          </div>
          <div className={`${CARD} !p-[8px] md:!p-[20px]`}>
            <div className={`${SECTION} px-[12px] pt-[12px] md:px-0 md:pt-0 !mb-[6px]`}>결제 수단</div>
            <div id="toss-method" className="min-h-[140px]" />
            <div id="toss-agreement" />
            {!ready && !err && p.clientKey && <div className="px-[12px] pb-[12px] text-[12.5px] text-[rgba(33,30,25,.5)]">결제창을 불러오는 중…</div>}
          </div>
        </div>

        <div className="md:sticky md:top-[120px] bg-ink text-cream p-[24px] md:p-[30px]">
          <div className="text-[11px] tracking-[.3em] text-gold mb-[18px]">ORDER SUMMARY</div>
          <div className="text-[17px] font-semibold mb-[6px]">{p.programName}</div>
          <div className="text-[13px] text-[rgba(247,243,236,.65)] mb-[24px]">{p.when} · {p.place}</div>
          <div className="grid gap-[12px] text-[14px] border-t border-[rgba(247,243,236,.15)] pt-[20px]">
            <div className="flex justify-between"><span className="text-[rgba(247,243,236,.65)]">{won(p.unitPrice)} × 1</span><span>{won(p.unitPrice)}</span></div>
            <div className="flex justify-between"><span className="text-[rgba(247,243,236,.65)]">할인</span><span className="text-gold">− {won(Math.max(0, p.unitPrice - p.amount))}</span></div>
            <div className="flex justify-between border-t border-[rgba(247,243,236,.15)] pt-[14px] text-[18px] font-semibold"><span>총 결제금액</span><span>{won(p.amount)}</span></div>
          </div>
          <div className="flex justify-between items-center mt-[18px] text-[12.5px] text-[rgba(247,243,236,.7)]">
            <span>결제 가능 시간</span>
            <b className={expired ? "text-[#f0c98e]" : "text-cream"}>{expired ? "만료됨" : `${mm}:${ss}`}</b>
          </div>
          <div className="mt-[16px] mb-[18px] text-[12px] leading-[1.6] text-[rgba(247,243,236,.55)]">{p.refundPolicy}. 주문 내용과 환불 규정을 확인했으며 결제에 동의합니다.</div>
          {(err ?? configErr) && <div className="mb-[14px] text-[12.5px] leading-[1.6] text-[#f0c98e]">{err ?? configErr}</div>}
          {expired ? (
            <Link href={p.backHref} className="block text-center w-full px-[18px] py-[18px] bg-[rgba(247,243,236,.15)] text-cream text-[14px] font-semibold hover:text-cream">시간이 지났습니다 · 다시 예약하기</Link>
          ) : (
            <button type="button" onClick={pay} disabled={!canPay} className="w-full border-0 cursor-pointer px-[18px] py-[18px] bg-gold text-ink text-[14px] tracking-[.06em] font-bold hover:bg-goldHover disabled:opacity-60 disabled:cursor-not-allowed rounded-none">
              {busy ? "결제창 여는 중…" : `${won(p.amount)} 결제하기`}
            </button>
          )}
        </div>
      </div>
    </>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return <div className="flex justify-between gap-[12px]"><span className="text-[rgba(33,30,25,.55)]">{k}</span><b className="text-right">{v}</b></div>;
}
