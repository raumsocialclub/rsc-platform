"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { InstagramButton } from "@/components/site/InstagramButton";
import { Logo } from "@/components/site/Logo";
import { Txt } from "@/components/cms/Txt";
import { trackLead } from "@/components/site/MetaPixel";
import { createClient } from "@/lib/supabase/client";
import { QUESTIONS, ageOf, formatBirthInput, parseBirth, questionTitle, type MatchAnswers, type Question } from "@/lib/match/schema";
import { MATCH_PHOTO_ACCEPT, MATCH_PHOTO_BUCKET, photoProblem } from "@/lib/match/photo";
import { formatPhoneInput, normalizePhone } from "@/lib/phone";
import { entryPathFromReferrer } from "@/lib/inquiries/track";
import { readUtm } from "@/lib/utm/client";

/**
 * 프로필 진단 (/match-check) — 「한 화면에 한 질문」 퍼널. 문항은 lib/match/schema.ts QUESTIONS.
 * - 선택형(single)은 고르면 잠깐 뒤 자동으로 다음 화면. 복수 선택(multi)은 「확인」, 입력형은 「다음」(Enter 로도 넘어감).
 * - 필수(이름·성별·생년월일·혼인 상태·거주 시/도·휴대폰) 외에는 「이 질문 건너뛰기」.
 * - 종교·건강 화면에는 민감정보 별도 동의(선택) 체크가 있고, 체크 없이 고르면 안내만 하고 저장하지 않는다 (서버도 sensitiveConsent 없으면 버림).
 * - 사진은 고르는 즉시 /api/match/upload-url → 비공개 버킷에 직접 올리고 경로만 들고 간다. 「나중에 올릴게요」로 건너뛸 수 있다.
 * - 마지막(휴대폰) 화면에서 개인정보 동의(필수)·마케팅 수신 동의(선택, 기본 접힘) 후 제출 → POST /api/match. 그 전에는 서버로 아무것도 보내지 않는다(브라우저 sessionStorage 임시 저장).
 * 문구(제목·완료 안내·버튼)는 CMS(match.form)에서 copy 로 넘어온다.
 */
