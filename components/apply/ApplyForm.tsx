"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { InstagramButton } from "@/components/site/InstagramButton";
import { STEPS, missingRequired, otherKey, type Answers, type Field } from "@/lib/apply/schema";
import { CHIP, CHIP_OFF, CHIP_ON, FIELD_LABEL, INPUT, INPUT_ERR, TEXTAREA, btn } from "@/components/ui/ds";
import { formatPhoneInput } from "@/lib/phone";

/**
 * 상담 전 고객 정보 설문 (/apply/<토큰>). lib/apply/schema.ts 의 STEPS 를 단계별로 그린다 — 레퍼런스처럼 「이전 / 다음」, 마지막 단계에 개인정보 동의 + 「완료」.
 * 관리자가 만든 공용 비밀 링크(token)로만 열린다. 로그인 없이 누구나 작성. 첫 단계 맨 위에서 개인정보 수집·이용 동의(상담 신청 화면과 같은 모양)를 받아야 다음으로 넘어간다. 작성 중인 답은 브라우저(sessionStorage)에만 두고 제출 전에는 서버로 보내지 않는다.
 *
 * 모바일 입력 최적화:
 *  - 선택지는 44px 이상 터치 버튼(칩). 좁은 화면은 2열, 넓은 화면은 흐름 배치. 글자 16px 이상이라 iOS 에서 확대되지 않는다
 *  - 「이전 / 다음 / 완료」는 화면 아래 고정 바(홈 바 영역 safe-area 반영) — 긴 단계에서 스크롤해 찾지 않아도 된다
 *  - 필수 칸이 비면 그 칸으로 스크롤하고 빨간 테두리 + 포커스. 숫자·전화 칸은 숫자 키패드, 글 칸은 「다음」 키
 *  - 단계가 바뀌면 맨 위로 스크롤
 */
const FIELD = INPUT;
const FIELD_ERR = INPUT_ERR;
const LABEL = FIELD_LABEL;
const NEXT = btn("solid", "lg");
const PREV = btn("assistive", "lg");
const STORE = "rsc_apply_draft";  // + 토큰 앞 8자 — 링크마다 따로 임시 저장
const OTHER = "기타";
/** 선택지 + 「기타」(other) — 선택지에 이미 「기타」가 있으면 중복 추가하지 않는다 */
const optionsOf = (f: Field) => (f.other && !(f.options ?? []).includes(OTHER) ? [...(f.options ?? []), OTHER] : f.options ?? []);
const fid = (key: string) => `apply-f-${key}`;

