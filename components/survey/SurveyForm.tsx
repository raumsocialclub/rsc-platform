"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { InstagramButton } from "@/components/site/InstagramButton";
import { Logo } from "@/components/site/Logo";
import { Txt } from "@/components/cms/Txt";
import { OTHER, PHONE4_RE, otherKey, surveyDef, type SurveyAnswers, type SurveyQuestion } from "@/lib/survey/definitions";

/**
 * 회원 설문조사 (/s/<토큰>) — 「한 화면에 한 질문」. 문항은 lib/survey/definitions.ts (종류 kind).
 * 흐름: 첫 화면(안내 + 시작하기) → 질문 N개(순위형은 누른 순서대로 1·2순위 배지, 단일 선택은 고르면 잠깐 뒤 자동 다음, 복수 선택은 최대 수까지 + 「다음」)
 *   → 마지막 화면(이름·휴대폰 뒤 4자리 선택 입력 — 적으면 개인정보 동의 체크가 필수 — 제출) → 완료.
 * - 「기타」를 고르면 바로 아래 직접 입력 칸이 열리고, 내용을 적어야 다음으로 넘어간다.
 * - 작성 중인 답은 브라우저(sessionStorage)에만 두고 제출 전에는 서버로 보내지 않는다. 제출하면 이 브라우저에 「응답함」 표시를 남겨 같은 링크를 다시 열면 완료 화면이 먼저 보인다(「다시 응답하기」로 풀 수 있음).
 * 문구: 공통은 CMS survey.form(copy), 설문별 첫 화면·완료 문구는 CMS survey.<kind>(text) → 코드 기본값.
 */
export type SurveyCopy = {
  closeLabel: string; startLabel: string; prevLabel: string; nextLabel: string; otherPlaceholder: string; periodLabel: string; minutesLabel: string;
  finalTitle: string; finalSub: string; nameLabel: string; namePlaceholder: string; phone4Label: string; phone4Placeholder: string; identifyNote: string;
  consentTitle: string; consentCollect: string; consentPurpose: string; consentRetention: string; consentRefuse: string; consentMore: string;
  submitLabel: string; submittingLabel: string; submitNote: string; doneHome: string; againLabel: string; alreadyTitle: string; alreadyBody: string;
};
export const DEFAULT_SURVEY_COPY: SurveyCopy = {
  closeLabel: "닫기 ✕", startLabel: "시작하기", prevLabel: "이전", nextLabel: "다음", otherPlaceholder: "직접 적어 주세요", periodLabel: "응답 기간", minutesLabel: "약 {minutes}분이면 충분해요",
  finalTitle: "마지막이에요. 응답자 확인을 도와주세요.", finalSub: "이름과 휴대폰 뒤 4자리는 선택 사항이에요. 남겨 주시면 응답자 혜택 안내와 중복 응답 확인에만 쓰고, 개별 응답 내용은 다른 회원에게 공개되지 않아요.",
  nameLabel: "이름 (선택)", namePlaceholder: "예) 김라움", phone4Label: "휴대폰 뒤 4자리 (선택)", phone4Placeholder: "예) 1234",
  identifyNote: "비워 두면 무기명으로 제출돼요.",
  consentTitle: "개인정보 수집·이용 동의", consentCollect: "이름, 휴대폰 번호 뒤 4자리(선택)", consentPurpose: "설문 응답자 확인(응답자 혜택 안내, 중복 응답 확인)과 회원별 선호 파악", consentRetention: "응답일로부터 1년, 이후 이름·뒤 4자리는 자동 삭제(응답 내용은 통계로만 남습니다)", consentRefuse: "동의하지 않으면 이름·뒤 4자리 없이 무기명으로 제출할 수 있습니다.",
  consentMore: "자세한 내용은 {privacy}에서 확인하실 수 있습니다.",
  submitLabel: "제출하기", submittingLabel: "보내는 중…", submitNote: "제출 후에는 답을 수정할 수 없어요. 문의: 02-6925-4786", doneHome: "홈으로 돌아가기", againLabel: "다시 응답하기",
  alreadyTitle: "이미 응답해 주셨어요", alreadyBody: "이 기기에서 이미 설문을 제출하셨습니다. 감사합니다!\n다른 분의 응답이라면 아래 「다시 응답하기」를 눌러 주세요.",
};
export type SurveyText = { title: string; eyebrow: string; intro: string; note1: string; note2: string; thanksTitle: string; thanksBody: string };

