"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Button, ButtonLink, CARD, FIELD_ERROR, FIELD_HELP, FIELD_LABEL, INPUT, TEXTAREA, btn } from "@/components/ui/ds";
import { formatPhoneInput, normalizePhone } from "@/lib/phone";
import { Txt } from "@/components/cms/Txt";
import { PARTNER_KIND_KO, PARTNER_KINDS, PARTNER_MESSAGE_MAX, PARTNER_MESSAGE_MIN, type PartnerKind } from "@/lib/partner/types";
import { PARTNER_FILES_BUCKET, PARTNER_FILE_ACCEPT, PARTNER_FILE_MAX, fileProblem, type PartnerFile } from "@/lib/partner/files";
import { createClient } from "@/lib/supabase/client";

/**
 * 제휴문의 양식 (/partner → POST /api/partner → partner_inquiries → 어드민 /admin/partners).
 * 문의 유형(브랜드·콘텐츠 / 기업·단체 / 공간·행사 / 기타) · 회사명 · 담당자 · 휴대폰(자동 하이픈) · 이메일 · 내용 · 개인정보 동의(필수).
 * 첨부(선택, 최대 3개 · 파일당 10MB · pdf/hwp/word/excel/ppt/이미지): 보내기를 누르면 /api/partner/upload-url 로 서명 URL 을 받아 브라우저가 partner-files 버킷에 직접 올리고,
 * 올라간 경로를 제출 본문의 files 로 보낸다. 문구는 CMS(partner.page)에서 copy 로 넘어온다.
 */
