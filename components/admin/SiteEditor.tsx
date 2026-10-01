"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { BTN_PRIMARY, BTN_SECONDARY, CARD, FIELD } from "./ui";
import type { DocDef, Field } from "@/lib/cms/schema";

type Data = Record<string, unknown>;
type Item = Record<string, unknown>;

const LABEL = "grid gap-[6px] text-[12.5px] text-[rgba(33,30,25,.6)]";
const MAX_SIDE = 2000;

async function shrink(file: File): Promise<Blob> {
  if (file.type === "image/svg+xml") return file;
  const bmp = await createImageBitmap(file);
  const scale = Math.min(1, MAX_SIDE / Math.max(bmp.width, bmp.height));
  if (scale === 1 && file.type !== "image/png") return file;
  const c = document.createElement("canvas");
  c.width = Math.round(bmp.width * scale);
  c.height = Math.round(bmp.height * scale);
  c.getContext("2d")!.drawImage(bmp, 0, 0, c.width, c.height);
  const type = file.type === "image/png" ? "image/png" : "image/jpeg";
  return new Promise((res, rej) => c.toBlob((b) => (b ? res(b) : rej(new Error("변환 실패"))), type, 0.88));
}

function ImageField({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const ref = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const upload = async (file: File) => {
    setBusy(true);
    setErr(null);
    try {
      const fd = new FormData();
      fd.append("file", await shrink(file), file.name);
      const res = await fetch("/api/admin/upload?bucket=site", { method: "POST", body: fd });
      const j = (await res.json().catch(() => null)) as { ok?: boolean; url?: string; message?: string } | null;
      if (!j?.ok || !j.url) throw new Error(j?.message ?? "업로드하지 못했습니다.");
      onChange(j.url);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "업로드하지 못했습니다.");
    } finally {
      setBusy(false);
      if (ref.current) ref.current.value = "";
    }
  };
  return (
    <div className="grid grid-cols-[96px_1fr] gap-[10px] items-start">
      <div className="relative w-[96px] h-[64px] bg-[#e7e0d3] overflow-hidden border border-[rgba(33,30,25,.1)]">
        {value && <Image src={value} alt="" fill sizes="96px" className="object-cover" unoptimized={value.startsWith("http")} />}
      </div>
      <div className="grid gap-[6px]">
        <input value={value} onChange={(e) => onChange(e.target.value)} placeholder="/images/… 또는 https://…" className={FIELD} />
        <div className="flex gap-[6px]">
          <input ref={ref} type="file" accept="image/jpeg,image/png,image/webp,image/svg+xml" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) void upload(f); }} />
          <button type="button" onClick={() => ref.current?.click()} disabled={busy} className={`${BTN_SECONDARY} px-[12px] py-[6px] text-[12px]`}>{busy ? "업로드 중…" : "사진 업로드"}</button>
          {value && <button type="button" onClick={() => onChange("")} className="bg-transparent border-0 text-[12px] text-[rgba(33,30,25,.5)] cursor-pointer hover:text-error">비우기</button>}
        </div>
        {err && <div className="text-[12px] text-error">{err}</div>}
      </div>
    </div>
  );
}

