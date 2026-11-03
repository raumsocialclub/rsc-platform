"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { InstagramButton } from "@/components/site/InstagramButton";
import { trackLead } from "@/components/site/MetaPixel";
import { STEPS, missingRequired, otherKey, type Answers, type Field } from "@/lib/apply/schema";
import { formatPhoneInput } from "@/lib/phone";
import { readUtm } from "@/lib/utm/client";

/**
 * 상담 전 고객 정보 설문 (/apply). lib/apply/schema.ts 의 STEPS 를 단계별로 그린다 — 레퍼런스처럼 「이전 / 다음」, 마지막 단계에 개인정보 동의 + 「완료」.
 * 주소의 ?ref= 는 추천인 코드에, utm_* 는 제출 시 함께 보낸다. 작성 중인 답은 브라우저(sessionStorage)에만 두고 제출 전에는 서버로 보내지 않는다.
 */
const FIELD = "w-full border border-[rgba(33,30,25,.22)] bg-white px-[14px] py-[12px] text-[16px] text-ink outline-none rounded-none focus:border-brown";
const LABEL = "block text-[14px] font-semibold mb-[8px]";
const OPT = "flex items-center gap-[8px] text-[14.5px] cursor-pointer py-[4px] pr-[14px]";
const NEXT = "border-0 cursor-pointer px-[32px] py-[14px] bg-brown text-cream text-[13.5px] tracking-[.06em] hover:bg-brownHover disabled:opacity-50 disabled:cursor-not-allowed";
const PREV = "border border-[rgba(33,30,25,.3)] bg-transparent cursor-pointer px-[24px] py-[14px] text-[13.5px] tracking-[.06em] hover:border-brown";
const STORE = "rsc_apply_draft";
const OTHER = "기타";

