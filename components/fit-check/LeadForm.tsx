"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { InstagramButton } from "@/components/site/InstagramButton";
import { Button, ButtonLink, CARD, CHIP, CHIP_OFF, CHIP_ON, FIELD_HELP, FIELD_LABEL, INPUT } from "@/components/ui/ds";
import { DISTRICT_MAX, EDUCATION_OPTIONS, JOB_OPTIONS, REGION_OPTIONS } from "@/lib/inquiries/profile";
import { formatPhoneInput, normalizePhone } from "@/lib/phone";
import { readUtm } from "@/lib/utm/client";
import { trackLead } from "@/components/site/MetaPixel";
import { Txt } from "@/components/cms/Txt";
import { entryPathFromReferrer } from "@/lib/inquiries/track";

/**
 * 간단 상담 신청 (기본). 관심 방식(소셜클럽 · 1:1 매칭 · 상담 후 결정) 칩 + 이름·휴대폰·직업·학력·거주지역(시/도 필수 + 시/군/구 선택)·개인정보 동의 (Wanted DS 텍스트 필드 · 셀렉트 · 체크박스 · 큰 버튼).
 * 직업·학력·거주지는 2026-11-12 추가 — 선택지는 lib/inquiries/profile.ts, inquiries.answers 의 job · education · region · district 로 저장돼 어드민 상세·CSV 에 그대로 나온다.
 * 관심 방식은 /fit-check?track= 으로 미리 선택되고 inquiries.answers 에 route(라벨)·track(키)로 저장된다. 함께 entryTrack(어느 상담 버튼으로 들어왔는지)·entryPath(직전 페이지)를 보내
 * 어드민 「상담 신청」 목록·상세·CSV 에서 「관심 방식」「들어온 경로」로 보인다 (lib/inquiries/track.ts).
 * 「상담 가능 시간」 선택은 인터뷰 기간 동안 잠시 뺐다 (2026-10). API(/api/inquiries)·관리자 화면·DB 는 slot 을 그대로 받는다.
 * 완료 시 메타 픽셀 Lead 이벤트를 보낸다(픽셀 ID 가 설정된 경우에만 실제 전송).
 * 화면 문구는 CMS(apply.form)에서 copy 로 넘어온다. 저장되는 route 값(TRACK_LABEL)은 칩 이름을 바꿔도 고정이라 어드민 필터가 흔들리지 않는다.
 */
export type LeadTrack = "social" | "matching" | "undecided";
export const TRACK_LABEL: Record<LeadTrack, string> = { social: "소셜클럽", matching: "1:1 매칭", undecided: "상담 후 결정" };

export type LeadCopy = {
  titleDefault: string; titleSocial: string; titleMatching: string; note: string;
  trackLegend: string; chipSocial: string; chipMatching: string; chipUndecided: string; helpSocial: string; helpMatching: string; helpUndecided: string;
  nameLabel: string; namePlaceholder: string; phoneLabel: string; phoneHelp: string;
  jobLabel: string; eduLabel: string; regionLabel: string; districtLabel: string; districtPlaceholder: string; selectPlaceholder: string;
  consentTitle: string; consentCollect: string; consentPurpose: string; consentRetention: string; consentRefuse: string; consentMore: string;
  submitLabel: string; submittingLabel: string; submitNote: string; doneTitle: string; doneBody: string; doneHome: string; closeLabel: string;
};
/** CMS(apply.form) 기본값과 같은 문구 — CMS 를 읽지 못해도 화면이 비지 않도록 */
export const DEFAULT_LEAD_COPY: LeadCopy = {
  titleDefault: "RSC 상담 신청", titleSocial: "소셜클럽 상담 신청", titleMatching: "1:1 매칭 상담 신청", note: "남겨주신 연락처로 담당자가 직접 연락드립니다.",
  trackLegend: "관심 있는 방식", chipSocial: "소셜클럽", chipMatching: "1:1 매칭", chipUndecided: "상담 후 결정",
  helpSocial: "함께 경험하며 자연스럽게 가까워지는 커뮤니티.", helpMatching: "전담 컨시어지가 검증된 회원 중 한 분을 직접 소개합니다.", helpUndecided: "어느 쪽이 맞을지 모르겠다면 상담에서 함께 정해 드립니다.",
  nameLabel: "이름", namePlaceholder: "이름을 입력해 주세요.", phoneLabel: "휴대폰 번호", phoneHelp: "숫자만 입력하면 하이픈이 자동으로 붙습니다.",
  jobLabel: "직업", eduLabel: "학력", regionLabel: "거주지역 · 시/도", districtLabel: "거주지역 · 시/군/구", districtPlaceholder: "예: 송파구", selectPlaceholder: "선택해 주세요",
  consentTitle: "개인정보 수집·이용 동의", consentCollect: "이름, 휴대폰 번호, 직업, 학력, 거주지역(시/도 필수 · 시/군/구 선택) · 광고 링크로 들어온 경우 광고 유입 정보(utm 값)", consentPurpose: "신청하신 가입 상담의 진행과 일정 조율, 문의 응대", consentRetention: "접수일로부터 최대 180일, 이후 자동 삭제 (요청 시 그 전에도 삭제)", consentRefuse: "필수 항목 동의를 거부하면 상담 신청이 접수되지 않습니다.",
  consentMore: "자세한 내용은 {privacy}에서 확인하실 수 있습니다. 사이트 이용 조건은 {terms}을 참고해 주세요.",
  submitLabel: "상담 신청하기", submittingLabel: "접수 중…", submitNote: "신청은 회원 가입이 아니며, 담당자가 연락드린 뒤 상담이 진행됩니다.",
  doneTitle: "신청이 접수되었습니다", doneBody: "담당자가 남겨주신 연락처로 순차적으로 연락드립니다. 신청 취소나 문의는 전화(02-6925-4786) 또는 이메일로 알려 주세요.", doneHome: "홈으로 돌아가기", closeLabel: "닫기 ✕",
};