export type PartnerFormCopy = {
  formTitle: string; formNote: string;
  kindLabel: string; kindBrand: string; kindCorporate: string; kindVenue: string; kindOther: string;
  companyLabel: string; companyPlaceholder: string; nameLabel: string; namePlaceholder: string; phoneLabel: string; phoneHelp: string; emailLabel: string; emailPlaceholder: string;
  messageLabel: string; messagePlaceholder: string; messageHelp: string; readyHint: string; attachLabel: string; attachHelp: string; attachButton: string; attachNote: string;
  consentTitle: string; consentAgree: string; consentCollect: string; consentPurpose: string; consentRetention: string; consentRefuse: string; consentMore: string;
  submitLabel: string; submittingLabel: string; submitNote: string; doneTitle: string; doneBody: string; doneHome: string;
};
export const DEFAULT_PARTNER_COPY: PartnerFormCopy = {
  formTitle: "제휴 · 협업 제안하기", formNote: "아래 내용을 남겨 주시면 제휴 담당이 검토 후 이메일 또는 전화로 연락드립니다.",
  kindLabel: "문의 유형", kindBrand: PARTNER_KIND_KO.brand, kindCorporate: PARTNER_KIND_KO.corporate, kindVenue: PARTNER_KIND_KO.venue, kindOther: PARTNER_KIND_KO.other,
  companyLabel: "회사 · 브랜드명", companyPlaceholder: "예: 주식회사 라움", nameLabel: "담당자명", namePlaceholder: "이름을 입력해 주세요.", phoneLabel: "휴대전화", phoneHelp: "숫자만 입력하면 하이픈이 자동으로 붙습니다.", emailLabel: "이메일", emailPlaceholder: "name@company.com",
  messageLabel: "제안 내용", messagePlaceholder: "회사 · 브랜드 소개, 제안하는 협업 내용과 기대 효과, 희망 시기 · 규모를 적어 주세요.", messageHelp: "{min}자 이상 {max}자까지 적을 수 있습니다.", readyHint: "보내려면 아직 필요한 것:", attachLabel: "파일 첨부 (선택)", attachHelp: "PDF · HWP · Word · Excel · PowerPoint · JPG · PNG, 파일당 10MB, 최대 3개", attachButton: "파일 선택", attachNote: "용량이 큰 자료는 제휴 담당 이메일({email})로 보내 주셔도 됩니다.",
  consentTitle: "개인정보 수집 및 이용 안내", consentAgree: "개인정보 수집 및 이용 안내에 동의합니다", consentCollect: "회사 · 브랜드명, 담당자명, 휴대전화번호, 이메일, 제안 내용(제안서에 적힌 정보 포함)", consentPurpose: "제휴 · 협업 제안의 접수와 검토, 검토 결과 회신과 협의를 위한 연락", consentRetention: "접수일로부터 1년 보유 후 지체 없이 파기합니다. 동의를 철회하시면 그 즉시 파기하며, 제휴가 성사된 경우 계약 관련 정보는 관계 법령이 정한 기간 동안 보관합니다.", consentRefuse: "정보주체는 위 개인정보 수집 · 이용에 대한 동의를 거부할 권리가 있습니다. 다만 동의를 거부하시는 경우 제휴문의 접수가 제한됩니다.",
  consentMore: "그 밖의 사항은 {privacy}을 따릅니다.",
  submitLabel: "제휴문의 보내기", submittingLabel: "접수 중…", submitNote: "접수된 제안은 검토 목적으로만 쓰고 외부에 공개하지 않습니다.",
  doneTitle: "제휴문의가 접수되었습니다", doneBody: "남겨주신 연락처로 제휴 담당이 검토 후 연락드립니다.", doneHome: "홈으로 돌아가기",
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
  const [files, setFiles] = useState<File[]>([]);
  const [fileError, setFileError] = useState<string | null>(null);
  const [progress, setProgress] = useState<string | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const phoneInput = useRef<HTMLInputElement>(null);
  /* 브라우저 자동완성이 React 가 켜지기 전에 값을 채우면 onChange 가 오지 않는다 — 켜진 직후 칸의 값을 한 번 읽어 서식을 맞춘다 */
  useEffect(() => {
    const v = phoneInput.current?.value;
    if (v && v !== phone) setPhone(formatPhoneInput(v));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const addFiles = (picked: FileList | null) => {
    if (!picked) return;
    setFileError(null);
    const next = [...files];
    for (const f of Array.from(picked)) {
      if (next.length >= PARTNER_FILE_MAX) { setFileError(`첨부 파일은 ${PARTNER_FILE_MAX}개까지 올릴 수 있습니다.`); break; }
      const problem = fileProblem(f.name, f.size);
      if (problem) { setFileError(`${f.name}: ${problem}`); continue; }
      if (!next.some((x) => x.name === f.name && x.size === f.size)) next.push(f);
    }
    setFiles(next);
    if (fileInput.current) fileInput.current.value = "";
  };
  const fmtSize = (n: number) => (n >= 1024 * 1024 ? `${(n / 1024 / 1024).toFixed(1)}MB` : `${Math.max(1, Math.round(n / 1024))}KB`);

  /** 서명 URL 을 받아 버킷에 직접 올린다. 실패하면 throw */
  const uploadAll = async (): Promise<PartnerFile[]> => {
    if (files.length === 0) return [];
    const supabase = createClient();
    const out: PartnerFile[] = [];
    for (let i = 0; i < files.length; i++) {
      const f = files[i];
      setProgress(`파일 올리는 중 (${i + 1}/${files.length}) · ${f.name}`);
      const res = await fetch("/api/partner/upload-url", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: f.name, size: f.size }) });
      const j = (await res.json().catch(() => null)) as { ok?: boolean; path?: string; token?: string; message?: string } | null;
      if (!res.ok || !j?.ok || !j.path || !j.token) throw new Error(j?.message ?? "파일을 올리지 못했습니다.");
      const { error } = await supabase.storage.from(PARTNER_FILES_BUCKET).uploadToSignedUrl(j.path, j.token, f, { contentType: f.type || "application/octet-stream", upsert: false });
      if (error) throw new Error(`${f.name}: 파일을 올리지 못했습니다 (${error.message}). 잠시 후 다시 시도해 주세요.`);
      out.push({ path: j.path, name: f.name, size: f.size });
    }
    setProgress(null);
    return out;
  };
  const [agreed, setAgreed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const phoneOk = normalizePhone(phone) !== null;
  const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  const messageLen = message.trim().length;
  const missing: string[] = [
    ...(kind === "" ? [C.kindLabel] : []),
    ...(company.trim() === "" ? [C.companyLabel] : []),
    ...(name.trim() === "" ? [C.nameLabel] : []),
    ...(!phoneOk ? [C.phoneLabel] : []),
    ...(!emailOk ? [C.emailLabel] : []),
    ...(messageLen < PARTNER_MESSAGE_MIN ? [`${C.messageLabel} ${PARTNER_MESSAGE_MIN}자 이상${messageLen > 0 ? ` (지금 ${messageLen}자)` : ""}`] : []),
    ...(!agreed ? [C.consentAgree] : []),
  ];
  const canSubmit = missing.length === 0;

  const submit = async () => {
    if (!canSubmit || submitting) return;
    setError(null);
    setSubmitting(true);
    try {
      const uploaded = await uploadAll();
      const res = await fetch("/api/partner", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ kind, company: company.trim(), name: name.trim(), phone: normalizePhone(phone) ?? phone, email: email.trim(), message: message.trim(), consent: true, website, files: uploaded }) });
      const json = (await res.json().catch(() => null)) as { ok?: boolean; message?: string } | null;
      if (!res.ok || !json?.ok) throw new Error(json?.message ?? "접수하지 못했습니다. 잠시 후 다시 시도해 주세요.");
      setDone(true);
    } catch (e) {
      setProgress(null);
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
          <input ref={phoneInput} id="pf-phone" value={phone} onChange={(e) => setPhone(formatPhoneInput(e.target.value))} onBlur={(e) => setPhone(formatPhoneInput(e.target.value))} placeholder="010-0000-0000" inputMode="numeric" autoComplete="tel" className={INPUT} />
          <span className={FIELD_HELP}>{C.phoneHelp}</span>
        </div>
        <div>
          <label htmlFor="pf-email" className={FIELD_LABEL}>{C.emailLabel} <span className="text-negative">*</span></label>
          <input id="pf-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder={C.emailPlaceholder} maxLength={120} autoComplete="email" className={INPUT} />
        </div>
      </div>

      <div className="mb-[16px]">
        <label htmlFor="pf-message" className={FIELD_LABEL}>{C.messageLabel} <span className="text-negative">*</span></label>
        <textarea id="pf-message" value={message} onChange={(e) => setMessage(e.target.value)} placeholder={C.messagePlaceholder} maxLength={PARTNER_MESSAGE_MAX} rows={7} className={TEXTAREA} aria-describedby="pf-message-help" />
        <span id="pf-message-help" className={`${FIELD_HELP} flex justify-between gap-[12px]`}>
          <span>{C.messageHelp.replace("{min}", String(PARTNER_MESSAGE_MIN)).replace("{max}", PARTNER_MESSAGE_MAX.toLocaleString())}</span>
          <span className={`tabular-nums ${messageLen > 0 && messageLen < PARTNER_MESSAGE_MIN ? "text-negativeFg" : ""}`}>{messageLen.toLocaleString()} / {PARTNER_MESSAGE_MAX.toLocaleString()}</span>
        </span>
      </div>

      <div className="mb-[20px]" data-testid="partner-files">
        <div className={FIELD_LABEL}>{C.attachLabel}</div>
        <input ref={fileInput} type="file" multiple accept={PARTNER_FILE_ACCEPT} onChange={(e) => addFiles(e.target.files)} className="sr-only" id="pf-files" />
        <div className="flex flex-wrap items-center gap-[10px]">
          <label htmlFor="pf-files" className={btn("assistive", "md", files.length >= PARTNER_FILE_MAX ? "pointer-events-none opacity-50" : "")}>{C.attachButton}</label>
          <span className="t-caption-1 text-labelAlt">{C.attachHelp}</span>
        </div>
        {files.length > 0 && (
          <ul className="mt-[10px] flex flex-col gap-[6px] list-none m-0 p-0">
            {files.map((f, i) => (
              <li key={`${f.name}-${f.size}`} className="flex items-center gap-[10px] rounded-ds border border-lineAlt bg-white px-[12px] py-[8px] t-body-2 text-label">
                <svg aria-hidden width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="flex-none text-labelAlt"><path d="M21 12.5l-8.5 8.5a5.5 5.5 0 0 1-7.8-7.8l9-9a3.5 3.5 0 0 1 5 5l-9 9a1.5 1.5 0 0 1-2.1-2.1l8-8" /></svg>
                <span className="min-w-0 flex-1 truncate">{f.name}</span>
                <span className="flex-none t-caption-1 text-labelAlt tabular-nums">{fmtSize(f.size)}</span>
                <button type="button" onClick={() => setFiles(files.filter((_, j) => j !== i))} aria-label={`${f.name} 제거`} className="flex-none w-[24px] h-[24px] rounded-full bg-transparent border-0 cursor-pointer text-labelAlt hover:bg-fillAlt hover:text-label">✕</button>
              </li>
            ))}
          </ul>
        )}
        {fileError && <p className={FIELD_ERROR} role="alert">{fileError}</p>}
        <p className="mt-[8px] t-caption-1 text-labelAlt">{C.attachNote.split("{email}").map((p, i, arr) => <span key={i}>{p}{i < arr.length - 1 && (partnerEmail ? <a href={`mailto:${partnerEmail}`} className="text-primary underline break-all">{partnerEmail}</a> : "제휴 담당 이메일")}</span>)}</p>
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
      {progress && <p className="mb-[12px] t-caption-1 text-labelAlt" role="status">{progress}</p>}
      {!canSubmit && !submitting && <p className="mb-[12px] t-caption-1 text-labelAlt" data-testid="partner-missing"><span className="font-semibold text-labelNeutral">{C.readyHint}</span> {missing.join(" · ")}</p>}
      <Button type="submit" size="lg" disabled={!canSubmit || submitting} className="w-full md:w-auto md:min-w-[240px]">{submitting ? C.submittingLabel : C.submitLabel}</Button>
      <p className="mt-[10px] t-caption-1 text-labelAlt">{C.submitNote}</p>
    </form>
  );
}