const OPT = "w-full min-h-[60px] flex items-center justify-between gap-[12px] px-[20px] py-[14px] rounded-[16px] border-2 text-left transition-[background-color,border-color,color,transform,opacity] duration-150 active:scale-[.985] cursor-pointer disabled:cursor-not-allowed";
const OPT_OFF = "bg-fill border-transparent text-label hover:border-[rgba(var(--ds-primary-rgb),.45)]";
const OPT_ON = "bg-[rgba(var(--ds-primary-rgb),.08)] border-primary text-primary";
const FIELD = "w-full h-[56px] rounded-[16px] border-2 border-lineNeutral bg-white px-[18px] text-[18px] font-semibold text-label outline-none placeholder:font-normal placeholder:text-labelAssist focus:border-primary transition-[border-color] duration-150";
const BIG = "w-full h-[56px] rounded-[16px] bg-primary text-white text-[17px] font-bold transition-[background-color,transform,opacity] duration-150 hover:bg-primaryStrong active:scale-[.985] disabled:bg-disable disabled:text-labelDisable disabled:active:scale-100 cursor-pointer disabled:cursor-not-allowed";
const PILL = "inline-flex items-center gap-[4px] h-[36px] px-[14px] rounded-full bg-fill text-[14px] font-medium text-labelNeutral hover:bg-fillStrong disabled:opacity-0 disabled:pointer-events-none cursor-pointer";
const CARD = "rounded-[16px] border border-lineNeutral bg-white p-[16px] md:p-[18px]";

function Check() {
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M5 12l5 5L20 7" /></svg>;
}
function ConsentMore({ text }: { text: string }) {
  const parts = text.split(/(\{privacy\})/);
  return <>{parts.map((p, i) => p === "{privacy}" ? <Link key={i} href="/privacy" target="_blank" className="underline text-primary">개인정보처리방침</Link> : <span key={i}>{p}</span>)}</>;
}
const fmtKo = (iso: string) => { const d = new Date(iso); return `${d.getMonth() + 1}월 ${d.getDate()}일`; };