export function ApplyForm({ token }: { token: string }) {
  const store = `${STORE}:${token.slice(0, 8)}`;
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Answers>({});
  const [agreed, setAgreed] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [invalid, setInvalid] = useState<string | null>(null); // 비어 있는 필수 칸 key
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const top = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // 서버 렌더와 첫 화면을 맞춘 뒤(하이드레이션 후) 복원한다
    const t = setTimeout(() => {
      try {
        const raw = sessionStorage.getItem(store);
        if (raw) { const j = JSON.parse(raw) as { step?: number; answers?: Answers }; if (j.answers) setAnswers(j.answers); if (typeof j.step === "number") setStep(Math.min(j.step, STEPS.length - 1)); }
      } catch {}
    }, 0);
    return () => clearTimeout(t);
  }, [store]);
  useEffect(() => { try { sessionStorage.setItem(store, JSON.stringify({ step, answers })); } catch {} }, [store, step, answers]);

  const cur = STEPS[step];
  const last = step === STEPS.length - 1;
  const set = (key: string, v: string | string[]) => { setAnswers((a) => ({ ...a, [key]: v })); if (invalid === key) { setInvalid(null); setError(null); } };
  const go = (n: number) => { setError(null); setInvalid(null); setStep(n); requestAnimationFrame(() => top.current?.scrollIntoView({ block: "start" })); };
  const focusField = (key: string) => {
    setInvalid(key);
    requestAnimationFrame(() => {
      const el = document.getElementById(fid(key));
      el?.scrollIntoView({ block: "center", behavior: "smooth" });
      (el?.querySelector("input,select,textarea") as HTMLElement | null)?.focus?.({ preventScroll: true });
    });
  };

  const requireConsent = () => {
    if (agreed) return true;
    setError("개인정보 수집·이용에 동의해 주세요."); setInvalid("consent");
    document.getElementById("apply-consent")?.scrollIntoView({ block: "center", behavior: "smooth" });
    return false;
  };
  const next = () => {
    if (step === 0 && !requireConsent()) return;
    const miss = missingRequired(cur, answers);
    if (miss) { setError(`「${miss.label}」을(를) 입력해 주세요.`); focusField(miss.key); return; }
    go(step + 1);
  };

  const submit = async () => {
    for (const s of STEPS) {
      const miss = missingRequired(s, answers);
      if (miss) { setStep(STEPS.indexOf(s)); setError(`「${s.title} · ${miss.label}」을(를) 입력해 주세요.`); focusField(miss.key); return; }
    }
    if (!agreed) { setStep(0); requireConsent(); return; }
    setSubmitting(true); setError(null);
    try {
      const res = await fetch("/api/apply", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ token, answers, consent: true }) });
      const j = (await res.json().catch(() => null)) as { ok?: boolean; message?: string } | null;
      if (!res.ok || !j?.ok) throw new Error(j?.message ?? "설문을 저장하지 못했습니다. 잠시 후 다시 시도해 주세요.");
      try { sessionStorage.removeItem(store); } catch {}
      setDone(true);
      window.scrollTo({ top: 0 });
    } catch (e) {
      setError(e instanceof Error ? e.message : "설문을 저장하지 못했습니다. 잠시 후 다시 시도해 주세요.");
    } finally { setSubmitting(false); }
  };

  const filled = useMemo(() => Object.values(answers).filter((v) => (Array.isArray(v) ? v.length : String(v).trim())).length, [answers]);

  if (done) {
    return (
      <div className="w-full max-w-[640px] mx-auto py-[40px]">
        <div className="w-[56px] h-[56px] rounded-full bg-[rgba(0,191,64,.12)] text-positiveFg flex items-center justify-center mb-[20px]">
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12l5 5L20 7" /></svg>
        </div>
        <h2 className="t-title-2 text-label mb-[12px] text-pretty">설문이 접수되었습니다</h2>
        <p className="mb-[28px] t-body-1-reading text-labelAlt max-w-[560px] text-pretty">답변해 주셔서 감사합니다. 담당자가 내용을 확인한 뒤 대면 상담 일정을 안내드립니다. 문의는 전화(02-6925-4786)로 알려 주세요.</p>
        <div className="flex gap-[12px] flex-wrap">
          <Link href="/" className={btn("solid", "lg")}>홈으로 돌아가기</Link>
          <InstagramButton />
        </div>
      </div>
    );
  }

  return (
    <div ref={top} className="w-full max-w-[640px] mx-auto scroll-mt-[12px] pb-[96px] md:pb-0 text-label">
      <div className="flex items-baseline justify-between gap-[12px] mb-[12px]">
        <div className="t-label-1 font-semibold text-primary">상담 전 설문</div>
        <div className="t-label-2 text-labelAlt"><b className="text-label">{step + 1}</b> / {STEPS.length} 단계</div>
      </div>
      <div className="flex gap-[4px] mb-[20px]" aria-hidden>
        {STEPS.map((s, i) => <span key={s.key} className={`h-[4px] flex-1 rounded-full ${i <= step ? "bg-primary" : "bg-fillStrong"}`} />)}
      </div>
      <div className="bg-white border border-lineAlt rounded-ds px-[18px] py-[22px] sm:px-[26px] md:px-[34px] md:py-[34px]">
        <h1 className="t-title-3 text-label mb-[18px] pb-[14px] border-b border-lineAlt">{cur.title}</h1>
        {cur.note && <p className="mb-[20px] px-[14px] py-[12px] bg-sand rounded-ds-sm t-label-1-reading text-labelNeutral text-pretty">{cur.note}</p>}
        {step === 0 && (
          <>
            <div id="apply-consent" className={`mb-[24px] border p-[18px] rounded-ds ${invalid === "consent" ? "border-negative bg-[rgba(255,66,66,.04)]" : "border-lineNeutral bg-white"}`}>
              <label className="flex items-start gap-[14px] cursor-pointer min-h-[44px]">
                <input type="checkbox" checked={agreed} onChange={(e) => { setAgreed(e.target.checked); if (e.target.checked && invalid === "consent") { setInvalid(null); setError(null); } }} className="w-[20px] h-[20px] mt-[2px] accent-primary cursor-pointer flex-none" />
                <span className="t-body-2 font-semibold text-label">개인정보 수집·이용 동의 <span className="text-negative">(필수)</span></span>
              </label>
              <dl className="mt-[12px] ml-[34px] grid gap-[4px] t-label-1-reading text-labelAlt">
                <div><dt className="inline font-medium text-label">처리하는 회사: </dt><dd className="inline">주식회사 레벤스토리 (라움소셜클럽 운영)</dd></div>
                <div><dt className="inline font-medium text-label">수집 항목: </dt><dd className="inline">이름, 성별, 생년월일, 휴대폰 번호(필수) · 이메일, 추천인 코드, 가입 경로, MBTI, 키·체중, 결혼 여부, 거주지역·본가, 주량, 학력, 직업·소득·직장, 자산·차량, 가족관계, 이상형 조건·우선순위·기피사항, 연애성향 답변(선택)</dd></div>
                <div><dt className="inline font-medium text-label">이용 목적: </dt><dd className="inline">대면 상담의 준비와 일정 조율, 상담 전 기본 정보·희망 조건 확인, 문의 응대</dd></div>
                <div><dt className="inline font-medium text-label">보관 기간: </dt><dd className="inline">접수일로부터 최대 180일, 이후 자동 삭제 (요청 시 그 전에도 삭제)</dd></div>
                <div><dt className="inline font-medium text-label">거부 시: </dt><dd className="inline">필수 항목 동의를 거부하면 설문이 접수되지 않습니다. 선택 항목은 비워 두어도 됩니다.</dd></div>
              </dl>
              <p className="mt-[10px] ml-[34px] t-caption-1 text-labelAlt">
                자세한 내용은 <Link href="/privacy" target="_blank" className="underline text-primary">개인정보처리방침</Link>에서 확인하실 수 있습니다. 사이트 이용 조건은 <Link href="/terms" target="_blank" className="underline text-primary">이용약관</Link>을 참고해 주세요. 개인정보 및 상담 내용은 철저히 보안이 유지됩니다.
              </p>
            </div>
            <p className="mb-[20px] t-label-1-reading text-labelAlt"><span className="text-negative">*</span> 표시만 필수입니다. 나머지는 비워 두어도 됩니다.</p>
          </>
        )}
        <div className="grid gap-[22px]">
          {cur.fields.map((f) => <FieldView key={f.key} f={f} answers={answers} set={set} invalid={invalid === f.key} />)}
        </div>

        {error && <p role="alert" className="mt-[18px] px-[14px] py-[10px] bg-[rgba(255,66,66,.08)] rounded-ds-sm t-label-1-reading text-negativeFg">{error}</p>}

        {/* 데스크톱: 카드 안 버튼. 모바일: 아래 고정 바 */}
        <div className="hidden md:flex mt-[30px] items-center justify-between gap-[12px] pt-[20px] border-t border-lineAlt">
          <button type="button" onClick={() => go(step - 1)} disabled={step === 0} className={PREV}>이전</button>
          {!last ? <button type="button" onClick={next} className={NEXT}>다음</button> : <button type="button" onClick={() => void submit()} disabled={submitting} className={NEXT}>{submitting ? "접수 중…" : "완료"}</button>}
        </div>
      </div>
      <p className="mt-[12px] text-center t-caption-1 text-labelAssist">작성 중인 내용은 이 브라우저에만 임시 저장되며 「완료」를 누르기 전에는 전송되지 않습니다 · 입력한 항목 {filled}개</p>

      <div className="md:hidden fixed inset-x-0 bottom-0 z-30 bg-white/95 backdrop-blur border-t border-lineAlt px-[16px] pt-[10px]" style={{ paddingBottom: "calc(10px + env(safe-area-inset-bottom))" }}>
        <div className="max-w-[640px] mx-auto flex items-center gap-[10px]">
          <button type="button" onClick={() => go(step - 1)} disabled={step === 0} className={`${PREV} flex-none`}>이전</button>
          <div className="flex-1 text-center t-caption-1 text-labelAlt">{step + 1} / {STEPS.length} · {cur.title}</div>
          {!last ? <button type="button" onClick={next} className={`${NEXT} flex-none`}>다음</button> : <button type="button" onClick={() => void submit()} disabled={submitting} className={`${NEXT} flex-none`}>{submitting ? "접수 중…" : "완료"}</button>}
        </div>
      </div>
    </div>
  );
}

