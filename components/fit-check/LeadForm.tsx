"use client";

import Link from "next/link";
import { useState } from "react";
import { InstagramButton } from "@/components/site/InstagramButton";
import { SLOTS } from "@/lib/fit-check/questions";
import { formatPhoneInput } from "@/lib/phone";
import { readUtm } from "@/lib/utm/client";
import { trackLead } from "@/components/site/MetaPixel";

/**
 * 간단 상담 신청 (기본). 이름·휴대폰·상담 가능 시간(복수)·개인정보 동의만 받는다.
 * 설문형(성향 결과 유형)은 일반 설정 → 상담 신청 → "설문형 상담 신청 켜기" 로 되돌릴 수 있다 (FitCheck.tsx).
 * 완료 시 메타 픽셀 Lead 이벤트를 보낸다(픽셀 ID 가 설정된 경우에만 실제 전송).
 */
const FIELD = "w-full border-0 border-b border-[rgba(33,30,25,.28)] bg-transparent px-0 py-[12px] text-[16px] text-ink outline-none rounded-none focus:border-brown";

export function LeadForm({ title, note }: { title: string; note: string }) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [slots, setSlots] = useState<string[]>([]);
  const [agreed, setAgreed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const phoneOk = /^01[016789]-\d{3,4}-\d{4}$/.test(phone);
  const canSubmit = name.trim() !== "" && phoneOk && agreed;
  const toggle = (t: string) => setSlots((cur) => (cur.includes(t) ? cur.filter((x) => x !== t) : [...cur, t]));

  const submit = async () => {
    if (!canSubmit || submitting) return;
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch("/api/inquiries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), phone, slot: SLOTS.filter((s) => slots.includes(s)).join(", "), consent: true, utm: readUtm() }),
      });
      const json = (await res.json().catch(() => null)) as { ok?: boolean; message?: string } | null;
      if (!res.ok || !json?.ok) throw new Error(json?.message ?? "신청을 저장하지 못했습니다. 잠시 후 다시 시도해 주세요.");
      trackLead();
      setDone(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "신청을 저장하지 못했습니다. 잠시 후 다시 시도해 주세요.");
    } finally {
      setSubmitting(false);
    }
  };

  if (done) {
    return (
      <div className="w-full max-w-[640px] mx-auto py-[40px]">
        <div className="text-[11px] tracking-[.34em] text-brown mb-[36px]">THANK YOU</div>
        <h2 className="font-medium text-[clamp(30px,3.6vw,48px)] leading-[1.36] mb-[28px] text-pretty">신청이 접수되었습니다</h2>
        <p className="mb-[52px] text-[16px] leading-[1.9] text-[rgba(33,30,25,.66)] max-w-[560px] text-pretty">영업일 기준 2일 이내에 가입 상담 담당자가 연락드립니다. 그 사이 궁금한 점이 있으시면 언제든 문의해 주세요.</p>
        <div className="flex gap-[12px] flex-wrap">
          <Link href="/" className="inline-flex items-center px-[34px] py-[16px] bg-brown text-cream text-[13.5px] hover:text-cream">홈으로 돌아가기</Link>
          <InstagramButton shape="square" />
          <a href="mailto:support@theraum.co.kr" className="inline-flex items-center px-[34px] py-[16px] border border-[rgba(33,30,25,.3)] text-[13.5px] hover:border-brown hover:text-brown">support@theraum.co.kr</a>
        </div>
      </div>
    );
  }

  return (
    <form
      className="w-full max-w-[640px] mx-auto"
      onSubmit={(e) => { e.preventDefault(); void submit(); }}
    >
      <div className="text-[11px] tracking-[.34em] text-[rgba(33,30,25,.5)] mb-[24px]">RSC CONSULTATION</div>
      <h1 className="font-medium text-[clamp(28px,3.6vw,44px)] leading-[1.32] mb-[14px] text-pretty">{title}</h1>
      <p className="mb-[44px] text-[15.5px] leading-[1.8] text-[rgba(33,30,25,.62)] text-pretty">{note}</p>

      <div className="grid gap-[32px]">
        <label className="block">
          <span className="block text-[13.5px] font-medium mb-[6px]">성함</span>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="홍길동" autoComplete="name" maxLength={50} required className={FIELD} />
        </label>
        <label className="block">
          <span className="block text-[13.5px] font-medium mb-[6px]">휴대폰 번호</span>
          <input
            value={phone}
            onChange={(e) => setPhone(formatPhoneInput(e.target.value))}
            placeholder="010-0000-0000"
            inputMode="numeric"
            autoComplete="tel"
            required
            className={FIELD}
          />
          <span className="block mt-[8px] text-[12.5px] text-[rgba(33,30,25,.45)]">숫자만 입력하시면 자동으로 하이픈이 붙습니다.</span>
        </label>
        <div>
          <div className="text-[13.5px] font-medium mb-[14px]">상담 가능 시간 <span className="text-[rgba(33,30,25,.4)] font-medium">여러 개 선택 가능</span></div>
          <div className="flex flex-wrap gap-[10px]">
            {SLOTS.map((t) => {
              const on = slots.includes(t);
              return (
                <button key={t} type="button" aria-pressed={on} onClick={() => toggle(t)} className={`cursor-pointer px-[20px] py-[13px] text-[14px] border text-ink transition-all duration-200 ${on ? "bg-sandActive border-brown" : "bg-transparent border-[rgba(33,30,25,.22)]"}`}>
                  {t}
                </button>
              );
            })}
          </div>
        </div>
        <div className="border border-[rgba(33,30,25,.16)] bg-[rgba(255,255,255,.35)] p-[18px]">
          <label className="flex items-start gap-[14px] cursor-pointer">
            <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} className="w-[17px] h-[17px] mt-[3px] accent-brown cursor-pointer flex-none" />
            <span className="text-[14px] leading-[1.7] text-ink font-medium">개인정보 수집·이용 동의 <span className="text-brown">(필수)</span></span>
          </label>
          <dl className="mt-[12px] ml-[31px] grid gap-[4px] text-[13px] leading-[1.7] text-[rgba(33,30,25,.68)]">
            <div><dt className="inline font-medium text-ink">수집 항목: </dt><dd className="inline">이름, 휴대폰 번호, 상담 가능 시간, 광고를 통해 들어온 경우 광고 유입 정보</dd></div>
            <div><dt className="inline font-medium text-ink">이용 목적: </dt><dd className="inline">가입 상담 진행과 안내</dd></div>
            <div><dt className="inline font-medium text-ink">보관 기간: </dt><dd className="inline">접수일로부터 180일, 이후 자동 삭제</dd></div>
          </dl>
          <p className="mt-[10px] ml-[31px] text-[12.5px] leading-[1.7] text-[rgba(33,30,25,.55)]">
            동의하지 않으면 상담 신청이 어렵습니다. 자세한 내용은 <Link href="/privacy" target="_blank" className="underline text-brown">개인정보처리방침</Link>을 확인해 주세요.
          </p>
        </div>
      </div>

      {error && <p className="mt-[20px] text-[13px] text-error">{error}</p>}

      <button
        type="submit"
        disabled={!canSubmit || submitting}
        className={`mt-[36px] w-full border-0 px-[42px] py-[18px] text-[14.5px] tracking-[.06em] text-cream ${canSubmit ? "bg-brown cursor-pointer hover:bg-brownHover" : "bg-[rgba(33,30,25,.25)] cursor-not-allowed"} ${submitting ? "opacity-60" : ""}`}
      >
        {submitting ? "접수 중…" : "상담 신청하기 →"}
      </button>
      <p className="mt-[14px] text-center text-[12.5px] text-[rgba(33,30,25,.45)]">제출하신 정보는 상담 안내 목적으로만 사용됩니다.</p>
    </form>
  );
}