export function SurveyForm({ token, kind, closesAt, copy, text }: { token: string; kind: string; closesAt: string | null; copy?: Partial<SurveyCopy>; text: SurveyText }) {
  const C: SurveyCopy = { ...DEFAULT_SURVEY_COPY, ...Object.fromEntries(Object.entries(copy ?? {}).filter(([, v]) => !!v)) } as SurveyCopy;
  const def = surveyDef(kind)!;
  const Q = def.questions;
  const total = Q.length;
  const FINAL = total + 1;
  const key8 = token.slice(0, 8);
  const DRAFT = `rsc_survey_draft:${key8}`;
  const DONE = `rsc_survey_done:${key8}`;

  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<SurveyAnswers>({});
  const [name, setName] = useState("");
  const [phone4, setPhone4] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState<"" | "now" | "before">("");
  const [restored, setRestored] = useState(false);
  const advanceTimer = useRef<number | null>(null);
  const otherInput = useRef<HTMLInputElement>(null);

  /* 임시 저장·응답함 표시 복원 (하이드레이션 뒤) */
  useEffect(() => {
    const t = setTimeout(() => {
      try {
        if (localStorage.getItem(DONE)) setDone("before");
        const raw = sessionStorage.getItem(DRAFT);
        if (raw) {
          const j = JSON.parse(raw) as { step?: number; answers?: SurveyAnswers; name?: string; phone4?: string };
          if (j.answers) setAnswers(j.answers);
          if (j.name) setName(j.name);
          if (j.phone4) setPhone4(j.phone4);
          if (typeof j.step === "number") setStep(Math.min(Math.max(0, j.step), FINAL));
        }
      } catch {}
      setRestored(true);
    }, 0);
    return () => clearTimeout(t);
  }, [DRAFT, DONE, FINAL]);
  useEffect(() => {
    if (!restored) return;
    try { sessionStorage.setItem(DRAFT, JSON.stringify({ step, answers, name, phone4 })); } catch {}
  }, [restored, DRAFT, step, answers, name, phone4]);
  useEffect(() => {
    window.scrollTo({ top: 0 });
    return () => { if (advanceTimer.current) window.clearTimeout(advanceTimer.current); };
  }, [step]);

  const q: SurveyQuestion | null = step >= 1 && step <= total ? Q[step - 1] : null;
  const value = q ? answers[q.key] : undefined;
  const list = Array.isArray(value) ? value : [];
  const str = typeof value === "string" ? value : "";
  const otherText = q ? String(answers[otherKey(q.key)] ?? "") : "";
  const otherPicked = !!q?.other && (q.type === "single" ? str === OTHER : list.includes(OTHER));

  const set = (k: string, v: string | string[]) => { setAnswers((a) => ({ ...a, [k]: v })); setError(null); };
  const go = (n: number) => { setError(null); setStep(Math.min(Math.max(0, n), FINAL)); };
  const valid = (qq: SurveyQuestion): boolean => {
    const v = answers[qq.key];
    const picked = Array.isArray(v) ? v : typeof v === "string" && v ? [v] : [];
    if (qq.type === "rank" ? picked.length !== (qq.ranks ?? 1) : picked.length === 0) return false;
    if (qq.other && picked.includes(OTHER) && !String(answers[otherKey(qq.key)] ?? "").trim()) return false;
    return true;
  };
  const next = () => {
    if (!q) { go(step + 1); return; }
    if (!valid(q)) {
      if (q.other && (q.type === "single" ? str === OTHER : list.includes(OTHER)) && !otherText.trim()) { setError("「기타」 내용을 적어 주세요."); otherInput.current?.focus(); return; }
      setError(q.type === "rank" ? `1순위부터 ${q.ranks}순위까지 골라 주세요.` : "하나 이상 골라 주세요.");
      return;
    }
    go(step + 1);
  };
  const pickSingle = (o: string) => {
    if (!q) return;
    set(q.key, o);
    if (o !== OTHER && step < FINAL) advanceTimer.current = window.setTimeout(() => go(step + 1), 240);
  };
  const toggleMulti = (o: string) => {
    if (!q) return;
    const on = list.includes(o);
    if (on) { set(q.key, list.filter((x) => x !== o)); return; }
    if (q.exclusive && o === q.exclusive) { set(q.key, [o]); return; }
    const base = q.exclusive ? list.filter((x) => x !== q.exclusive) : list;
    if (q.max && base.length >= q.max) return;
    set(q.key, [...base, o]);
  };
  const toggleRank = (o: string) => {
    if (!q) return;
    if (list.includes(o)) { set(q.key, list.filter((x) => x !== o)); return; }
    if (list.length >= (q.ranks ?? 1)) return;
    set(q.key, [...list, o]);
  };

  const identified = def.identify && !!(name.trim() || phone4.trim());
  const submit = async () => {
    if (def.identify && phone4 && !PHONE4_RE.test(phone4)) { setError("휴대폰 뒤 4자리는 숫자 4자리로 적어 주세요."); return; }
    if (identified && !agreed) { setError("이름·휴대폰 뒤 4자리를 남기려면 개인정보 수집·이용에 동의해 주세요. 남기지 않으려면 칸을 비워 주세요."); return; }
    const miss = Q.find((qq) => !valid(qq));
    if (miss) { setError(`「${miss.label}」 문항을 아직 답하지 않았어요.`); setStep(Q.indexOf(miss) + 1); return; }
    setSubmitting(true); setError(null);
    try {
      const body = { token, answers, name: identified ? name.trim() : "", phone4: identified ? phone4.trim() : "", consent: identified ? agreed : false };
      const res = await fetch("/api/survey", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const j = (await res.json().catch(() => null)) as { ok?: boolean; message?: string } | null;
      if (!res.ok || !j?.ok) throw new Error(j?.message ?? "제출하지 못했습니다. 잠시 후 다시 시도해 주세요.");
      try { sessionStorage.removeItem(DRAFT); localStorage.setItem(DONE, new Date().toISOString()); } catch {}
      setDone("now");
      window.scrollTo({ top: 0 });
    } catch (e) {
      setError(e instanceof Error ? e.message : "제출하지 못했습니다. 잠시 후 다시 시도해 주세요.");
    } finally { setSubmitting(false); }
  };
  const again = () => {
    try { localStorage.removeItem(DONE); sessionStorage.removeItem(DRAFT); } catch {}
    setAnswers({}); setName(""); setPhone4(""); setAgreed(false); setStep(0); setDone("");
  };

  /* ---------- 완료 / 이미 응답함 ---------- */
  if (done) {
    const before = done === "before";
    return (
      <div className="min-h-screen bg-white flex flex-col">
        <TopBar C={C} />
        <main className="flex-1 flex items-center justify-center px-[20px] py-[48px]">
          <div className="w-full max-w-[560px] text-center anim-up" data-testid="survey-done">
            <div className="w-[64px] h-[64px] rounded-full bg-[rgba(0,191,64,.12)] text-positiveFg flex items-center justify-center mx-auto mb-[22px]"><Check /></div>
            <h1 className="t-title-2 md:t-title-1 text-label mb-[12px] text-pretty">{before ? C.alreadyTitle : text.thanksTitle}</h1>
            <p className="t-body-1-reading text-labelAlt mb-[30px] text-pretty whitespace-pre-line"><Txt v={before ? C.alreadyBody : text.thanksBody} breaks="hard" /></p>
            <div className="flex gap-[10px] justify-center flex-wrap">
              <Link href="/" className={`${BIG} w-auto px-[28px] inline-flex items-center`}>{C.doneHome}</Link>
              <InstagramButton />
            </div>
            {before && <button type="button" onClick={again} className="mt-[22px] t-body-2 text-labelAlt underline underline-offset-4 hover:text-label cursor-pointer" data-testid="survey-again">{C.againLabel}</button>}
          </div>
        </main>
      </div>
    );
  }

  /* ---------- 첫 화면 ---------- */
  if (step === 0) {
    const notes = [text.note1 || def.notes[0], text.note2 || def.notes[1], ...def.notes.slice(2)].filter(Boolean);
    return (
      <div className="min-h-screen bg-white flex flex-col text-label">
        <TopBar C={C} />
        <main className="flex-1 w-full max-w-[640px] mx-auto px-[20px] pt-[36px] pb-[48px] md:pt-[56px]" data-testid="survey-form" data-step="intro">
          <div className="anim-up">
            <p className="t-label-1 font-bold tracking-[.12em] text-primary">{text.eyebrow}</p>
            <h1 className="mt-[10px] t-title-2 md:t-title-1 text-label text-pretty">{text.title}</h1>
            <p className="mt-[18px] t-body-1-reading text-labelNeutral text-pretty whitespace-pre-line"><Txt v={text.intro} breaks="hard" /></p>
            <ul className="mt-[22px] grid gap-[8px]">
              {notes.map((n, i) => <li key={i} className="flex gap-[10px] t-label-1-reading text-labelAlt"><span className="flex-none mt-[8px] w-[5px] h-[5px] rounded-full bg-primary" aria-hidden /><span className="text-pretty">{n}</span></li>)}
              {closesAt && <li className="flex gap-[10px] t-label-1-reading text-labelAlt"><span className="flex-none mt-[8px] w-[5px] h-[5px] rounded-full bg-primary" aria-hidden /><span>{C.periodLabel}: ~ {fmtKo(closesAt)}</span></li>}
            </ul>
            <button type="button" onClick={() => go(1)} className={`${BIG} mt-[32px]`} data-testid="survey-start">{C.startLabel}</button>
            <p className="mt-[10px] text-center t-caption-1 text-labelAssist">{C.minutesLabel.replace("{minutes}", String(def.minutes))}</p>
          </div>
        </main>
      </div>
    );
  }

  /* ---------- 마지막 화면 (응답자 확인 + 제출) ---------- */
  if (step === FINAL) {
    return (
      <div className="min-h-screen bg-white flex flex-col text-label">
        <TopBar C={C} step={total} total={total} label="확인" />
        <main className="flex-1 w-full max-w-[640px] mx-auto px-[20px] pt-[24px] pb-[48px] md:pt-[40px]" data-testid="survey-form" data-step="final">
          <button type="button" onClick={() => go(step - 1)} className={PILL} aria-label={C.prevLabel}><Arrow />{C.prevLabel}</button>
          <form className="anim-up mt-[22px]" onSubmit={(e) => { e.preventDefault(); void submit(); }}>
            <h1 className="t-title-2 md:t-title-1 text-label text-pretty">{def.identify ? C.finalTitle : "응답을 제출할까요?"}</h1>
            {def.identify && <p className="mt-[10px] t-body-1-reading text-labelAlt text-pretty">{C.finalSub}</p>}
            {def.identify && (
              <div className="mt-[26px] grid gap-[14px]">
                <label className="block">
                  <span className="block t-label-1 font-semibold text-labelNeutral mb-[8px]">{C.nameLabel}</span>
                  <input value={name} onChange={(e) => { setName(e.target.value.slice(0, 50)); setError(null); }} placeholder={C.namePlaceholder} autoComplete="name" maxLength={50} className={FIELD} data-testid="survey-name" />
                </label>
                <label className="block">
                  <span className="block t-label-1 font-semibold text-labelNeutral mb-[8px]">{C.phone4Label}</span>
                  <input value={phone4} onChange={(e) => { setPhone4(e.target.value.replace(/\D/g, "").slice(0, 4)); setError(null); }} placeholder={C.phone4Placeholder} inputMode="numeric" maxLength={4} className={FIELD} data-testid="survey-phone4" />
                </label>
                <p className="t-caption-1 text-labelAlt">{C.identifyNote}</p>
                {identified && (
                  <div className={`${CARD} ${error && !agreed ? "border-negative" : ""}`} data-testid="survey-consent">
                    <label className="flex items-start gap-[12px] cursor-pointer">
                      <input type="checkbox" checked={agreed} onChange={(e) => { setAgreed(e.target.checked); if (e.target.checked) setError(null); }} className="w-[20px] h-[20px] mt-[1px] accent-primary cursor-pointer flex-none rounded" data-testid="survey-consent-check" />
                      <span className="t-body-2 font-semibold text-label">{C.consentTitle} <span className="text-negative">(이름·뒤 4자리를 남길 때 필수)</span></span>
                    </label>
                    <dl className="mt-[10px] ml-[32px] grid gap-[3px] t-label-1-reading text-labelAlt">
                      <div><dt className="inline font-semibold text-labelNeutral">수집 항목: </dt><dd className="inline">{C.consentCollect}</dd></div>
                      <div><dt className="inline font-semibold text-labelNeutral">이용 목적: </dt><dd className="inline">{C.consentPurpose}</dd></div>
                      <div><dt className="inline font-semibold text-labelNeutral">보관 기간: </dt><dd className="inline">{C.consentRetention}</dd></div>
                      <div><dt className="inline font-semibold text-labelNeutral">거부 시: </dt><dd className="inline">{C.consentRefuse}</dd></div>
                    </dl>
                    <p className="mt-[8px] ml-[32px] t-caption-1 text-labelAlt"><ConsentMore text={C.consentMore} /></p>
                  </div>
                )}
              </div>
            )}
            {error && <p role="alert" className="mt-[16px] px-[14px] py-[10px] bg-[rgba(255,66,66,.08)] rounded-[12px] t-label-1-reading text-negativeFg">{error}</p>}
            <button type="submit" disabled={submitting || (identified && !agreed)} className={`${BIG} mt-[26px]`} data-testid="survey-submit">{submitting ? C.submittingLabel : C.submitLabel}</button>
            <p className="mt-[10px] text-center t-caption-1 text-labelAlt text-pretty"><Txt v={C.submitNote} /></p>
          </form>
        </main>
      </div>
    );
  }

  /* ---------- 질문 화면 ---------- */
  const cur = q!;
  const canProceed = valid(cur);
  const full = cur.type === "rank" ? list.length >= (cur.ranks ?? 1) : cur.type === "multi" ? !!cur.max && list.length >= cur.max : false;
  return (
    <div className="min-h-screen bg-white flex flex-col text-label">
      <TopBar C={C} step={step} total={total} />
      <main className="flex-1 w-full max-w-[640px] mx-auto px-[20px] pt-[24px] pb-[48px] md:pt-[40px]" data-testid="survey-form" data-step={cur.key}>
        <button type="button" onClick={() => go(step - 1)} className={PILL} aria-label={C.prevLabel}><Arrow />{C.prevLabel}</button>
        <div key={cur.key} className="anim-up mt-[22px]">
          <p className="t-label-1 font-bold tracking-[.06em] text-primary">{cur.part} <span className="text-labelAlt font-medium">· {cur.no}</span></p>
          <h1 className="mt-[8px] t-title-3 md:t-title-2 text-label text-pretty">{cur.title}</h1>
          {cur.sub && <p className="mt-[10px] t-body-1-reading text-labelAlt text-pretty">{cur.sub}</p>}

          <div className="mt-[24px] grid gap-[10px]" role={cur.type === "single" ? "radiogroup" : "group"} aria-label={cur.title}>
            {cur.options.map((opt) => {
              const o = opt.value;
              const on = cur.type === "single" ? str === o : list.includes(o);
              const rank = cur.type === "rank" ? list.indexOf(o) : -1;
              const disabled = !on && full && !(cur.type === "multi" && cur.exclusive === o);
              const click = () => (cur.type === "single" ? pickSingle(o) : cur.type === "multi" ? toggleMulti(o) : toggleRank(o));
              return (
                <button key={o} type="button" role={cur.type === "single" ? "radio" : undefined} aria-checked={cur.type === "single" ? on : undefined} aria-pressed={cur.type === "single" ? undefined : on} disabled={disabled} onClick={click} className={`${OPT} ${on ? OPT_ON : OPT_OFF} ${disabled ? "opacity-40" : ""}`} data-testid={`survey-opt-${o}`}>
                  <span className="min-w-0">
                    <span className={`block text-[17px] font-semibold ${opt.desc ? "tracking-[.01em]" : ""}`}>{o}{opt.desc && o === OTHER ? <span className="ml-[6px] text-[14px] font-normal text-labelAlt">({opt.desc})</span> : null}</span>
                    {opt.desc && o !== OTHER && <span className={`block mt-[3px] text-[14px] leading-[1.5] text-pretty ${on ? "text-primary/80" : "text-labelAlt"}`}>{opt.desc}</span>}
                  </span>
                  {cur.type === "rank" ? (
                    rank >= 0 ? <span className="flex-none h-[28px] px-[12px] rounded-full text-[13px] font-bold inline-flex items-center justify-center bg-primary text-white" aria-hidden>{rank + 1}순위</span> : <span className="flex-none w-[22px] h-[22px] rounded-full border-2 border-lineNeutral bg-white" aria-hidden />
                  ) : on ? <span className="flex-none"><Check /></span> : null}
                </button>
              );
            })}
          </div>

          {otherPicked && (
            <input ref={otherInput} value={otherText} onChange={(e) => set(otherKey(cur.key), e.target.value.slice(0, 100))} placeholder={C.otherPlaceholder} maxLength={100} autoFocus className={`${FIELD} mt-[12px] ${error && !otherText.trim() ? "!border-negative" : ""}`} data-testid="survey-other" onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); next(); } }} />
          )}

          {cur.type === "rank" && <p className="mt-[14px] t-label-1 text-labelAlt">{list.length} / {cur.ranks}개 선택{list.length ? ` · ${list.map((x, i) => `${i + 1}순위 ${x}`).join(" · ")}` : ""}</p>}
          {cur.type === "multi" && cur.max && <p className="mt-[14px] t-label-1 text-labelAlt">{list.length} / 최대 {cur.max}개 선택</p>}

          {error && <p role="alert" className="mt-[16px] px-[14px] py-[10px] bg-[rgba(255,66,66,.08)] rounded-[12px] t-label-1-reading text-negativeFg">{error}</p>}

          {(cur.type !== "single" || otherPicked) && (
            <button type="button" onClick={next} disabled={!canProceed} className={`${BIG} mt-[22px]`} data-testid="survey-next">{C.nextLabel}</button>
          )}
        </div>
      </main>
    </div>
  );
}