export function ApplyForm({ preview = false }: { preview?: boolean }) {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Answers>({});
  const [agreed, setAgreed] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const top = useRef<HTMLDivElement>(null);

  // 작성 중인 답 복원 + ?ref= 추천인 코드
  useEffect(() => {
    // 서버 렌더와 첫 화면을 맞춘 뒤(하이드레이션 후) 복원한다
    const t = setTimeout(() => {
      try {
        const raw = sessionStorage.getItem(STORE);
        if (raw) { const j = JSON.parse(raw) as { step?: number; answers?: Answers }; if (j.answers) setAnswers(j.answers); if (typeof j.step === "number") setStep(Math.min(j.step, STEPS.length - 1)); }
      } catch {}
      const ref = new URLSearchParams(window.location.search).get("ref")?.trim().slice(0, 40);
      if (ref) setAnswers((a) => (a.refCode ? a : { ...a, refCode: ref }));
    }, 0);
    return () => clearTimeout(t);
  }, []);
  useEffect(() => { try { sessionStorage.setItem(STORE, JSON.stringify({ step, answers })); } catch {} }, [step, answers]);

  const cur = STEPS[step];
  const last = step === STEPS.length - 1;
  const set = (key: string, v: string | string[]) => setAnswers((a) => ({ ...a, [key]: v }));
  const go = (n: number) => { setError(null); setStep(n); requestAnimationFrame(() => top.current?.scrollIntoView({ block: "start" })); };

  const next = () => {
    const miss = missingRequired(cur, answers);
    if (miss) { setError(`「${miss.label}」을(를) 입력해 주세요.`); return; }
    go(step + 1);
  };

  const submit = async () => {
    for (const s of STEPS) { const miss = missingRequired(s, answers); if (miss) { setError(`「${s.title} · ${miss.label}」을(를) 입력해 주세요.`); setStep(STEPS.indexOf(s)); return; } }
    if (!agreed) { setError("개인정보 수집 및 이용에 동의해 주세요."); return; }
    setSubmitting(true); setError(null);
    try {
      const res = await fetch("/api/apply", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ answers, consent: true, utm: readUtm() }) });
      const j = (await res.json().catch(() => null)) as { ok?: boolean; message?: string } | null;
      if (!res.ok || !j?.ok) throw new Error(j?.message ?? "설문을 저장하지 못했습니다. 잠시 후 다시 시도해 주세요.");
      try { sessionStorage.removeItem(STORE); } catch {}
      trackLead();
      setDone(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "설문을 저장하지 못했습니다. 잠시 후 다시 시도해 주세요.");
    } finally { setSubmitting(false); }
  };

  const filled = useMemo(() => Object.values(answers).filter((v) => (Array.isArray(v) ? v.length : String(v).trim())).length, [answers]);

  if (done) {
    return (
      <div className="w-full max-w-[640px] mx-auto py-[40px]">
        <div className="text-[11px] tracking-[.34em] text-brown mb-[36px]">THANK YOU</div>
        <h2 className="font-medium text-[clamp(30px,3.6vw,48px)] leading-[1.36] mb-[28px] text-pretty">설문이 접수되었습니다</h2>
        <p className="mb-[52px] text-[16px] leading-[1.9] text-[rgba(33,30,25,.66)] max-w-[560px] text-pretty">담당자가 남겨주신 연락처로 순차적으로 상담 연락을 드립니다. 취소나 문의는 아래 이메일 또는 전화(02-538-3366)로 알려 주세요.</p>
        <div className="flex gap-[12px] flex-wrap">
          <Link href="/" className="inline-flex items-center px-[34px] py-[16px] bg-brown text-cream text-[13.5px] hover:text-cream">홈으로 돌아가기</Link>
          <InstagramButton shape="square" />
        </div>
      </div>
    );
  }

  return (
    <div ref={top} className="w-full max-w-[640px] mx-auto scroll-mt-[20px]">
      {preview && <div className="mb-[20px] px-[14px] py-[10px] bg-[#fff7e3] border border-[#e0b96a] text-[13px] text-[#6b4a00]">관리자 미리보기 — 지금은 설문이 닫혀 있어 방문자에게는 안내 문구만 보입니다. 일반 설정 → 상담 신청 · 광고 측정 → 「상담 전 설문(/apply) 열기」로 엽니다.</div>}
      <div className="text-[11px] tracking-[.34em] text-[rgba(33,30,25,.5)] mb-[18px]">RSC PRE-CONSULTATION · {step + 1} / {STEPS.length}</div>
      <div className="flex gap-[4px] mb-[28px]" aria-hidden>
        {STEPS.map((s, i) => <span key={s.key} className={`h-[3px] flex-1 ${i <= step ? "bg-brown" : "bg-[rgba(33,30,25,.12)]"}`} />)}
      </div>
      <div className="bg-white border border-[rgba(33,30,25,.1)] px-[22px] py-[26px] md:px-[34px] md:py-[34px]">
        <h1 className="font-medium text-[24px] leading-[1.3] mb-[22px] pb-[14px] border-b border-[rgba(33,30,25,.12)]">{cur.title}</h1>
        {cur.note && <p className="mb-[22px] px-[14px] py-[12px] bg-[#f4f6fa] text-[13.5px] leading-[1.7] text-[rgba(33,30,25,.75)] text-pretty">{cur.note}</p>}
        <div className="grid gap-[24px]">
          {cur.fields.map((f) => <FieldView key={f.key} f={f} answers={answers} set={set} />)}
        </div>

        {last && (
          <div className="mt-[30px] border border-[rgba(33,30,25,.16)] bg-[rgba(255,255,255,.35)] p-[18px]">
            <label className="flex items-start gap-[14px] cursor-pointer">
              <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} className="w-[17px] h-[17px] mt-[3px] accent-brown cursor-pointer flex-none" />
              <span className="text-[14px] leading-[1.7] text-ink font-medium">개인정보 수집 및 이용에 동의합니다. <span className="text-brown">(필수)</span></span>
            </label>
            <dl className="mt-[12px] ml-[31px] grid gap-[4px] text-[13px] leading-[1.7] text-[rgba(33,30,25,.68)]">
              <div><dt className="inline font-medium text-ink">수집 항목: </dt><dd className="inline">이름·성별·생년월일·휴대폰(필수), 이메일·추천인 코드·가입 경로·MBTI·키·체중·결혼여부·거주지역·본가·주량, 학력, 직업·소득·직장, 자산·차량, 가족관계, 이상형 조건·기피사항, 연애성향 답변(선택) · 광고 링크로 들어온 경우 광고 유입 정보(utm 값)</dd></div>
              <div><dt className="inline font-medium text-ink">이용 목적: </dt><dd className="inline">가입 상담의 진행과 일정 조율, 상담 전 프로필 확인, 문의 응대</dd></div>
              <div><dt className="inline font-medium text-ink">보관 기간: </dt><dd className="inline">접수일로부터 최대 180일, 이후 자동 삭제 (요청 시 그 전에도 삭제)</dd></div>
              <div><dt className="inline font-medium text-ink">거부 시: </dt><dd className="inline">필수 항목 동의를 거부하면 설문이 접수되지 않습니다. 선택 항목은 비워 두어도 됩니다.</dd></div>
            </dl>
            <p className="mt-[10px] ml-[31px] text-[12.5px] leading-[1.7] text-[rgba(33,30,25,.55)]">* 개인정보 및 상담내용은 철저히 보안이 유지됩니다. 자세한 내용은 <Link href="/privacy" target="_blank" className="underline text-brown">개인정보처리방침</Link>을 확인해 주세요.</p>
          </div>
        )}

        {error && <p className="mt-[18px] text-[13px] text-error">{error}</p>}

        <div className="mt-[30px] flex items-center justify-between gap-[12px] pt-[20px] border-t border-[rgba(33,30,25,.12)]">
          <button type="button" onClick={() => go(step - 1)} disabled={step === 0} className={`${PREV} disabled:opacity-40 disabled:cursor-not-allowed`}>이전</button>
          <div className="flex gap-[8px]">
            {!last && <button type="button" onClick={next} className={NEXT}>다음</button>}
            {last && <button type="button" onClick={() => void submit()} disabled={submitting} className={NEXT}>{submitting ? "접수 중…" : "완료"}</button>}
          </div>
        </div>
      </div>
      <p className="mt-[14px] text-center text-[12.5px] text-[rgba(33,30,25,.45)]">작성 중인 내용은 이 브라우저에만 임시 저장되며 「완료」를 누르기 전에는 전송되지 않습니다 · 입력한 항목 {filled}개</p>
    </div>
  );
}