function FieldInput({ f, value, onChange }: { f: Field; value: unknown; onChange: (v: unknown) => void }) {
  const str = value == null ? "" : String(value);
  if (f.type === "boolean") {
    return (
      <label className="flex items-center gap-[10px] text-[13px]">
        <input type="checkbox" checked={!!value} onChange={(e) => onChange(e.target.checked)} className="accent-brown w-[16px] h-[16px]" />
        {f.label}
      </label>
    );
  }
  const hint = f.hint ?? (f.breaks === "soft" ? "줄바꿈은 PC 화면에서만 적용됩니다" : f.breaks === "hard" ? "줄바꿈이 그대로 적용됩니다" : undefined);
  return (
    <label className={LABEL}>
      <span>{f.label}{hint && <span className="ml-[8px] text-[11px] text-[rgba(33,30,25,.4)]">{hint}</span>}</span>
      {f.type === "textarea" ? (
        <textarea rows={Math.min(8, Math.max(2, str.split("\n").length + 1))} value={str} onChange={(e) => onChange(e.target.value)} className={`${FIELD} resize-y leading-[1.6]`} />
      ) : f.type === "image" ? (
        <ImageField value={str} onChange={onChange} />
      ) : f.type === "color" ? (
        <div className="flex gap-[8px] items-center">
          <input type="color" value={/^#[0-9a-f]{6}$/i.test(str) ? str : "#000000"} onChange={(e) => onChange(e.target.value)} className="w-[40px] h-[36px] p-0 border border-[rgba(33,30,25,.2)] bg-white cursor-pointer" />
          <input value={str} onChange={(e) => onChange(e.target.value)} className={`${FIELD} font-mono`} placeholder="#5a3d24" />
        </div>
      ) : f.type === "number" ? (
        <input type="number" value={str} onChange={(e) => onChange(e.target.value === "" ? 0 : Number(e.target.value))} className={FIELD} />
      ) : (
        <input value={str} onChange={(e) => onChange(e.target.value)} className={FIELD} />
      )}
    </label>
  );
}

/**
 * 사이트 콘텐츠 편집기 (schema 기반). 저장하면 즉시 게시되고 이력에 남는다. 기본값 복원·이력 복원 지원.
 */
export function SiteEditor({ def, initial, previewHref, updatedAt, readOnly = false }: { def: DocDef; initial: Data; previewHref: string; updatedAt: string | null; readOnly?: boolean }) {
  const router = useRouter();
  const [data, setData] = useState<Data>(initial);
  const [busy, setBusy] = useState<"save" | "reset" | "history" | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [history, setHistory] = useState<{ id: number; saved_at: string; data: Data }[] | null>(null);
  const dirty = JSON.stringify(data) !== JSON.stringify(initial);
  const set = (k: string, v: unknown) => setData((d) => ({ ...d, [k]: v }));
  const items = (k: string): Item[] => (Array.isArray(data[k]) ? (data[k] as Item[]) : []);
  const setItems = (k: string, arr: Item[]) => set(k, arr);

  const save = async () => {
    setBusy("save");
    setMsg(null);
    try {
      const res = await fetch(`/api/admin/site/${def.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ data }) });
      const j = (await res.json().catch(() => null)) as { ok?: boolean; message?: string } | null;
      if (!j?.ok) throw new Error(j?.message ?? "저장하지 못했습니다.");
      setMsg("저장했습니다. 사이트에 바로 반영됩니다.");
      router.refresh();
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "저장하지 못했습니다.");
    } finally {
      setBusy(null);
    }
  };
  const reset = async () => {
    if (!confirm("이 문서를 처음 기본값으로 되돌릴까요? (저장 이력은 남습니다)")) return;
    setBusy("reset");
    try {
      const res = await fetch(`/api/admin/site/${def.id}`, { method: "DELETE" });
      const j = (await res.json().catch(() => null)) as { ok?: boolean; message?: string } | null;
      if (!j?.ok) throw new Error(j?.message ?? "되돌리지 못했습니다.");
      router.refresh();
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "되돌리지 못했습니다.");
    } finally {
      setBusy(null);
    }
  };
  const loadHistory = async () => {
    setBusy("history");
    try {
      const res = await fetch(`/api/admin/site/${def.id}`);
      const j = (await res.json().catch(() => null)) as { ok?: boolean; history?: { id: number; saved_at: string; data: Data }[] } | null;
      setHistory(j?.history ?? []);
    } finally {
      setBusy(null);
    }
  };

  return (
    <form onSubmit={(e) => { e.preventDefault(); if (!readOnly) void save(); }} className="grid gap-[20px]">
      <fieldset disabled={readOnly} className="contents min-w-0 border-0 p-0 m-0">
      <div className="flex items-end justify-between gap-[12px] flex-wrap">
        <div>
          <div className="text-[12px] tracking-[.2em] text-[rgba(33,30,25,.5)] mb-[6px]">{def.id}</div>
          <h2 className="font-medium text-[22px] m-0">{def.label}</h2>
          {def.description && <div className="text-[12.5px] text-[rgba(33,30,25,.55)] mt-[6px]">{def.description}</div>}
          <div className="text-[11.5px] text-[rgba(33,30,25,.45)] mt-[6px]">{updatedAt ? `마지막 저장 ${new Date(updatedAt).toLocaleString("ko-KR", { timeZone: "Asia/Seoul" })}` : "아직 수정하지 않음 (기본값)"}</div>
        </div>
        <div className="flex gap-[8px] items-center flex-wrap">
          <a href={previewHref} target="_blank" rel="noreferrer" className={`${BTN_SECONDARY} px-[14px] py-[9px] text-[12.5px]`}>사이트에서 보기 ↗</a>
          <button type="button" onClick={loadHistory} disabled={!!busy} className={`${BTN_SECONDARY} px-[14px] py-[9px] text-[12.5px]`}>이력</button>
          {updatedAt && !readOnly && <button type="button" onClick={reset} disabled={!!busy} className="bg-transparent border-0 text-[12.5px] text-[rgba(33,30,25,.5)] cursor-pointer hover:text-error px-[6px]">기본값으로</button>}
          {readOnly ? <span className="text-[12px] text-[rgba(33,30,25,.5)] px-[6px]">읽기 전용 · 주관리자만 저장</span> : <button type="submit" disabled={!!busy || !dirty} className={BTN_PRIMARY}>{busy === "save" ? "저장 중…" : "저장 · 게시"}</button>}
        </div>
      </div>
      {msg && <div className="text-[13px] text-brown">{msg}</div>}

      {history && (
        <div className={`${CARD} p-[16px]`}>
          <div className="flex justify-between items-center mb-[10px]"><b className="text-[13px]">저장 이력 (최근 20)</b><button type="button" onClick={() => setHistory(null)} className="bg-transparent border-0 text-[12px] cursor-pointer text-[rgba(33,30,25,.5)]">닫기</button></div>
          {history.length === 0 ? <div className="text-[12.5px] text-[rgba(33,30,25,.5)]">이력이 없습니다.</div> : (
            <div className="grid gap-[6px]">
              {history.map((h) => (
                <div key={h.id} className="flex justify-between items-center text-[12.5px] border-b border-[rgba(33,30,25,.08)] pb-[6px]">
                  <span>{new Date(h.saved_at).toLocaleString("ko-KR", { timeZone: "Asia/Seoul" })}</span>
                  <button type="button" onClick={() => { setData(h.data); setHistory(null); setMsg("이 버전을 불러왔습니다. '저장 · 게시'를 누르면 적용됩니다."); }} className={`${BTN_SECONDARY} px-[10px] py-[4px] text-[11.5px]`}>불러오기</button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {def.fields.length > 0 && (
        <div className={`${CARD} p-[22px] grid gap-[14px]`}>
          {def.fields.map((f) => <FieldInput key={f.key} f={f} value={data[f.key]} onChange={(v) => set(f.key, v)} />)}
        </div>
      )}

      {(def.lists ?? []).map((l) => {
        const arr = items(l.key);
        const blank = () => Object.fromEntries(l.fields.map((f) => [f.key, f.type === "boolean" ? false : f.type === "number" ? 0 : ""]));
        return (
          <div key={l.key} className={`${CARD} p-[22px] grid gap-[14px]`}>
            <div className="flex justify-between items-center">
              <div className="text-[12px] tracking-[.2em] text-[rgba(33,30,25,.5)]">{l.label} · {arr.length}개</div>
              {arr.length < (l.max ?? 50) && <button type="button" onClick={() => setItems(l.key, [...arr, blank()])} className={`${BTN_SECONDARY} px-[12px] py-[6px] text-[12px]`}>+ {l.itemLabel} 추가</button>}
            </div>
            {arr.map((it, i) => (
              <div key={i} className="border border-[rgba(33,30,25,.12)] p-[16px] grid gap-[12px]">
                <div className="flex justify-between items-center">
                  <b className="text-[13px]">{l.itemLabel} {i + 1}</b>
                  <div className="flex gap-[4px]">
                    <button type="button" disabled={i === 0} onClick={() => { const a = [...arr]; [a[i - 1], a[i]] = [a[i], a[i - 1]]; setItems(l.key, a); }} className={`${BTN_SECONDARY} px-[8px] py-[3px] text-[11px]`} aria-label="위로">↑</button>
                    <button type="button" disabled={i === arr.length - 1} onClick={() => { const a = [...arr]; [a[i + 1], a[i]] = [a[i], a[i + 1]]; setItems(l.key, a); }} className={`${BTN_SECONDARY} px-[8px] py-[3px] text-[11px]`} aria-label="아래로">↓</button>
                    <button type="button" disabled={arr.length <= (l.min ?? 0)} onClick={() => setItems(l.key, arr.filter((_, j) => j !== i))} className="bg-transparent border-0 text-[12px] text-[rgba(33,30,25,.45)] cursor-pointer hover:text-error px-[6px] disabled:opacity-40">삭제</button>
                  </div>
                </div>
                <div className="grid gap-[10px] md:grid-cols-2">
                  {l.fields.map((f) => (
                    <div key={f.key} className={f.type === "textarea" || f.type === "image" ? "md:col-span-2" : ""}>
                      <FieldInput f={f} value={it[f.key]} onChange={(v) => setItems(l.key, arr.map((x, j) => (j === i ? { ...x, [f.key]: v } : x)))} />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        );
      })}
      <div className="flex justify-end">
        {!readOnly && <button type="submit" disabled={!!busy || !dirty} className={BTN_PRIMARY}>{busy === "save" ? "저장 중…" : "저장 · 게시"}</button>}
      </div>
      </fieldset>
    </form>
  );
}
