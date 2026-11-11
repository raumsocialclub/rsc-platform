"use client";

import Link from "next/link";
import { useState } from "react";
import { Button, ButtonLink, CARD, FIELD_ERROR, FIELD_HELP, FIELD_LABEL, INPUT, TEXTAREA } from "@/components/ui/ds";
import { formatPhoneInput } from "@/lib/phone";
import { Txt } from "@/components/cms/Txt";
import { PARTNER_KIND_KO, PARTNER_KINDS, type PartnerKind } from "@/lib/partner/types";

/**
 * 제휴문의 양식 (/partner → POST /api/partner → partner_inquiries → 어드민 /admin/partners).
 * 문의 유형(브랜드·콘텐츠 / 기업·단체 / 공간·행사 / 기타) · 회사명 · 담당자 · 휴대폰(자동 하이픈) · 이메일 · 내용 · 개인정보 동의(필수).
 * 첨부 파일은 받지 않고 제휴 담당 이메일로 보내 달라는 안내만 둔다. 문구는 CMS(partner.page)에서 copy 로 넘어온다.
 */
export type PartnerFormCopy = {
  formTitle: string; formNote: string;
  kindLabel: string; kindBrand: string; kindCorporate: string; kindVenue: string; kindOther: string;
  companyLabel: string; companyPlaceholder: string; nameLabel: string; namePlaceholder: string; phoneLabel: string; phoneHelp: string; emailLabel: string; emailPlaceholder: string;
  messageLabel: string; messagePlaceholder: string; attachLabel: string; attachNote: string;
  consentTitle: string; consentAgree: string; consentCollect: string; consentPurpose: string; consentRetention: string; consentRefuse: string; consentMore: string;
  submitLabel: string; submittingLabel: string; submitNote: string; doneTitle: string; doneBody: string; doneHome: string;
};
export const DEFAULT_PARTNER_COPY: PartnerFormCopy = {
  formTitle: "제휴 · 협업 제안하기", formNote: "아래 내용을 남겨 주시면 제휴 담당이 검토 후 이메일 또는 전화로 연락드립니다.",
  kindLabel: "문의 유형", kindBrand: PARTNER_KIND_KO.brand, kindCorporate: PARTNER_KIND_KO.corporate, kindVenue: PARTNER_KIND_KO.venue, kindOther: PARTNER_KIND_KO.other,
  companyLabel: "회사 · 브랜드명", companyPlaceholder: "예: 주식회사 라움", nameLabel: "담당자명", namePlaceholder: "이름을 입력해 주세요.", phoneLabel: "휴대전화", phoneHelp: "숫자만 입력하면 하이픈이 자동으로 붙습니다.", emailLabel: "이메일", emailPlaceholder: "name@company.com",
  messageLabel: "제안 내용", messagePlaceholder: "회사 · 브랜드 소개, 제안하는 협업 내용과 기대 효과, 희망 시기 · 규모를 적어 주세요.", attachLabel: "파일 첨부", attachNote: "첨부 파일은 제휴 담당 이메일({email})로 보내 주시기 바랍니다.",
  consentTitle: "개인정보 수집 및 이용 안내", consentAgree: "개인정보 수집 및 이용 안내에 동의합니다", consentCollect: "회사 · 브랜드명, 담당자명, 휴대전화번호, 이메일, 제안 내용(제안서에 적힌 정보 포함)", consentPurpose: "제휴 · 협업 제안의 접수와 검토, 검토 결과 회신과 협의를 위한 연락", consentRetention: "접수일로부터 1년 보유 후 지체 없이 파기합니다. 동의를 철회하시면 그 즉시 파기하며, 제휴가 성사된 경우 계약 관련 정보는 관계 법령이 정한 기간 동안 보관합니다.", consentRefuse: "정보주체는 위 개인정보 수집 · 이용에 대한 동의를 거부할 권리가 있습니다. 다만 동의를 거부하시는 경우 제휴문의 접수가 제한됩니다.",
  consentMore: "그 밖의 사항은 {privacy}을 따릅니다.",
  submitLabel: "제휴문의 보내기", submittingLabel: "접수 중…", submitNote: "접수된 제안은 검토 목적으로만 쓰고 외부에 공개하지 않습니다.",
  doneTitle: "제휴문의가 접수되었습니다", doneBody: "남겨주신 연락처로 제휴 담당이 검토 후 연락드립니다. 첨부 자료가 있다면 제휴 담당 이메일로 보내 주세요.", doneHome: "홈으로 돌아가기",
};

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