/** "{privacy}" "{terms}" 자리를 링크로 바꾼다 */
function ConsentMore({ text }: { text: string }) {
  const parts = text.split(/(\{privacy\}|\{terms\})/);
  return (
    <>
      {parts.map((p, i) =>
        p === "{privacy}" ? <Link key={i} href="/privacy" target="_blank" className="underline text-primary">개인정보처리방침</Link>
        : p === "{terms}" ? <Link key={i} href="/terms" target="_blank" className="underline text-primary">이용약관</Link>
        : <span key={i}>{p}</span>)}
    </>
  );
}

export function LeadForm({ title, note, track: initialTrack = "undecided", copy }: { title: string; note: string; /** 어느 트랙에서 들어왔는지 (/fit-check?track=social|matching). 폼에서 바꿀 수 있고 inquiries.answers.route 로 저장된다 */ track?: LeadTrack; copy?: Partial<LeadCopy> }) {
  const C: LeadCopy = { ...DEFAULT_LEAD_COPY, ...Object.fromEntries(Object.entries(copy ?? {}).filter(([, v]) => !!v)) } as LeadCopy;
  const chipLabel: Record<LeadTrack, string> = { social: C.chipSocial, matching: C.chipMatching, undecided: C.chipUndecided };
  const [track, setTrack] = useState<LeadTrack>(initialTrack);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [job, setJob] = useState("");
  const [education, setEducation] = useState("");
  const [region, setRegion] = useState("");
  const [district, setDistrict] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const phoneInput = useRef<HTMLInputElement>(null);
  /* 브라우저 자동완성이 React 가 켜지기 전에 값을 채우면 onChange 가 오지 않는다 — 켜진 직후 칸의 값을 한 번 읽어 서식을 맞춘다 */
  useEffect(() => {
    const v = phoneInput.current?.value;
    if (v && v !== phone) setPhone(formatPhoneInput(v));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const phoneOk = normalizePhone(phone) !== null;
  const canSubmit = name.trim() !== "" && phoneOk && job !== "" && education !== "" && region !== "" && agreed;

  const submit = async () => {
    if (!canSubmit || submitting) return;
    setError(null);
    setSubmitting(true);
    try {
      const entryPath = entryPathFromReferrer(document.referrer, window.location.origin);
      const res = await fetch("/api/inquiries", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: name.trim(), phone: normalizePhone(phone) ?? phone, job, education, region, district: district.trim(), consent: true, route: TRACK_LABEL[track], track, entryTrack: initialTrack === "undecided" ? undefined : initialTrack, entryPath, utm: readUtm() }) });
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
        <h2 className="t-title-2 text-label mb-[12px]">{C.doneTitle}</h2>
        <p className="t-body-1-reading text-labelAlt mb-[28px] text-pretty"><Txt v={C.doneBody} /></p>
        <div className="flex gap-[10px] justify-center flex-wrap">
          <ButtonLink href="/" size="lg">{C.doneHome}</ButtonLink>
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
          <legend className={FIELD_LABEL}>{C.trackLegend}</legend>
          <div className="grid grid-cols-3 gap-[8px]">
            {(Object.keys(TRACK_LABEL) as LeadTrack[]).map((k) => (
              <button key={k} type="button" aria-pressed={track === k} onClick={() => setTrack(k)} className={`${CHIP} ${track === k ? CHIP_ON : CHIP_OFF} px-[8px]`}>{chipLabel[k]}</button>
            ))}
          </div>
          <span className={FIELD_HELP}>{track === "social" ? C.helpSocial : track === "matching" ? C.helpMatching : C.helpUndecided}</span>
        </fieldset>
        <label className="block">
          <span className={FIELD_LABEL}>{C.nameLabel} <span className="text-negative">*</span></span>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder={C.namePlaceholder} autoComplete="name" maxLength={50} required className={INPUT} />
        </label>
        <label className="block">
          <span className={FIELD_LABEL}>{C.phoneLabel} <span className="text-negative">*</span></span>
          <input ref={phoneInput} value={phone} onChange={(e) => setPhone(formatPhoneInput(e.target.value))} onBlur={(e) => setPhone(formatPhoneInput(e.target.value))} placeholder="010-0000-0000" inputMode="numeric" autoComplete="tel" required className={INPUT} />
          <span className={FIELD_HELP}>{C.phoneHelp}</span>
        </label>
        <label className="block">
          <span className={FIELD_LABEL}>{C.jobLabel} <span className="text-negative">*</span></span>
          <select value={job} onChange={(e) => setJob(e.target.value)} required className={`${INPUT} ${job ? "" : "text-labelAssist"}`} data-testid="lead-job">
            <option value="">{C.selectPlaceholder}</option>
            {JOB_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
          </select>
        </label>
        <label className="block">
          <span className={FIELD_LABEL}>{C.eduLabel} <span className="text-negative">*</span></span>
          <select value={education} onChange={(e) => setEducation(e.target.value)} required className={`${INPUT} ${education ? "" : "text-labelAssist"}`} data-testid="lead-education">
            <option value="">{C.selectPlaceholder}</option>
            {EDUCATION_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
          </select>
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-[12px]">
          <label className="block">
            <span className={FIELD_LABEL}>{C.regionLabel} <span className="text-negative">*</span></span>
            <select value={region} onChange={(e) => setRegion(e.target.value)} required className={`${INPUT} ${region ? "" : "text-labelAssist"}`} data-testid="lead-region">
              <option value="">{C.selectPlaceholder}</option>
              {REGION_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
            </select>
          </label>
          <label className="block">
            <span className={FIELD_LABEL}>{C.districtLabel}</span>
            <input value={district} onChange={(e) => setDistrict(e.target.value)} placeholder={C.districtPlaceholder} maxLength={DISTRICT_MAX} autoComplete="address-level2" className={INPUT} data-testid="lead-district" />
          </label>
        </div>
        <div className={`${CARD} p-[16px] md:p-[18px]`}>
          <label className="flex items-start gap-[12px] cursor-pointer">
            <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} className="w-[20px] h-[20px] mt-[1px] accent-primary cursor-pointer flex-none rounded" />
            <span className="t-body-2 font-semibold text-label">{C.consentTitle} <span className="text-negative">(필수)</span></span>
          </label>
          <dl className="mt-[10px] ml-[32px] grid gap-[3px] t-label-1-reading text-labelAlt">
            <div><dt className="inline font-semibold text-labelNeutral">수집 항목: </dt><dd className="inline">{C.consentCollect}</dd></div>
            <div><dt className="inline font-semibold text-labelNeutral">이용 목적: </dt><dd className="inline">{C.consentPurpose}</dd></div>
            <div><dt className="inline font-semibold text-labelNeutral">보관 기간: </dt><dd className="inline">{C.consentRetention}</dd></div>
            <div><dt className="inline font-semibold text-labelNeutral">거부 시: </dt><dd className="inline">{C.consentRefuse}</dd></div>
          </dl>
          <p className="mt-[8px] ml-[32px] t-caption-1 text-labelAlt"><ConsentMore text={C.consentMore} /></p>
        </div>
      </div>

      {error && <p role="alert" className="mt-[16px] t-label-1 text-negativeFg">{error}</p>}

      <Button type="submit" disabled={!canSubmit || submitting} size="lg" className="mt-[28px] w-full">{submitting ? C.submittingLabel : C.submitLabel}</Button>
      <p className="mt-[12px] text-center t-caption-1 text-labelAlt text-pretty"><Txt v={C.submitNote} /></p>
    </form>
  );
}
