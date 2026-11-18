"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { CopyButton } from "./CopyButton";
import { BTN_PRIMARY, BTN_SECONDARY, FIELD } from "./ui";
import { SURVEY_DEFS } from "@/lib/survey/definitions";

export type IssuedSurvey = { id: string; token: string; url: string; closesAt: string | null };

/** 새 설문 링크 만들기. 종류(코드 정의) · 이름(용도) · 메모 · 마감일(비우면 없음) */
export function SurveyCreateForm() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [kind, setKind] = useState(SURVEY_DEFS[0].kind);
  const [name, setName] = useState(SURVEY_DEFS[0].name);
  const [memo, setMemo] = useState("");
  const [days, setDays] = useState("14");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [issued, setIssued] = useState<IssuedSurvey | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true); setErr(null);
    try {
      const d = days.trim() ? Math.max(1, Math.min(365, Number(days) || 14)) : null;
      const res = await fetch("/api/admin/surveys", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ kind, name, memo, days: d }) });
      const j = (await res.json().catch(() => null)) as { ok?: boolean; message?: string; survey?: IssuedSurvey } | null;
      if (!j?.ok || !j.survey) throw new Error(j?.message ?? "설문 링크를 만들지 못했습니다.");
      setIssued(j.survey);
      router.refresh();
    } catch (e2) {
      setErr(e2 instanceof Error ? e2.message : "설문 링크를 만들지 못했습니다.");
    } finally { setBusy(false); }
  };

  if (!open) return <button type="button" onClick={() => setOpen(true)} className={BTN_PRIMARY} data-testid="survey-create-open">+ 설문 링크 만들기</button>;
  return (
    <form onSubmit={submit} className="bg-white border border-[rgba(112,115,124,.08)] p-[20px] w-full max-w-[720px]">
      <div className="text-[12px] tracking-[.02em] text-[rgba(55,56,60,.61)] mb-[14px]">새 설문 링크</div>
      <div className="grid gap-[10px] md:grid-cols-[1.4fr_2fr_2fr_1fr] mb-[12px]">
        <select value={kind} onChange={(e) => { setKind(e.target.value); const d = SURVEY_DEFS.find((x) => x.kind === e.target.value); if (d) setName(d.name); }} className={FIELD} aria-label="설문 종류">
          {SURVEY_DEFS.map((d) => <option key={d.kind} value={d.kind}>{d.name}</option>)}
        </select>
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="설문 이름 (예: 2027 수요조사 · 11월 발송)" required className={FIELD} />
        <input value={memo} onChange={(e) => setMemo(e.target.value)} placeholder="메모 (선택)" className={FIELD} />
        <input value={days} onChange={(e) => setDays(e.target.value)} inputMode="numeric" aria-label="응답 기간(일)" placeholder="응답 기간(일)" className={FIELD} />
      </div>
      <p className="text-[12px] text-[rgba(55,56,60,.61)] mb-[12px]">응답 기간을 비우면 마감일 없이 열려 있고, 목록에서 직접 마감할 수 있습니다. 문항은 코드에 정의되어 있어 여기서는 바꾸지 않습니다.</p>
      {err && <div className="text-[13px] text-negativeFg mb-[10px]">{err}</div>}
      {issued && (
        <div className="bg-white border border-[rgba(112,115,124,.16)] p-[16px] mb-[12px]">
          <div className="text-[11px] tracking-[.02em] text-primaryStrong mb-[8px]">설문 링크를 만들었습니다</div>
          <div className="flex items-center justify-between gap-[10px]">
            <span className="text-[13px] break-all">{issued.url}</span>
            <CopyButton text={issued.url} label="링크 복사" />
          </div>
          <div className="text-[12px] text-[rgba(55,56,60,.61)] mt-[8px]">목록의 「문자 문구 복사」로 발송 문구에 넣어 보내세요. 받은 분은 로그인 없이 바로 답합니다. {issued.closesAt ? `마감 ${issued.closesAt.slice(0, 10)}.` : "마감일 없음."}</div>
        </div>
      )}
      <div className="flex gap-[8px]">
        <button type="submit" disabled={busy} className={BTN_PRIMARY}>{busy ? "만드는 중…" : "링크 만들기"}</button>
        <button type="button" onClick={() => { setOpen(false); setIssued(null); }} className={BTN_SECONDARY}>닫기</button>
      </div>
    </form>
  );
}

/** 목록·결과 화면의 마감 / 다시 열기 */
export function SurveyToggleButton({ id, closed }: { id: string; closed: boolean }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const toggle = async () => {
    if (!closed && !window.confirm("이 설문을 마감할까요? 이후로는 이 링크로 답할 수 없습니다. (이미 받은 응답은 남습니다)")) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/surveys/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ closed: !closed }) });
      const j = (await res.json().catch(() => null)) as { ok?: boolean; message?: string } | null;
      if (!j?.ok) throw new Error(j?.message ?? "저장하지 못했습니다.");
      router.refresh();
    } catch (e) {
      window.alert(e instanceof Error ? e.message : "저장하지 못했습니다.");
    } finally { setBusy(false); }
  };
  return <button type="button" onClick={toggle} disabled={busy} className={`border bg-transparent px-[10px] py-[5px] text-[12px] cursor-pointer whitespace-nowrap ${closed ? "border-[rgba(112,115,124,.22)] hover:border-primary hover:text-primaryStrong" : "border-[rgba(255,66,66,.4)] text-negativeFg hover:border-negative"}`}>{busy ? "…" : closed ? "다시 열기" : "마감"}</button>;
}