function FieldView({ f, answers, set, invalid }: { f: Field; answers: Answers; set: (k: string, v: string | string[]) => void; invalid: boolean }) {
  const v = answers[f.key];
  const s = Array.isArray(v) ? "" : String(v ?? "");
  const list = Array.isArray(v) ? v : [];
  const other = String(answers[otherKey(f.key)] ?? "");
  const showOther = f.other && (Array.isArray(v) ? list.includes(OTHER) : s === OTHER);
  const wrap = `scroll-mt-[80px] ${f.indent ? "pl-[12px] border-l-2 border-lineAlt" : ""}`;
  const err = invalid ? FIELD_ERR : "";
  const label = <span className={LABEL}>{f.label}{f.required && <span className="text-negative"> *</span>}</span>;
  const hint = f.hint && <span className={`block mt-[8px] t-caption-1 ${f.hint.startsWith("*") ? "text-cautionaryFg" : "text-labelAlt"}`}>{f.hint}</span>;
  const otherInput = showOther && <input value={other} onChange={(e) => set(otherKey(f.key), e.target.value)} placeholder="직접 입력" maxLength={200} enterKeyHint="next" className={`${FIELD} mt-[10px]`} />;

  if (f.type === "radio" || f.type === "checks") {
    const opts = optionsOf(f);
    const multi = f.type === "checks";
    const checked = (o: string) => (multi ? list.includes(o) : s === o);
    const toggle = (o: string) => {
      if (multi) set(f.key, checked(o) ? list.filter((x) => x !== o) : [...list, o]);
      else set(f.key, s === o ? "" : o);
    };
    const long = opts.some((o) => o.length > 14); // 긴 선택지는 한 줄씩
    return (
      <div id={fid(f.key)} className={wrap} role={multi ? "group" : "radiogroup"} aria-label={f.label}>
        {label}
        {multi && <span className="block -mt-[6px] mb-[8px] text-[12px] text-labelAlt">여러 개 선택할 수 있습니다</span>}
        <div className={`grid gap-[8px] ${long ? "grid-cols-1" : "grid-cols-2 sm:flex sm:flex-wrap"} ${invalid ? "p-[6px] -m-[6px] rounded-[8px] ring-1 ring-negative" : ""}`}>
          {opts.map((o) => (
            <label key={o} className={`${CHIP} ${checked(o) ? CHIP_ON : CHIP_OFF}`}>
              <input type={multi ? "checkbox" : "radio"} name={f.key} checked={checked(o)} onChange={() => toggle(o)} className="sr-only" />
              <span>{o}</span>
            </label>
          ))}
        </div>
        {otherInput}
        {hint}
      </div>
    );
  }
  if (f.type === "select") {
    const opts = optionsOf(f);
    return (
      <div id={fid(f.key)} className={wrap}>
        {label}
        <div className="relative">
          <select value={s} onChange={(e) => set(f.key, e.target.value)} className={`${FIELD} ${err} pr-[40px]`}>
            <option value="">{f.label.replace(/^.*· /, "")}을(를) 선택해 주세요.</option>
            {opts.map((o) => <option key={o} value={o}>{o}</option>)}
          </select>
          <span aria-hidden className="pointer-events-none absolute right-[14px] top-1/2 -translate-y-1/2 text-[12px] text-labelAlt">▼</span>
        </div>
        {otherInput}
        {hint}
      </div>
    );
  }
  if (f.type === "siblings") {
    // "1남 2녀 중 1째" 를 한 문자열로 저장
    const m = s.match(/(\d*)남\s*(\d*)녀\s*중\s*(\d*)째/);
    const parts = [m?.[1] ?? "", m?.[2] ?? "", m?.[3] ?? ""];
    const setPart = (i: number, val: string) => { const p = [...parts]; p[i] = val.replace(/\D/g, "").slice(0, 2); set(f.key, p.some(Boolean) ? `${p[0]}남 ${p[1]}녀 중 ${p[2]}째` : ""); };
    const box = "w-[64px] border border-lineNeutral bg-white px-[8px] py-[12px] text-[16px] text-center outline-none rounded-[6px] focus:border-primary";
    return (
      <div id={fid(f.key)} className={wrap}>
        {label}
        <div className="flex items-center flex-wrap gap-[8px] text-[15px]">
          <input inputMode="numeric" enterKeyHint="next" aria-label="남자 형제 수" value={parts[0]} onChange={(e) => setPart(0, e.target.value)} className={box} /> 남
          <input inputMode="numeric" enterKeyHint="next" aria-label="여자 형제 수" value={parts[1]} onChange={(e) => setPart(1, e.target.value)} className={box} /> 녀 중
          <input inputMode="numeric" enterKeyHint="next" aria-label="몇째" value={parts[2]} onChange={(e) => setPart(2, e.target.value)} className={box} /> 째
        </div>
        {hint}
      </div>
    );
  }
  if (f.type === "textarea") {
    return <div id={fid(f.key)} className={wrap}>{label}<textarea rows={4} value={s} onChange={(e) => set(f.key, e.target.value)} placeholder={f.placeholder} maxLength={f.max ?? 2000} className={`${TEXTAREA} ${err}`} />{hint}</div>;
  }
  const inputType = f.type === "number" ? "text" : f.type === "tel" ? "tel" : f.type;
  const onChange = (raw: string) => {
    if (f.type === "tel") return set(f.key, formatPhoneInput(raw));
    if (f.type === "number") return set(f.key, raw.replace(/[^\d.]/g, "").slice(0, 15));
    set(f.key, raw);
  };
  const auto = f.key === "name" ? "name" : f.key === "phone" ? "tel" : f.key === "email" ? "email" : f.key === "birth" ? "bday" : "off";
  return (
    <div id={fid(f.key)} className={wrap}>
      {label}
      <div className="flex items-center gap-[8px]">
        <input
          type={inputType}
          inputMode={f.type === "number" || f.type === "tel" ? "numeric" : f.type === "email" ? "email" : undefined}
          enterKeyHint="next"
          value={s}
          onChange={(e) => onChange(e.target.value)}
          placeholder={f.placeholder}
          maxLength={f.max ?? 200}
          autoComplete={auto}
          min={f.type === "date" ? "1940-01-01" : undefined}
          max={f.type === "date" ? new Date().toISOString().slice(0, 10) : undefined}
          className={`${FIELD} ${err}`}
        />
        {f.unit && <span className="text-[15px] text-labelAlt flex-none">{f.unit}</span>}
      </div>
      {hint}
    </div>
  );
}