function Arrow() {
  return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M15 18l-6-6 6-6" /></svg>;
}

function TopBar({ C, step, total, label }: { C: SurveyCopy; step?: number; total?: number; label?: string }) {
  const pct = step != null && total ? Math.round((step / (total + 1)) * 100) : step == null && total == null ? 0 : 100;
  const showBar = step != null && total;
  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur border-b border-lineAlt">
      <div className="h-[56px] md:h-[64px] flex items-center justify-between gap-[16px] px-[20px] md:px-[32px]">
        <Logo href="/" emblemClass="h-[26px] md:h-[30px]" textClass="h-[13px] md:h-[15px]" textSrc="/images/logo-text-fitcheck.png" className="gap-[10px]" />
        <div className="flex items-center gap-[14px]">
          {showBar ? <span className="t-label-1 text-labelAlt">{label ? <b className="text-label">{label}</b> : <><b className="text-label">{step}</b> / {total}</>}</span> : null}
          <Link href="/" className="t-label-1 text-labelAlt hover:text-label">{C.closeLabel}</Link>
        </div>
      </div>
      <div className="h-[3px] bg-fill" aria-hidden><div className="h-full bg-primary transition-[width] duration-300" style={{ width: `${showBar ? (label ? 92 : pct) : 0}%` }} /></div>
    </header>
  );
}
