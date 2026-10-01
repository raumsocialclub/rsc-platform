"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useRef, useState } from "react";
import { BTN_PRIMARY, BTN_SECONDARY, CARD } from "./ui";
import { addDays, fromKstIso, toKstIso } from "@/lib/programs/format";
import { CATEGORIES, SEASON_CATEGORY, SEASON_WEEKS, type FlowItem, type ProgramKind, type ProgramWithSessions } from "@/lib/programs/types";

type SessionInput = { date: string; time: string };
type FormState = {
  kind: ProgramKind;
  name: string;
  subtitle: string;
  category: string;
  place: string;
  short_desc: string;
  description: string;
  image_url: string;
  flow: FlowItem[];
  capacity: string;
  price: string;
  member_price: string;
  sessions: SessionInput[];
  is_published: boolean;
};

const LABEL = "grid gap-[6px] text-[12.5px] text-[rgba(33,30,25,.6)]";
const INPUT = "px-[14px] py-[13px] text-[14px] border border-[rgba(33,30,25,.2)] outline-none text-ink bg-white rounded-none focus:border-brown w-full min-w-0";
const INPUT_SM = "px-[12px] py-[12px] text-[13.5px] border border-[rgba(33,30,25,.2)] outline-none text-ink bg-white rounded-none focus:border-brown w-full min-w-0";
const SECTION = "text-[12px] tracking-[.2em] text-[rgba(33,30,25,.5)]";
const MAX_SIDE = 2000;

function emptyFlow(kind: ProgramKind): FlowItem[] {
  return kind === "season" ? Array.from({ length: SEASON_WEEKS }, (_, i) => ({ t: `${i + 1}주`, d: "" })) : [{ t: "", d: "" }];
}
function emptySessions(kind: ProgramKind): SessionInput[] {
  return Array.from({ length: kind === "season" ? SEASON_WEEKS : 1 }, () => ({ date: "", time: kind === "season" ? "19:30" : "19:00" }));
}

function initial(kind: ProgramKind, p?: ProgramWithSessions): FormState {
  if (!p) {
    return {
      kind,
      name: "",
      subtitle: kind === "season" ? "6-Week Season Program" : "",
      category: kind === "season" ? SEASON_CATEGORY : CATEGORIES[0],
      place: kind === "season" ? "라움 전관" : "",
      short_desc: "",
      description: "",
      image_url: "",
      flow: emptyFlow(kind),
      capacity: kind === "season" ? "24" : "20",
      price: "",
      member_price: "",
      sessions: emptySessions(kind),
      is_published: false,
    };
  }
  const live = p.sessions.filter((s) => s.status !== "cancelled").sort((a, b) => a.seq - b.seq);
  const sessions = live.map((s) => fromKstIso(s.starts_at));
  const need = p.kind === "season" ? SEASON_WEEKS : 1;
  while (sessions.length < need) sessions.push({ date: "", time: "19:00" });
  return {
    kind: p.kind,
    name: p.name,
    subtitle: p.subtitle ?? "",
    category: p.category ?? (p.kind === "season" ? SEASON_CATEGORY : CATEGORIES[0]),
    place: p.place ?? "",
    short_desc: p.short_desc ?? "",
    description: p.description ?? "",
    image_url: p.image_url ?? "",
    flow: p.flow.length ? p.flow : emptyFlow(p.kind),
    capacity: String(p.capacity),
    price: String(p.price),
    member_price: p.member_price == null ? "" : String(p.member_price),
    sessions: sessions.slice(0, need),
    is_published: p.is_published,
  };
}

/** 브라우저에서 긴 변 2000px 로 축소 후 JPEG 로 변환 (업로드 용량 절약) */
async function shrinkImage(file: File): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height));
  if (scale === 1 && file.type === "image/jpeg") return file;
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  return new Promise((resolve, reject) => canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("변환 실패"))), "image/jpeg", 0.88));
}

/**
 * 프로그램 등록/편집 폼. design/RSC Admin.dc.html PROGRAM EDIT 뷰 재현.
 * 좌: 기본 정보 + 타임라인(단일) / 주차별 일정(시즌). 우: 일정·정원·가격 + 대표 사진.
 * "임시 저장" = 비공개 저장, "게시" = 공개 저장.
 */