function FieldView({ f, answers, set }: { f: Field; answers: Answers; set: (k: string, v: string | string[]) => void }) {
  const v = answers[f.key];
  const s = Array.isArray(v) ? "" : String(v ?? "");
  const list = Array.isArray(v) ? v : [];
  const other = String(answers[otherKey(f.key)] ?? "");
  const showOther = f.other && (Array.isArray(v) ? list.includes(OTHER) : s === OTHER);
  const wrap = f.indent ? "pl-[14px] border-l-2 border-[rgba(33,30,25,.1)]" : "";
  const label = <span className={LABEL}>{f.label}{f.required && <span className="text-brown"> *</span>}</span>;
  const hint = f.hint && <span className={`block mt-[8px] text-[12.5px] leading-[1.6] ${f.hint.startsWith("*") ? "text-[#b3261e]" : "text-[rgba(33,30,25,.55)]"}`}>{f.hint}</span>;

  if (f.type === "radio" || f.type === "checks") {
    const opts = [...(f.options ?? []), ...(f.other ? [OTHER] : [])];
    const checked = (o: string) => (f.type === "checks" ? list.includes(o) : s === o);
    const toggle = (o: string) => {
      if (f.type === "checks") set(f.key, checked(o) ? list.filter((x) => x !== o) : [...list, o]);
      else set(f.key, s === o ? "" : o);
    };
    return (
      <div className={wrap}>
        {label}
        <div className="flex flex-wrap gap-x-[6px] gap-y-[2px]">
          {opts.map((o) => (
            <label key={o} className={OPT}>
              <input type={f.type === "checks" ? "checkbox" : "radio"} name={f.key} checked={checked(o)} onChange={() => toggle(o)} className="w-[16px] h-[16px] accent-brown cursor-pointer flex-none" />
              <span>{o}</span>
            </label>
          ))}
        </div>
        {showOther && <input value={other} onChange={(e) => set(otherKey(f.key), e.target.value)} placeholder="직접 입력" maxLength={200} className={`${FIELD} mt-[8px]`} />}
        {hint}
      </div>
    );
  }
  if (f.type === "select") {
    const opts = [...(f.options ?? []), ...(f.other ? [OTHER] : [])];
    return (
      <div className={wrap}>
        {label}
        <select value={s} onChange={(e) => set(f.key, e.target.value)} className={FIELD}>
          <option value="">{f.label.replace(/^.*· /, "")}을(를) 선택해 주세요.</option>
          {opts.map((o) => <option key={o} value={o}>{o}</option>)}
        </select>
        {showOther && <input value={other} onChange={(e) => set(otherKey(f.key), e.target.value)} placeholder="직접 입력" maxLength={200} className={`${FIELD} mt-[8px]`} />}
        {hint}
      </div>
    );
  }
  if (f.type === "siblings") {
    // "1남 2녀 중 1째" 를 한 문자열로 저장
    const m = s.match(/(\d*)남\s*(\d*)녀\s*중\s*(\d*)째/);
    const parts = [m?.[1] ?? "", m?.[2] ?? "", m?.[3] ?? ""];
    const setPart = (i: number, val: string) => { const p = [...parts]; p[i] = val.replace(/\D/g, "").slice(0, 2); set(f.key, p.some(Boolean) ? `${p[0]}남 ${p[1]}녀 중 ${p[2]}째` : ""); };
    const box = "w-[64px] border border-[rgba(33,30,25,.22)] bg-white px-[8px] py-[10px] text-[16px] text-center outline-none rounded-none focus:border-brown";
    return (
      <div className={wrap}>
        {label}
        <div className="flex items-center gap-[8px] text-[14.5px]">
          <input inputMode="numeric" value={parts[0]} onChange={(e) => setPart(0, e.target.value)} className={box} /> 남
          <input inputMode="numeric" value={parts[1]} onChange={(e) => setPart(1, e.target.value)} className={box} /> 녀 중
          <input inputMode="numeric" value={parts[2]} onChange={(e) => setPart(2, e.target.value)} className={box} /> 째
        </div>
        {hint}
      </div>
    );
  }
  if (f.type === "textarea") {
    return <div className={wrap}>{label}<textarea rows={4} value={s} onChange={(e) => set(f.key, e.target.value)} placeholder={f.placeholder} maxLength={f.max ?? 2000} className={`${FIELD} resize-y`} />{hint}</div>;
  }
  const inputType = f.type === "number" ? "text" : f.type === "tel" ? "tel" : f.type;
  const onChange = (raw: string) => {
    if (f.type === "tel") return set(f.key, formatPhoneInput(raw));
    if (f.type === "number") return set(f.key, raw.replace(/[^\d.]/g, "").slice(0, 15));
    set(f.key, raw);
  };
  return (
    <div className={wrap}>
      {label}
      <div className="flex items-center gap-[8px]">
        <input type={inputType} inputMode={f.type === "number" || f.type === "tel" ? "numeric" : undefined} value={s} onChange={(e) => onChange(e.target.value)} placeholder={f.placeholder} maxLength={f.max ?? 200} autoComplete={f.key === "name" ? "name" : f.key === "phone" ? "tel" : f.key === "email" ? "email" : undefined} className={FIELD} />
        {f.unit && <span className="text-[14px] text-[rgba(33,30,25,.6)] flex-none">{f.unit}</span>}
      </div>
      {hint}
    </div>
  );
}