export function PartnerForm({ copy, partnerEmail = "", initialKind }: { copy?: Partial<PartnerFormCopy>; partnerEmail?: string; initialKind?: PartnerKind }) {
  const C: PartnerFormCopy = { ...DEFAULT_PARTNER_COPY, ...Object.fromEntries(Object.entries(copy ?? {}).filter(([, v]) => !!v)) } as PartnerFormCopy;
  const kindLabel: Record<PartnerKind, string> = { brand: C.kindBrand, corporate: C.kindCorporate, venue: C.kindVenue, other: C.kindOther };
  const [kind, setKind] = useState<PartnerKind | "">(initialKind ?? "");
  const [company, setCompany] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [website, setWebsite] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const phoneOk = /^01[016789]-\d{3,4}-\d{4}$/.test(phone);
  const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  const canSubmit = kind !== "" && company.trim() !== "" && name.trim() !== "" && phoneOk && emailOk && message.trim().length >= 10 && agreed;

  const submit = async () => {
    if (!canSubmit || submitting) return;
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch("/api/partner", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ kind, company: company.trim(), name: name.trim(), phone, email: email.trim(), message: message.trim(), consent: true, website }) });
      const json = (await res.json().catch(() => null)) as { ok?: boolean; message?: string } | null;
      if (!res.ok || !json?.ok) throw new Error(json?.message ?? "접수하지 못했습니다. 잠시 후 다시 시도해 주세요.");
      setDone(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "접수하지 못했습니다.");
    } finally {
      setSubmitting(false);
    }
  };

  if (done) {
    return (
      <div className={`${CARD} p-[28px] md:p-[40px] text-center`} data-testid="partner-done" role="status">
        <div className="mx-auto mb-[16px] w-[48px] h-[48px] rounded-full bg-[rgba(var(--ds-primary-rgb),.1)] text-primary flex items-center justify-center">
          <svg aria-hidden width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>
        </div>
        <h3 className="t-title-3 text-label mb-[10px]">{C.doneTitle}</h3>
        <p className="t-body-2-reading text-labelAlt max-w-[480px] mx-auto text-pretty"><Txt v={C.doneBody} /></p>
        {partnerEmail && <a href={`mailto:${partnerEmail}`} className="inline-block mt-[10px] t-body-2 text-primary underline break-all">{partnerEmail}</a>}
        <div className="mt-[24px]"><ButtonLink href="/" variant="outlined" size="lg">{C.doneHome}</ButtonLink></div>
      </div>
    );
  }

  return (
    <form className={`${CARD} relative p-[24px] md:p-[32px]`} data-testid="partner-form" onSubmit={(e) => { e.preventDefault(); void submit(); }} noValidate>
      <h3 className="t-headline-1 text-label mb-[6px]">{C.formTitle}</h3>
      <p className="t-body-2-reading text-labelAlt mb-[24px] text-pretty"><Txt v={C.formNote} /></p>

      <fieldset className="mb-[20px] border-0 p-0 m-0 min-w-0">
        <legend className={FIELD_LABEL}>{C.kindLabel} <span className="text-negative">*</span></legend>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-[8px]">
          {PARTNER_KINDS.map((k) => (
            <label key={k} className={`flex items-center gap-[10px] min-h-[48px] px-[14px] rounded-ds border cursor-pointer transition-[border-color,background-color] duration-200 ${kind === k ? "border-primary bg-[rgba(var(--ds-primary-rgb),.06)]" : "border-lineNeutral bg-white hover:border-primary"}`}>
              <input type="radio" name="kind" value={k} checked={kind === k} onChange={() => setKind(k)} className="accent-[var(--ds-primary)] w-[16px] h-[16px]" />
              <span className="t-body-2 font-medium text-label">{kindLabel[k]}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-[16px] mb-[16px]">
        <div>
          <label htmlFor="pf-company" className={FIELD_LABEL}>{C.companyLabel} <span className="text-negative">*</span></label>
          <input id="pf-company" value={company} onChange={(e) => setCompany(e.target.value)} placeholder={C.companyPlaceholder} maxLength={80} autoComplete="organization" className={INPUT} />
        </div>
        <div>
          <label htmlFor="pf-name" className={FIELD_LABEL}>{C.nameLabel} <span className="text-negative">*</span></label>
          <input id="pf-name" value={name} onChange={(e) => setName(e.target.value)} placeholder={C.namePlaceholder} maxLength={50} autoComplete="name" className={INPUT} />
        </div>
        <div>
          <label htmlFor="pf-phone" className={FIELD_LABEL}>{C.phoneLabel} <span className="text-negative">*</span></label>
          <input id="pf-phone" value={phone} onChange={(e) => setPhone(formatPhoneInput(e.target.value))} placeholder="010-0000-0000" inputMode="numeric" autoComplete="tel" className={INPUT} />
          <span className={FIELD_HELP}>{C.phoneHelp}</span>
        </div>
        <div>
          <label htmlFor="pf-email" className={FIELD_LABEL}>{C.emailLabel} <span className="text-negative">*</span></label>
          <input id="pf-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder={C.emailPlaceholder} maxLength={120} autoComplete="email" className={INPUT} />
        </div>
      </div>

      <div className="mb-[16px]">
        <label htmlFor="pf-message" className={FIELD_LABEL}>{C.messageLabel} <span className="text-negative">*</span></label>
        <textarea id="pf-message" value={message} onChange={(e) => setMessage(e.target.value)} placeholder={C.messagePlaceholder} maxLength={3000} rows={7} className={TEXTAREA} />
        <span className={`${FIELD_HELP} text-right`}>{message.trim().length.toLocaleString()} / 3,000</span>
      </div>

      <div className="mb-[20px] flex flex-col gap-[4px] md:flex-row md:items-baseline md:gap-[12px]">
        <span className={`${FIELD_LABEL} mb-0 flex-none`}>{C.attachLabel}</span>
        <span className="t-caption-1 text-labelAlt">{C.attachNote.split("{email}").map((p, i, arr) => <span key={i}>{p}{i < arr.length - 1 && (partnerEmail ? <a href={`mailto:${partnerEmail}`} className="text-primary underline break-all">{partnerEmail}</a> : "제휴 담당 이메일")}</span>)}</span>
      </div>

      {/* 봇 함정: 사람은 보지도 채우지도 않는 칸 */}
      <div aria-hidden className="absolute -left-[9999px] w-[1px] h-[1px] overflow-hidden"><label>website<input tabIndex={-1} autoComplete="off" value={website} onChange={(e) => setWebsite(e.target.value)} /></label></div>

      <div className="rounded-ds bg-sand p-[16px] md:p-[20px] mb-[20px]" data-testid="partner-consent">
        <div className="t-body-2 font-semibold text-label mb-[10px]">{C.consentTitle}</div>
        <dl className="t-caption-1 text-labelAlt flex flex-col gap-[8px]">
          <div><dt className="font-semibold text-labelNeutral">수집 · 이용 목적</dt><dd className="m-0 mt-[2px]">{C.consentPurpose}</dd></div>
          <div><dt className="font-semibold text-labelNeutral">수집 항목</dt><dd className="m-0 mt-[2px]">{C.consentCollect}</dd></div>
          <div><dt className="font-semibold text-labelNeutral">보유 · 이용 기간</dt><dd className="m-0 mt-[2px]"><Txt v={C.consentRetention} /></dd></div>
          <div><dt className="font-semibold text-labelNeutral">동의 거부 관련</dt><dd className="m-0 mt-[2px]"><Txt v={C.consentRefuse} /></dd></div>
        </dl>
        <p className="mt-[8px] t-caption-1 text-labelAlt"><ConsentMore text={C.consentMore} /></p>
        <label className="mt-[14px] pt-[14px] border-t border-lineAlt flex items-start gap-[12px] cursor-pointer">
          <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} className="mt-[2px] w-[18px] h-[18px] accent-[var(--ds-primary)]" />
          <span className="t-body-2 font-semibold text-label">{C.consentAgree} <span className="text-negative">(필수)</span></span>
        </label>
      </div>

      {error && <p className={`${FIELD_ERROR} mb-[12px]`} role="alert">{error}</p>}
      <Button type="submit" size="lg" disabled={!canSubmit || submitting} className="w-full md:w-auto md:min-w-[240px]">{submitting ? C.submittingLabel : C.submitLabel}</Button>
      <p className="mt-[10px] t-caption-1 text-labelAlt">{C.submitNote}</p>
    </form>
  );
}
