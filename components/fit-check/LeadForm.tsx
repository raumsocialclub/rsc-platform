"use client";

import Link from "next/link";
import { useState } from "react";
import { InstagramButton } from "@/components/site/InstagramButton";
import { Button, ButtonLink, CARD, CHIP, CHIP_OFF, CHIP_ON, FIELD_HELP, FIELD_LABEL, INPUT } from "@/components/ui/ds";
import { formatPhoneInput } from "@/lib/phone";
import { readUtm } from "@/lib/utm/client";
import { trackLead } from "@/components/site/MetaPixel";
import { Txt } from "@/components/cms/Txt";

/**
 * 간단 상담 신청 (기본). 관심 방식(소셜클럽 · 1:1 매칭 · 상담 후 결정) 칩 + 이름·휴대폰·개인정보 동의 (Wanted DS 텍스트 필드 · 체크박스 · 큰 버튼).
 * 관심 방식은 /fit-check?track= 으로 미리 선택되고 inquiries.answers.route 에 라벨로 저장된다 (어드민 상담 상세 「관심 방식」).
 * 「상담 가능 시간」 선택은 인터뷰 기간 동안 잠시 뺐다 (2026-10). API(/api/inquiries)·관리자 화면·DB 는 slot 을 그대로 받는다.
 * 완료 시 메타 픽셀 Lead 이벤트를 보낸다(픽셀 ID 가 설정된 경우에만 실제 전송).
 */
export type LeadTrack = "social" | "matching" | "undecided";
export const TRACK_LABEL: Record<LeadTrack, string> = { social: "소셜클럽", matching: "1:1 매칭", undecided: "상담 후 결정" };

export function LeadForm({ title, note, track: initialTrack = "undecided" }: { title: string; note: string; /** 어느 트랙에서 들어왔는지 (/fit-check?track=social|matching). 폼에서 바꿀 수 있고 inquiries.answers.route 로 저장된다 */ track?: LeadTrack }) {
  const [track, setTrack] = useState<LeadTrack>(initialTrack);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const phoneOk = /^01[016789]-\d{3,4}-\d{4}$/.test(phone);
  const canSubmit = name.trim() !== "" && phoneOk && agreed;

  const submit = async () => {
    if (!canSubmit || submitting) return;
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch("/api/inquiries", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: name.trim(), phone, consent: true, route: TRACK_LABEL[track], utm: readUtm() }) });
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
      <div className="w-full max-w-[560px] mx-auto text-center py-[24px] anim-up">
        <div className="w-[56px] h-[56px] rounded-full bg-[rgba(0,191,64,.12)] text-positiveFg flex items-center justify-center mx-auto mb-[20px]">
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12l5 5L20 7" /></svg>
        </div>
        <h2 className="t-title-2 text-label mb-[12px]">신청이 접수되었습니다</h2>
        <p className="t-body-1-reading text-labelAlt mb-[28px] text-pretty"><Txt v="담당자가 남겨주신 연락처로 순차적으로 연락드립니다. 신청 취소나 문의는 전화(02-6925-4786) 또는 이메일로 알려 주세요." /></p>
        <div className="flex gap-[10px] justify-center flex-wrap">
          <ButtonLink href="/" size="lg">홈으로 돌아가기</ButtonLink>
          <InstagramButton />
        </div>
      </div>
    );
  }

  return (
    <form className="w-full max-w-[520px] mx-auto anim-up" onSubmit={(e) => { e.preventDefault(); void submit(); }}>
      <h1 className="t-title-2 md:t-title-1 text-label mb-[10px] text-pretty">{title}</h1>
      <p className="t-body-1-reading text-labelAlt mb-[32px] text-pretty"><Txt v={note} /></p>

      <div className="grid gap-[20px]">
        <fieldset className="border-0 p-0 m-0 min-w-0">
          <legend className={FIELD_LABEL}>관심 있는 방식</legend>
          <div className="grid grid-cols-3 gap-[8px]">
            {(Object.keys(TRACK_LABEL) as LeadTrack[]).map((k) => (
              <button key={k} type="button" aria-pressed={track === k} onClick={() => setTrack(k)} className={`${CHIP} ${track === k ? CHIP_ON : CHIP_OFF} px-[8px]`}>{TRACK_LABEL[k]}</button>
            ))}
          </div>
          <span className={FIELD_HELP}>{track === "social" ? "함께 경험하며 자연스럽게 가까워지는 커뮤니티." : track === "matching" ? "전담 디렉터가 검증된 회원 중 한 분을 직접 소개합니다." : "어느 쪽이 맞을지 모르겠다면 상담에서 함께 정해 드립니다."}</span>
        </fieldset>
        <label className="block">
          <span className={FIELD_LABEL}>이름 <span className="text-negative">*</span></span>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="이름을 입력해 주세요." autoComplete="name" maxLength={50} required className={INPUT} />
        </label>
        <label className="block">
          <span className={FIELD_LABEL}>휴대폰 번호 <span className="text-negative">*</span></span>
          <input value={phone} onChange={(e) => setPhone(formatPhoneInput(e.target.value))} placeholder="010-0000-0000" inputMode="numeric" autoComplete="tel" required className={INPUT} />
          <span className={FIELD_HELP}>숫자만 입력하면 하이픈이 자동으로 붙습니다.</span>
        </label>
        <div className={`${CARD} p-[16px] md:p-[18px]`}>
          <label className="flex items-start gap-[12px] cursor-pointer">
            <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} className="w-[20px] h-[20px] mt-[1px] accent-primary cursor-pointer flex-none rounded" />
            <span className="t-body-2 font-semibold text-label">개인정보 수집·이용 동의 <span className="text-negative">(필수)</span></span>
          </label>
          <dl className="mt-[10px] ml-[32px] grid gap-[3px] t-label-1-reading text-labelAlt">
            <div><dt className="inline font-semibold text-labelNeutral">수집 항목: </dt><dd className="inline">이름, 휴대폰 번호(필수) · 광고 링크로 들어온 경우 광고 유입 정보(utm 값)</dd></div>
            <div><dt className="inline font-semibold text-labelNeutral">이용 목적: </dt><dd className="inline">신청하신 가입 상담의 진행과 일정 조율, 문의 응대</dd></div>
            <div><dt className="inline font-semibold text-labelNeutral">보관 기간: </dt><dd className="inline">접수일로부터 최대 180일, 이후 자동 삭제 (요청 시 그 전에도 삭제)</dd></div>
            <div><dt className="inline font-semibold text-labelNeutral">거부 시: </dt><dd className="inline">필수 항목 동의를 거부하면 상담 신청이 접수되지 않습니다.</dd></div>
          </dl>
          <p className="mt-[8px] ml-[32px] t-caption-1 text-labelAlt">
            자세한 내용은 <Link href="/privacy" target="_blank" className="underline text-primary">개인정보처리방침</Link>에서 확인하실 수 있습니다. 사이트 이용 조건은 <Link href="/terms" target="_blank" className="underline text-primary">이용약관</Link>을 참고해 주세요.
          </p>
        </div>
      </div>

      {error && <p role="alert" className="mt-[16px] t-label-1 text-negativeFg">{error}</p>}

      <Button type="submit" disabled={!canSubmit || submitting} size="lg" className="mt-[28px] w-full">{submitting ? "접수 중…" : "상담 신청하기"}</Button>
      <p className="mt-[12px] text-center t-caption-1 text-labelAlt text-pretty"><Txt v="신청은 회원 가입이 아니며, 담당자가 연락드린 뒤 상담이 진행됩니다." /></p>
    </form>
  );
}