export function ProgramForm({ kind, program }: { kind: ProgramKind; program?: ProgramWithSessions }) {
  const router = useRouter();
  const [f, setF] = useState<FormState>(() => initial(kind, program));
  const [busy, setBusy] = useState<"save" | "publish" | "upload" | "delete" | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const isSeason = f.kind === "season";
  const set = <K extends keyof FormState>(k: K, v: FormState[K]) => setF((s) => ({ ...s, [k]: v }));

  const title = program
    ? isSeason ? "시즌 프로그램 편집" : "프로그램 편집"
    : isSeason ? "새 RAUM SOLO 시즌 등록" : "새 프로그램 등록";

  const setSession = (i: number, patch: Partial<SessionInput>) => {
    setF((s) => {
      const sessions = s.sessions.map((x, j) => (j === i ? { ...x, ...patch } : x));
      // 시즌 1주차 날짜를 정하면 나머지 주차를 7일 간격으로 자동 채움(비어 있을 때만)
      if (isSeason && i === 0 && patch.date) {
        for (let j = 1; j < sessions.length; j++) if (!sessions[j].date) sessions[j] = { ...sessions[j], date: addDays(patch.date, 7 * j), time: sessions[j].time || sessions[0].time };
      }
      return { ...s, sessions };
    });
  };

  const upload = async (file: File) => {
    setBusy("upload");
    setErr(null);
    try {
      const blob = await shrinkImage(file);
      const fd = new FormData();
      fd.append("file", blob, "image.jpg");
      const res = await fetch("/api/admin/programs/upload", { method: "POST", body: fd });
      const j = (await res.json().catch(() => null)) as { ok?: boolean; url?: string; message?: string } | null;
      if (!j?.ok || !j.url) throw new Error(j?.message ?? "업로드하지 못했습니다.");
      set("image_url", j.url);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "업로드하지 못했습니다.");
    } finally {
      setBusy(null);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const payload = useMemo(() => {
    const sessions = f.sessions.map((s) => toKstIso(s.date, s.time)).filter((x): x is string => !!x);
    return {
      kind: f.kind,
      name: f.name,
      subtitle: f.subtitle,
      category: f.category,
      place: f.place,
      short_desc: f.short_desc,
      description: f.description,
      image_url: f.image_url,
      flow: f.flow.filter((x) => x.t.trim() || x.d.trim()),
      capacity: Number(f.capacity),
      price: Number(f.price),
      member_price: f.member_price.trim() === "" ? null : Number(f.member_price),
      sessions,
    };
  }, [f]);

  const validate = (): string | null => {
    if (!f.name.trim()) return "프로그램 이름을 입력해 주세요.";
    if (!Number.isInteger(payload.capacity) || payload.capacity < 1) return "정원을 1명 이상 입력해 주세요.";
    if (f.price.trim() === "" || !Number.isInteger(payload.price) || payload.price < 0) return "판매가를 입력해 주세요.";
    if (payload.member_price != null && (!Number.isInteger(payload.member_price) || payload.member_price < 0)) return "회원가를 확인해 주세요.";
    if (payload.member_price != null && payload.member_price > payload.price) return "회원가는 판매가보다 클 수 없습니다.";
    const need = isSeason ? SEASON_WEEKS : 1;
    if (payload.sessions.length !== need) return isSeason ? `시즌 ${SEASON_WEEKS}주 일정을 모두 입력해 주세요.` : "날짜와 시작 시간을 입력해 주세요.";
    return null;
  };

  const save = async (publish: boolean) => {
    const v = validate();
    if (v) {
      setErr(v);
      return;
    }
    setBusy(publish ? "publish" : "save");
    setErr(null);
    try {
      const res = await fetch(program ? `/api/admin/programs/${program.id}` : "/api/admin/programs", {
        method: program ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...payload, is_published: publish }),
      });
      const j = (await res.json().catch(() => null)) as { ok?: boolean; message?: string; id?: string } | null;
      if (!j?.ok) throw new Error(j?.message ?? "저장하지 못했습니다.");
      router.push("/admin/programs");
      router.refresh();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "저장하지 못했습니다.");
      setBusy(null);
    }
  };

  const remove = async () => {
    if (!program || !confirm("이 프로그램을 삭제할까요? 예약이 있으면 삭제되지 않습니다.")) return;
    setBusy("delete");
    try {
      const res = await fetch(`/api/admin/programs/${program.id}`, { method: "DELETE" });
      const j = (await res.json().catch(() => null)) as { ok?: boolean; message?: string } | null;
      if (!j?.ok) throw new Error(j?.message ?? "삭제하지 못했습니다.");
      router.push("/admin/programs");
      router.refresh();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "삭제하지 못했습니다.");
      setBusy(null);
    }
  };

  const flowLabel = isSeason ? `주차별 일정 (${SEASON_WEEKS}주)` : "타임라인 (PROGRAM FLOW)";

  return (
    <form onSubmit={(e) => { e.preventDefault(); void save(true); }}>
      <Link href="/admin/programs" className="inline-block text-[13px] text-[rgba(33,30,25,.55)] mb-[20px]">← 프로그램 목록</Link>
      <div className="flex items-end justify-between gap-[20px] flex-wrap mb-[28px]">
        <h1 className="font-medium text-[30px] m-0">{title}</h1>
        <div className="flex gap-[8px] items-center">
          {program && <button type="button" onClick={remove} disabled={!!busy} className="bg-transparent border-0 text-[12.5px] text-[rgba(33,30,25,.5)] cursor-pointer hover:text-error px-[8px]">삭제</button>}
          <button type="button" onClick={() => save(false)} disabled={!!busy} className={`${BTN_SECONDARY} px-[20px]`}>{busy === "save" ? "저장 중…" : "임시 저장"}</button>
          <button type="submit" disabled={!!busy} className={`${BTN_PRIMARY} px-[22px]`}>{busy === "publish" ? "게시 중…" : "게시"}</button>
        </div>
      </div>
      {err && <div className="mb-[16px] px-[16px] py-[12px] text-[13px] bg-[rgba(163,64,44,.08)] text-error border border-[rgba(163,64,44,.25)]">{err}</div>}

      <div className="grid grid-cols-1 min-[1101px]:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] gap-[20px] items-start">
        <div className="grid gap-[20px]">
          <div className={`${CARD} p-[26px] grid gap-[16px]`}>
            <div className={SECTION}>기본 정보</div>
            <label className={LABEL}>프로그램 이름<input value={f.name} onChange={(e) => set("name", e.target.value)} placeholder="예: RSC WINE CLASS" className={INPUT} /></label>
            <label className={LABEL}>서브타이틀<input value={f.subtitle} onChange={(e) => set("subtitle", e.target.value)} placeholder="예: Taste Table" className={INPUT} /></label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-[12px]">
              <label className={LABEL}>카테고리
                <select value={f.category} onChange={(e) => set("category", e.target.value)} className={INPUT}>
                  {isSeason && <option value={SEASON_CATEGORY}>RAUM SOLO</option>}
                  {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </label>
              <label className={LABEL}>장소<input value={f.place} onChange={(e) => set("place", e.target.value)} placeholder="라움 체임버홀" className={INPUT} /></label>
            </div>
            <label className={LABEL}>한 줄 소개 (목록 카드)<input value={f.short_desc} onChange={(e) => set("short_desc", e.target.value)} placeholder="소믈리에가 안내하는 와인 5종 테이스팅과 취향별 테이블 대화." className={INPUT} /></label>
            <label className={LABEL}>상세 설명<textarea rows={5} value={f.description} onChange={(e) => set("description", e.target.value)} placeholder="프로그램 상세페이지에 노출되는 설명" className={`${INPUT} resize-y leading-[1.6]`} /></label>
          </div>

          <div className={`${CARD} p-[26px] grid gap-[16px]`}>
            <div className="flex justify-between items-center">
              <div className={SECTION}>{flowLabel}</div>
              {!isSeason && <button type="button" onClick={() => set("flow", [...f.flow, { t: "", d: "" }])} className="border border-[rgba(33,30,25,.2)] bg-transparent px-[12px] py-[6px] text-[12px] cursor-pointer hover:border-brownHover">+ 항목</button>}
            </div>
            {f.flow.map((row, i) => (
              <div key={i} className="grid grid-cols-[100px_1fr_32px] gap-[10px] items-center">
                <input value={row.t} onChange={(e) => set("flow", f.flow.map((x, j) => (j === i ? { ...x, t: e.target.value } : x)))} placeholder={isSeason ? `${i + 1}주` : "10:00"} className={INPUT_SM} />
                <input value={row.d} onChange={(e) => set("flow", f.flow.map((x, j) => (j === i ? { ...x, d: e.target.value } : x)))} placeholder={isSeason ? "웰컴 디너" : "체크인 · 웰컴 드링크"} className={INPUT_SM} />
                {isSeason ? <span /> : <button type="button" aria-label="삭제" onClick={() => set("flow", f.flow.filter((_, j) => j !== i))} className="border-0 bg-transparent cursor-pointer text-[rgba(33,30,25,.4)] text-[16px] hover:text-error">✕</button>}
              </div>
            ))}
          </div>
        </div>

        <div className="grid gap-[20px]">
          <div className={`${CARD} p-[26px] grid gap-[16px]`}>
            <div className={SECTION}>일정 · 정원 · 가격</div>
            {isSeason ? (
              <div className="grid gap-[10px]">
                {f.sessions.map((s, i) => (
                  <div key={i} className="grid grid-cols-[44px_1fr_1fr] gap-[8px] items-center">
                    <span className="text-[12.5px] text-[rgba(33,30,25,.6)]">{i + 1}주차</span>
                    <input type="date" value={s.date} onChange={(e) => setSession(i, { date: e.target.value })} className={INPUT_SM} />
                    <input type="time" value={s.time} onChange={(e) => setSession(i, { time: e.target.value })} className={INPUT_SM} />
                  </div>
                ))}
                <div className="text-[11.5px] text-[rgba(33,30,25,.45)]">1주차 날짜를 고르면 나머지 주차가 7일 간격으로 채워집니다. 필요하면 수정하세요.</div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-[12px]">
                <label className={LABEL}>날짜<input type="date" value={f.sessions[0]?.date ?? ""} onChange={(e) => setSession(0, { date: e.target.value })} className={INPUT_SM} /></label>
                <label className={LABEL}>시작 시간<input type="time" value={f.sessions[0]?.time ?? ""} onChange={(e) => setSession(0, { time: e.target.value })} className={INPUT_SM} /></label>
              </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-[12px]">
              <label className={LABEL}>정원<input type="number" min={1} value={f.capacity} onChange={(e) => set("capacity", e.target.value)} className={INPUT_SM} /></label>
              <label className={LABEL}>1인 최대 예약<input type="number" value={1} readOnly className={`${INPUT_SM} text-[rgba(33,30,25,.5)]`} title="회원 본인만 예약할 수 있습니다 (FLOWS.md)" /></label>
            </div>
            <label className={LABEL}>판매가 (원)<input type="number" min={0} step={1000} value={f.price} onChange={(e) => set("price", e.target.value)} placeholder="79000" className={`${INPUT} text-[16px] font-semibold`} /></label>
            <label className={LABEL}>회원가 (원, 비우면 판매가와 동일)<input type="number" min={0} step={1000} value={f.member_price} onChange={(e) => set("member_price", e.target.value)} placeholder="" className={INPUT_SM} /></label>
            <label className={`${LABEL} !grid-flow-col !justify-start items-center gap-[10px]`}>
              <input type="checkbox" checked={f.is_published} onChange={(e) => set("is_published", e.target.checked)} className="accent-brown w-[16px] h-[16px]" />
              <span>회원에게 공개 (게시 버튼을 누르면 자동으로 켜집니다)</span>
            </label>
          </div>

          <div className={`${CARD} p-[26px]`}>
            <div className={`${SECTION} mb-[14px]`}>대표 사진</div>
            <div className="relative h-[180px] bg-[#e7e0d3] overflow-hidden mb-[10px]">
              {f.image_url ? <Image src={f.image_url} alt="" fill sizes="480px" className="object-cover" unoptimized={f.image_url.startsWith("blob:")} /> : <div className="absolute inset-0 flex items-center justify-center text-[12px] text-[rgba(33,30,25,.45)]">아직 사진이 없습니다</div>}
            </div>
            <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={(e) => { const file = e.target.files?.[0]; if (file) void upload(file); }} />
            <button type="button" onClick={() => fileRef.current?.click()} disabled={busy === "upload"} className="w-full border border-dashed border-[rgba(33,30,25,.3)] bg-transparent px-[12px] py-[12px] text-[12.5px] cursor-pointer text-[rgba(33,30,25,.6)] hover:border-brown hover:text-brown disabled:opacity-60">
              {busy === "upload" ? "업로드 중…" : "사진 업로드 · 권장 1600×1000"}
            </button>
            {f.image_url && <button type="button" onClick={() => set("image_url", "")} className="mt-[8px] bg-transparent border-0 text-[12px] text-[rgba(33,30,25,.5)] cursor-pointer hover:text-error">사진 제거</button>}
          </div>
        </div>
      </div>
    </form>
  );
}