export type MatchCopy = {
  title: string; closeLabel: string; prevLabel: string; nextLabel: string; confirmLabel: string; skipLabel: string; enterHint: string;
  photoPick: string; photoChange: string; photoLater: string; photoNote: string; photoRule: string;
  consentTitle: string; consentCollect: string; consentPurpose: string; consentRetention: string; consentRefuse: string; consentMore: string;
  sensitiveTitle: string; sensitiveItems: string; sensitivePurpose: string; sensitiveRetention: string; sensitiveRefuse: string;
  marketingTitle: string; marketingPurpose: string; marketingMethod: string; marketingItems: string; marketingRetention: string; marketingNote: string;
  submitLabel: string; submittingLabel: string; submitNote: string; doneTitle: string; doneBody: string; doneHome: string;
};
export const DEFAULT_MATCH_COPY: MatchCopy = {
  title: "3분 프로필 진단", closeLabel: "닫기 ✕", prevLabel: "이전", nextLabel: "다음", confirmLabel: "확인", skipLabel: "이 질문 건너뛰기", enterHint: "Enter ↵ 를 눌러도 돼요",
  photoPick: "사진 선택하기", photoChange: "다른 사진 고르기", photoLater: "나중에 올릴게요", photoNote: "사진이 있으면 매칭이 훨씬 빨라져요.\n지금 어렵다면 나중에 매니저에게 보내주셔도 괜찮아요.", photoRule: "jpg · png · webp · heic / 10MB 이하",
  consentTitle: "개인정보 수집·이용 동의", consentCollect: "이름, 성별, 생년월일, 휴대폰 번호, 혼인 상태, 거주지역(필수) · 자녀 유무, 만남 가능 지역, 키·체중, 학력·대학명, 직업·고용형태·연 소득, 본인·부모님 자산 규모, 외모 자기평가, MBTI, 흡연·주량, 이성을 볼 때 중요한 요소와 상세, 알게 된 경로, 사진(선택) · 광고 링크로 들어온 경우 광고 유입 정보(utm 값)",
  consentPurpose: "1:1 매칭 가입 상담의 준비(담당 매니저가 기본 정보와 희망 조건을 미리 확인)와 일정 조율, 문의 응대", consentRetention: "접수일로부터 최대 180일, 이후 자동 삭제 (요청 시 그 전에도 삭제)", consentRefuse: "필수 항목 동의를 거부하면 제출되지 않습니다. 선택 항목은 비워 두어도 됩니다.",
  consentMore: "자세한 내용은 {privacy}에서 확인하실 수 있습니다. 사이트 이용 조건은 {terms}을 참고해 주세요.",
  sensitiveTitle: "종교·건강 정보(민감정보) 수집·이용 동의", sensitiveItems: "종교, 신체적 특이사항(질병·장애 여부 등) — 개인정보 보호법 제23조의 민감정보", sensitivePurpose: "1:1 매칭 상담에서 희망 조건과의 적합성 확인", sensitiveRetention: "프로필 진단 응답과 함께 접수일로부터 최대 180일", sensitiveRefuse: "동의하지 않아도 제출과 상담에 제한이 없습니다. 동의하지 않으면 종교·건강 답변은 저장되지 않습니다.",
  marketingTitle: "마케팅 정보 수신 동의", marketingPurpose: "1:1 매칭 서비스의 맞춤 제안, 이벤트·프로모션 안내, 재상담 안내", marketingMethod: "전화, 문자, 카카오톡", marketingItems: "이름, 휴대폰 번호, 거주지역, 관심 방식·상담 이력", marketingRetention: "수신 동의 철회 시까지 (법령에 따라 2년마다 수신 동의 여부를 확인합니다)",
  marketingNote: "동의하지 않아도 상담 및 기본 서비스 이용에는 제한이 없습니다. 수신 동의는 전화(02-6925-4786)나 이메일로 언제든 철회할 수 있습니다.",
  submitLabel: "제출하고 매니저 연락 받기", submittingLabel: "보내는 중…", submitNote: "제출은 회원 가입이 아니며, 담당 매니저가 연락드린 뒤 상담이 진행됩니다.",
  doneTitle: "프로필이 접수되었습니다", doneBody: "담당 매니저가 남겨주신 번호로 연락드려 어울리는 만남의 방향을 안내해 드립니다. 문의나 취소는 전화(02-6925-4786)로 알려 주세요.", doneHome: "홈으로 돌아가기",
};

const STORE = "rsc_match_draft";
const OPT = "w-full min-h-[60px] flex items-center justify-between gap-[12px] px-[22px] py-[16px] rounded-[16px] border-2 text-left text-[17px] font-medium transition-[background-color,border-color,color,transform] duration-150 active:scale-[.985] cursor-pointer";
const OPT_OFF = "bg-fill border-transparent text-label hover:border-[rgba(var(--ds-primary-rgb),.45)]";
const OPT_ON = "bg-[rgba(var(--ds-primary-rgb),.08)] border-primary text-primary";
const CHIP = "inline-flex items-center justify-center min-h-[48px] px-[18px] rounded-full border-2 text-[16px] font-medium transition-[background-color,border-color,color,transform] duration-150 active:scale-[.97] cursor-pointer";
const FIELD = "w-full h-[60px] rounded-[16px] border-2 border-lineNeutral bg-white px-[20px] text-[20px] font-semibold text-label outline-none placeholder:font-normal placeholder:text-labelAssist focus:border-primary transition-[border-color] duration-150";
const AREA = "w-full min-h-[180px] rounded-[16px] border-2 border-lineNeutral bg-white px-[20px] py-[16px] text-[17px] text-label outline-none placeholder:text-labelAssist focus:border-primary transition-[border-color] duration-150 resize-y";
const BIG = "w-full h-[56px] rounded-[16px] bg-primary text-white text-[17px] font-bold transition-[background-color,transform,opacity] duration-150 hover:bg-primaryStrong active:scale-[.985] disabled:bg-disable disabled:text-labelDisable disabled:active:scale-100 cursor-pointer disabled:cursor-not-allowed";
const PILL = "inline-flex items-center gap-[4px] h-[36px] px-[14px] rounded-full bg-fill text-[14px] font-medium text-labelNeutral hover:bg-fillStrong disabled:opacity-0 disabled:pointer-events-none cursor-pointer";
const CARD = "rounded-[16px] border border-lineNeutral bg-white p-[16px] md:p-[18px]";

function Check() {
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M5 12l5 5L20 7" /></svg>;
}
function ConsentMore({ text }: { text: string }) {
  const parts = text.split(/(\{privacy\}|\{terms\})/);
  return <>{parts.map((p, i) => p === "{privacy}" ? <Link key={i} href="/privacy" target="_blank" className="underline text-primary">개인정보처리방침</Link> : p === "{terms}" ? <Link key={i} href="/terms" target="_blank" className="underline text-primary">이용약관</Link> : <span key={i}>{p}</span>)}</>;
}

type Photo = { path: string; name: string; preview?: string };

export function MatchForm({ copy }: { copy?: Partial<MatchCopy> }) {
  const C: MatchCopy = { ...DEFAULT_MATCH_COPY, ...Object.fromEntries(Object.entries(copy ?? {}).filter(([, v]) => !!v)) } as MatchCopy;
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<MatchAnswers>({});
  const [photo, setPhoto] = useState<Photo | null>(null);
  const [uploading, setUploading] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [sensitiveAgreed, setSensitiveAgreed] = useState(false);
  const [sensitiveOpen, setSensitiveOpen] = useState(false);
  const [marketing, setMarketing] = useState(false);
  const [marketingOpen, setMarketingOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [restored, setRestored] = useState(false);
  const input = useRef<HTMLInputElement | HTMLTextAreaElement>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const advanceTimer = useRef<number | null>(null);

  const total = QUESTIONS.length;
  const q: Question = QUESTIONS[step];
  const last = step === total - 1;
  const value = answers[q.key];
  const str = Array.isArray(value) ? "" : String(value ?? "");
  const list = Array.isArray(value) ? value : [];

  /* 임시 저장 복원 (하이드레이션 뒤) */
  useEffect(() => {
    const t = setTimeout(() => {
      try {
        const raw = sessionStorage.getItem(STORE);
        if (raw) {
          const j = JSON.parse(raw) as { step?: number; answers?: MatchAnswers; photo?: Photo | null; sensitiveAgreed?: boolean };
          if (j.answers) setAnswers(j.answers);
          if (j.photo?.path) setPhoto({ path: j.photo.path, name: j.photo.name });
          if (j.sensitiveAgreed) setSensitiveAgreed(true);
          if (typeof j.step === "number") setStep(Math.min(Math.max(0, j.step), total - 1));
        }
      } catch {}
      setRestored(true);
    }, 0);
    return () => clearTimeout(t);
  }, [total]);
  useEffect(() => {
    if (!restored) return;
    try { sessionStorage.setItem(STORE, JSON.stringify({ step, answers, photo: photo ? { path: photo.path, name: photo.name } : null, sensitiveAgreed })); } catch {}
  }, [restored, step, answers, photo, sensitiveAgreed]);
  /* 화면이 바뀌면 입력칸에 포커스(데스크톱) · 맨 위로 */
  useEffect(() => {
    window.scrollTo({ top: 0 });
    if (window.matchMedia("(min-width: 761px)").matches) input.current?.focus({ preventScroll: true });
    return () => { if (advanceTimer.current) window.clearTimeout(advanceTimer.current); };
  }, [step]);

  const set = (key: string, v: string | string[]) => { setAnswers((a) => ({ ...a, [key]: v })); setError(null); };
  const go = (n: number) => { setError(null); setStep(Math.min(Math.max(0, n), total - 1)); };
  const filled = (qq: Question): boolean => {
    if (qq.type === "photo") return !!photo;
    const v = answers[qq.key];
    if (Array.isArray(v)) return qq.exact ? v.length === qq.exact : v.length > 0;
    const s = String(v ?? "").trim();
    if (!s) return false;
    if (qq.type === "date") return parseBirth(s) !== null;
    if (qq.type === "tel") return normalizePhone(s) !== null;
    return true;
  };
  const next = () => {
    if (q.required && !filled(q)) {
      setError(q.type === "date" ? "생년월일을 YYYY.MM.DD 형식으로 입력해 주세요." : q.type === "tel" ? "휴대폰 번호는 010-1234-5678 형식으로 입력해 주세요." : "이 질문은 꼭 답해 주세요.");
      input.current?.focus();
      return;
    }
    if (q.sensitive && filled(q) && !sensitiveAgreed) { setError("답을 저장하려면 아래 민감정보 동의에 체크해 주세요. 동의하지 않으려면 「이 질문 건너뛰기」를 눌러 주세요."); return; }
    go(step + 1);
  };
  const skip = () => { if (q.type === "photo") setPhoto(null); else set(q.key, q.type === "multi" ? [] : ""); go(step + 1); };
  const pick = (o: string) => {
    if (q.sensitive && !sensitiveAgreed) { set(q.key, o); setError("저장하려면 아래 민감정보 동의에 체크해 주세요. 체크하지 않으면 이 답은 저장되지 않아요."); return; }
    set(q.key, o);
    if (!last) advanceTimer.current = window.setTimeout(() => go(step + 1), 240);
  };
  const toggle = (o: string) => {
    const on = list.includes(o);
    if (!on && q.exact && list.length >= q.exact) return;
    set(q.key, on ? list.filter((x) => x !== o) : [...list, o]);
  };

  const onFile = async (f: File | null) => {
    if (!f) return;
    const problem = photoProblem(f.name, f.size);
    if (problem) { setError(problem); return; }
    setError(null); setUploading(true);
    const preview = URL.createObjectURL(f);
    try {
      const res = await fetch("/api/match/upload-url", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: f.name, size: f.size }) });
      const j = (await res.json().catch(() => null)) as { ok?: boolean; path?: string; token?: string; message?: string } | null;
      if (!res.ok || !j?.ok || !j.path || !j.token) throw new Error(j?.message ?? "사진을 올리지 못했습니다.");
      const { error: upErr } = await createClient().storage.from(MATCH_PHOTO_BUCKET).uploadToSignedUrl(j.path, j.token, f, { contentType: f.type || "application/octet-stream", upsert: false });
      if (upErr) throw new Error(`사진을 올리지 못했습니다 (${upErr.message}). 잠시 후 다시 시도해 주세요.`);
      setPhoto({ path: j.path, name: f.name, preview });
    } catch (e) {
      URL.revokeObjectURL(preview);
      setError(e instanceof Error ? e.message : "사진을 올리지 못했습니다.");
    } finally {
      setUploading(false);
      if (fileInput.current) fileInput.current.value = "";
    }
  };

  const submit = async () => {
    if (!filled(q)) { next(); return; }
    if (!agreed) { setError("개인정보 수집·이용에 동의해 주세요."); return; }
    setSubmitting(true); setError(null);
    try {
      const body = { answers: { ...answers, phone: normalizePhone(str) ?? str }, consent: true, sensitiveConsent: sensitiveAgreed, marketing, photo: photo?.path ?? null, entryPath: entryPathFromReferrer(document.referrer, window.location.origin), utm: readUtm() };
      const res = await fetch("/api/match", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const j = (await res.json().catch(() => null)) as { ok?: boolean; message?: string } | null;
      if (!res.ok || !j?.ok) throw new Error(j?.message ?? "제출하지 못했습니다. 잠시 후 다시 시도해 주세요.");
      try { sessionStorage.removeItem(STORE); } catch {}
      trackLead();
      setDone(true);
      window.scrollTo({ top: 0 });
    } catch (e) {
      setError(e instanceof Error ? e.message : "제출하지 못했습니다. 잠시 후 다시 시도해 주세요.");
    } finally { setSubmitting(false); }
  };

  const age = useMemo(() => (q.type === "date" ? ageOf(str) : null), [q.type, str]);
  const title = questionTitle(q, answers);
  const canProceed = filled(q);

  if (done) {
    return (
      <div className="min-h-screen bg-white flex flex-col">
        <TopBar C={C} />
        <main className="flex-1 flex items-center justify-center px-[20px] py-[48px]">
          <div className="w-full max-w-[560px] text-center anim-up">
            <div className="w-[64px] h-[64px] rounded-full bg-[rgba(0,191,64,.12)] text-positiveFg flex items-center justify-center mx-auto mb-[22px]"><Check /></div>
            <h1 className="t-title-2 md:t-title-1 text-label mb-[12px] text-pretty">{C.doneTitle}</h1>
            <p className="t-body-1-reading text-labelAlt mb-[30px] text-pretty"><Txt v={C.doneBody} /></p>
            <div className="flex gap-[10px] justify-center flex-wrap">
              <Link href="/" className={`${BIG} w-auto px-[28px] inline-flex items-center`}>{C.doneHome}</Link>
              <InstagramButton />
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex flex-col text-label">
      <TopBar C={C} step={step} total={total} />
      <main className="flex-1 w-full max-w-[640px] mx-auto px-[20px] pt-[24px] pb-[48px] md:pt-[40px]" data-testid="match-form" data-step={q.key}>
        <button type="button" onClick={() => go(step - 1)} disabled={step === 0} className={PILL} aria-label={C.prevLabel}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M15 18l-6-6 6-6" /></svg>{C.prevLabel}
        </button>
        <div key={q.key} className="anim-up mt-[22px]">
          <h1 className="t-title-2 md:t-title-1 text-label text-pretty">{title}{q.required && <span className="text-negative"> *</span>}</h1>
          {q.sub && <p className="mt-[10px] t-body-1-reading text-labelAlt text-pretty">{q.sub}</p>}

          <div className="mt-[28px]">
            {q.sensitive && (
              <div className={`${CARD} mb-[18px] ${error && !sensitiveAgreed ? "border-negative" : ""}`} data-testid="match-sensitive">
                <div className="flex items-start gap-[12px]">
                  <label className="flex items-start gap-[12px] cursor-pointer flex-1 min-w-0">
                    <input type="checkbox" checked={sensitiveAgreed} onChange={(e) => { setSensitiveAgreed(e.target.checked); if (e.target.checked) setError(null); }} className="w-[20px] h-[20px] mt-[1px] accent-primary cursor-pointer flex-none rounded" data-testid="match-sensitive-check" />
                    <span className="t-body-2 font-semibold text-label">{C.sensitiveTitle} <span className="text-labelAlt font-normal">(선택)</span></span>
                  </label>
                  <button type="button" onClick={() => setSensitiveOpen((v) => !v)} aria-expanded={sensitiveOpen} className="flex-none t-caption-1 text-labelAlt underline hover:text-label">{sensitiveOpen ? "접기" : "펼치기"}</button>
                </div>
                {sensitiveOpen && (
                  <dl className="mt-[10px] ml-[32px] grid gap-[3px] t-label-1-reading text-labelAlt">
                    <div><dt className="inline font-semibold text-labelNeutral">수집 항목: </dt><dd className="inline">{C.sensitiveItems}</dd></div>
                    <div><dt className="inline font-semibold text-labelNeutral">이용 목적: </dt><dd className="inline">{C.sensitivePurpose}</dd></div>
                    <div><dt className="inline font-semibold text-labelNeutral">보관 기간: </dt><dd className="inline">{C.sensitiveRetention}</dd></div>
                    <div><dt className="inline font-semibold text-labelNeutral">거부 시: </dt><dd className="inline">{C.sensitiveRefuse}</dd></div>
                  </dl>
                )}
              </div>
            )}

            {q.type === "single" && (
              <div role="radiogroup" aria-label={title} className={`grid gap-[10px] ${q.layout === "grid2" ? "grid-cols-2" : q.layout === "grid4" ? "grid-cols-3 sm:grid-cols-4" : "grid-cols-1"}`}>
                {(q.options ?? []).map((o) => {
                  const on = str === o;
                  return (
                    <button key={o} type="button" role="radio" aria-checked={on} onClick={() => pick(o)} className={`${OPT} ${on ? OPT_ON : OPT_OFF} ${q.layout === "grid4" ? "px-[14px] justify-center text-center" : ""}`}>
                      <span className="min-w-0 text-pretty">{o}</span>{on && q.layout !== "grid4" && <Check />}
                    </button>
                  );
                })}
              </div>
            )}

            {q.type === "multi" && (
              <>
                <div role="group" aria-label={title} className="flex flex-wrap gap-[10px]">
                  {(q.options ?? []).map((o) => {
                    const on = list.includes(o);
                    const full = !!q.exact && !on && list.length >= q.exact;
                    return <button key={o} type="button" aria-pressed={on} disabled={full} onClick={() => toggle(o)} className={`${CHIP} ${on ? OPT_ON : OPT_OFF} disabled:opacity-40 disabled:cursor-not-allowed`}>{o}</button>;
                  })}
                </div>
                {q.exact && <p className="mt-[14px] t-label-1 text-labelAlt">{list.length} / {q.exact}개 선택</p>}
                <button type="button" onClick={next} disabled={!canProceed} className={`${BIG} mt-[22px]`}>{C.confirmLabel}</button>
              </>
            )}

            {(q.type === "text" || q.type === "number" || q.type === "tel" || q.type === "date") && (
              <form onSubmit={(e) => { e.preventDefault(); if (last) void submit(); else next(); }}>
                <div className="relative">
                  <input
                    ref={input as React.RefObject<HTMLInputElement>}
                    value={str}
                    onChange={(e) => {
                      const raw = e.target.value;
                      set(q.key, q.type === "tel" ? formatPhoneInput(raw) : q.type === "number" ? raw.replace(/[^\d.]/g, "").slice(0, 9) : q.type === "date" ? formatBirthInput(raw) : raw.slice(0, q.max ?? 200));
                    }}
                    placeholder={q.placeholder}
                    inputMode={q.type === "text" ? undefined : "numeric"}
                    autoComplete={q.key === "name" ? "name" : q.key === "phone" ? "tel" : q.key === "birth" ? "bday" : "off"}
                    enterKeyHint={last ? "send" : "next"}
                    maxLength={q.type === "date" ? 10 : q.type === "tel" ? 13 : q.max ?? 200}
                    className={`${FIELD} ${q.unit ? "pr-[72px]" : ""} ${error && q.required ? "!border-negative" : ""}`}
                    data-testid={`match-${q.key}`}
                  />
                  {q.unit && <span className="absolute right-[20px] top-1/2 -translate-y-1/2 text-[18px] text-labelAlt">{q.unit}</span>}
                </div>
                {q.type === "date" && <p className={`mt-[10px] t-label-1 font-semibold ${age != null ? "text-primary" : "text-labelAssist"}`}>{age != null ? `만 ${age}세` : "숫자만 입력하면 자동으로 점이 붙어요"}</p>}

                {last ? (
                  <div className="mt-[26px] grid gap-[12px]">
                    <div className={`${CARD} ${error && !agreed ? "border-negative" : ""}`}>
                      <label className="flex items-start gap-[12px] cursor-pointer">
                        <input type="checkbox" checked={agreed} onChange={(e) => { setAgreed(e.target.checked); if (e.target.checked) setError(null); }} className="w-[20px] h-[20px] mt-[1px] accent-primary cursor-pointer flex-none rounded" data-testid="match-consent-check" />
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
                    <div className={CARD} data-testid="match-marketing">
                      <div className="flex items-start gap-[12px]">
                        <label className="flex items-start gap-[12px] cursor-pointer flex-1 min-w-0">
                          <input type="checkbox" checked={marketing} onChange={(e) => setMarketing(e.target.checked)} className="w-[20px] h-[20px] mt-[1px] accent-primary cursor-pointer flex-none rounded" data-testid="match-marketing-check" />
                          <span className="t-body-2 font-semibold text-label">{C.marketingTitle} <span className="text-labelAlt font-normal">(선택)</span></span>
                        </label>
                        <button type="button" onClick={() => setMarketingOpen((v) => !v)} aria-expanded={marketingOpen} className="flex-none t-caption-1 text-labelAlt underline hover:text-label">{marketingOpen ? "접기" : "펼치기"}</button>
                      </div>
                      {marketingOpen && (
                        <div>
                          <dl className="mt-[10px] ml-[32px] grid gap-[3px] t-label-1-reading text-labelAlt">
                            <div><dt className="inline font-semibold text-labelNeutral">목적: </dt><dd className="inline">{C.marketingPurpose}</dd></div>
                            <div><dt className="inline font-semibold text-labelNeutral">방법: </dt><dd className="inline">{C.marketingMethod}</dd></div>
                            <div><dt className="inline font-semibold text-labelNeutral">항목: </dt><dd className="inline">{C.marketingItems}</dd></div>
                            <div><dt className="inline font-semibold text-labelNeutral">보유·이용 기간: </dt><dd className="inline">{C.marketingRetention}</dd></div>
                          </dl>
                          <p className="mt-[8px] ml-[32px] t-caption-1 text-labelAlt">{C.marketingNote}</p>
                        </div>
                      )}
                    </div>
                    <button type="submit" disabled={submitting || !canProceed || !agreed} className={BIG} data-testid="match-submit">{submitting ? C.submittingLabel : C.submitLabel}</button>
                    <p className="text-center t-caption-1 text-labelAlt text-pretty"><Txt v={C.submitNote} /></p>
                  </div>
                ) : (
                  <>
                    <button type="submit" disabled={q.required && !canProceed} className={`${BIG} mt-[22px]`}>{C.nextLabel}</button>
                    <p className="hidden md:block mt-[10px] t-caption-1 text-labelAssist">{C.enterHint}</p>
                  </>
                )}
              </form>
            )}

            {q.type === "textarea" && (
              <>
                <textarea ref={input as React.RefObject<HTMLTextAreaElement>} value={str} onChange={(e) => set(q.key, e.target.value.slice(0, q.max ?? 1000))} placeholder={q.placeholder} maxLength={q.max ?? 1000} className={AREA} data-testid={`match-${q.key}`} />
                <button type="button" onClick={next} className={`${BIG} mt-[22px]`}>{C.nextLabel}</button>
              </>
            )}

            {q.type === "photo" && (
              <>
                <div className="rounded-[16px] border-2 border-dashed border-lineNeutral p-[24px] md:p-[32px] text-center">
                  {photo ? (
                    <div className="flex flex-col items-center gap-[12px]">
                      {photo.preview ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={photo.preview} alt="올린 사진 미리보기" className="w-[160px] h-[160px] object-cover rounded-[16px]" />
                      ) : (
                        <div className="w-[160px] h-[160px] rounded-[16px] bg-fill flex items-center justify-center text-positiveFg"><Check /></div>
                      )}
                      <p className="t-label-1 text-labelNeutral break-all">{photo.name}</p>
                      <button type="button" onClick={() => fileInput.current?.click()} disabled={uploading} className={`${PILL} h-[40px] px-[18px]`}>{C.photoChange}</button>
                    </div>
                  ) : (
                    <>
                      <button type="button" onClick={() => fileInput.current?.click()} disabled={uploading} className="w-full max-w-[420px] mx-auto h-[56px] rounded-full bg-inverseBg text-inverseLabel text-[17px] font-bold hover:opacity-90 active:scale-[.985] transition-[opacity,transform] duration-150 disabled:opacity-60 cursor-pointer">{uploading ? "올리는 중…" : C.photoPick}</button>
                      <p className="mt-[12px] t-caption-1 text-labelAlt">{C.photoRule}</p>
                    </>
                  )}
                  <input ref={fileInput} type="file" accept={MATCH_PHOTO_ACCEPT} className="sr-only" onChange={(e) => void onFile(e.target.files?.[0] ?? null)} data-testid="match-photo-input" />
                </div>
                <button type="button" onClick={next} disabled={!photo || uploading} className={`${BIG} mt-[22px]`}>{C.nextLabel}</button>
                <p className="mt-[14px] t-label-1-reading text-labelAlt whitespace-pre-line text-pretty">{C.photoNote}</p>
              </>
            )}

            {error && <p role="alert" className="mt-[16px] px-[14px] py-[10px] bg-[rgba(255,66,66,.08)] rounded-[12px] t-label-1-reading text-negativeFg">{error}</p>}

            {!q.required && (
              <div className="mt-[18px] text-center">
                <button type="button" onClick={skip} className="t-body-2 text-labelAlt underline underline-offset-4 hover:text-label cursor-pointer" data-testid="match-skip">{q.type === "photo" ? C.photoLater : C.skipLabel}</button>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

function TopBar({ C, step, total }: { C: MatchCopy; step?: number; total?: number }) {
  const pct = step != null && total ? Math.round(((step + 1) / total) * 100) : 100;
  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur border-b border-lineAlt">
      <div className="h-[56px] md:h-[64px] flex items-center justify-between gap-[16px] px-[20px] md:px-[32px]">
        <Logo href="/" emblemClass="h-[26px] md:h-[30px]" textClass="h-[13px] md:h-[15px]" textSrc="/images/logo-text-fitcheck.png" className="gap-[10px]" />
        <div className="flex items-center gap-[14px]">
          {step != null && total && <span className="t-label-1 text-labelAlt"><b className="text-label">{step + 1}</b> / {total}</span>}
          <Link href="/" className="t-label-1 text-labelAlt hover:text-label">{C.closeLabel}</Link>
        </div>
      </div>
      <div className="h-[3px] bg-fill" aria-hidden><div className="h-full bg-primary transition-[width] duration-300" style={{ width: `${pct}%` }} /></div>
    </header>
  );
}
