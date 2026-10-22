"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { BTN_PRIMARY, BTN_SECONDARY, CARD, FIELD, TH, TD as TD0, Badge, EmptyRow, PageTitle } from "./ui";
import { SitePopups } from "@/components/site/SitePopups";
import { badgeStyle } from "@/lib/admin/format";
import { fmtDate } from "@/lib/posts/types";
import { fromKstIso } from "@/lib/programs/format";
import { POPUP_RATIOS, POPUP_RATIO_KEYS, POPUP_STATE_KO, popupState, type Popup, type PopupRatio, type PopupState } from "@/lib/popups/types";

const TD = `${TD0} px-[10px]`;
const LABEL = "grid gap-[6px] text-[12.5px] text-[rgba(33,30,25,.6)]";
type Form = { title: string; image_url: string; ratio: PopupRatio; link_url: string; starts_at: string; ends_at: string; active: boolean; sort_order: number };
const EMPTY: Form = { title: "", image_url: "", ratio: "1:1", link_url: "", starts_at: "", ends_at: "", active: true, sort_order: 0 };

/** 올린 사진을 선택한 비율의 권장 크기로 가운데 기준 자르고 축소한다 (JPEG 0.9). 비율이 다른 사진도 그대로 쓸 수 있다 */
async function fitToRatio(file: File, ratio: PopupRatio): Promise<{ blob: Blob; cropped: boolean }> {
  const { w, h } = POPUP_RATIOS[ratio];
  const bmp = await createImageBitmap(file);
  const target = w / h;
  const src = bmp.width / bmp.height;
  let sx = 0, sy = 0, sw = bmp.width, sh = bmp.height;
  if (src > target * 1.005) { sw = Math.round(bmp.height * target); sx = Math.round((bmp.width - sw) / 2); }
  else if (src < target / 1.005) { sh = Math.round(bmp.width / target); sy = Math.round((bmp.height - sh) / 2); }
  const c = document.createElement("canvas");
  c.width = Math.min(w, sw);
  c.height = Math.round(c.width / target);
  c.getContext("2d")!.drawImage(bmp, sx, sy, sw, sh, 0, 0, c.width, c.height);
  const blob = await new Promise<Blob>((res, rej) => c.toBlob((b) => (b ? res(b) : rej(new Error("변환 실패"))), "image/jpeg", 0.9));
  return { blob, cropped: sw !== bmp.width || sh !== bmp.height };
}

function toForm(p: Popup): Form {
  return { title: p.title, image_url: p.image_url, ratio: p.ratio, link_url: p.link_url ?? "", starts_at: p.starts_at ? fromKstIso(p.starts_at).date : "", ends_at: p.ends_at ? fromKstIso(p.ends_at).date : "", active: p.active, sort_order: p.sort_order };
}
const stateBadge = (s: PopupState) => badgeStyle(s === "live" ? "ok" : s === "scheduled" ? "warn" : "mute");

/** 팝업 관리 (M17): 등록/수정 폼 + 목록 + 미리보기 */
export function PopupsAdmin({ popups }: { popups: Popup[] }) {
  const router = useRouter();
  const [f, setF] = useState<Form>(EMPTY);
  const [editing, setEditing] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [preview, setPreview] = useState<Popup[] | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const set = <K extends keyof Form>(k: K, v: Form[K]) => setF((s) => ({ ...s, [k]: v }));
  const r = POPUP_RATIOS[f.ratio];

  const onFile = async (file: File) => {
    setUploading(true); setErr(null); setMsg(null);
    try {
      const { blob, cropped } = await fitToRatio(file, f.ratio);
      const fd = new FormData();
      fd.append("file", blob, file.name.replace(/\.[^.]+$/, "") + ".jpg");
      const res = await fetch("/api/admin/upload?bucket=site", { method: "POST", body: fd });
      const j = (await res.json().catch(() => null)) as { ok?: boolean; url?: string; message?: string } | null;
      if (!j?.ok || !j.url) throw new Error(j?.message ?? "업로드하지 못했습니다.");
      set("image_url", j.url);
      if (cropped) setMsg(`사진 비율이 ${f.ratio} 와 달라 가운데 기준으로 잘라 ${r.hint} 에 맞췄습니다. 아래 미리보기를 확인해 주세요.`);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "업로드하지 못했습니다.");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true); setErr(null); setMsg(null);
    try {
      const res = await fetch(editing ? `/api/admin/popups/${editing}` : "/api/admin/popups", { method: editing ? "PUT" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(f) });
      const j = (await res.json().catch(() => null)) as { ok?: boolean; message?: string } | null;
      if (!j?.ok) throw new Error(j?.message ?? "저장하지 못했습니다.");
      setF(EMPTY); setEditing(null);
      setMsg(editing ? "수정했습니다." : f.active ? "등록했습니다. 홈에 바로 보입니다." : "등록했습니다. 꺼짐 상태라 홈에는 아직 보이지 않습니다.");
      router.refresh();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "저장하지 못했습니다.");
    } finally {
      setBusy(false);
    }
  };
  const call = async (id: string, method: "PATCH" | "DELETE", body?: unknown) => {
    setBusy(true); setErr(null);
    try {
      const res = await fetch(`/api/admin/popups/${id}`, { method, headers: { "Content-Type": "application/json" }, body: body === undefined ? undefined : JSON.stringify(body) });
      const j = (await res.json().catch(() => null)) as { ok?: boolean; message?: string } | null;
      if (!j?.ok) throw new Error(j?.message ?? "처리하지 못했습니다.");
      if (editing === id && method === "DELETE") { setEditing(null); setF(EMPTY); }
      router.refresh();
    } catch (e) {
      alert(e instanceof Error ? e.message : "처리하지 못했습니다.");
    } finally {
      setBusy(false);
    }
  };
  const previewPopup = (p?: Popup) => {
    const now = new Date().toISOString();
    setPreview([p ?? { id: "preview", title: f.title || "미리보기", image_url: f.image_url, ratio: f.ratio, link_url: f.link_url || null, starts_at: null, ends_at: null, active: true, sort_order: 0, created_at: now, updated_at: now }]);
  };
  const liveCount = popups.filter((p) => popupState(p) === "live").length;

  return (
    <>
      <PageTitle overline="POPUPS" title="팝업" aside={<span className="text-[16px] text-[rgba(33,30,25,.5)]">노출 중 {liveCount}개</span>}>
        <a href="/" target="_blank" rel="noreferrer" className="text-[12.5px] text-[rgba(33,30,25,.55)] underline">홈에서 보기 ↗</a>
      </PageTitle>
      <div className="grid gap-[20px]">
        <form onSubmit={submit} className={`${CARD} p-[22px] grid gap-[18px]`}>
          <div className="flex items-center justify-between gap-[10px]">
            <div className="text-[12px] tracking-[.2em] text-[rgba(33,30,25,.5)]">{editing ? "팝업 수정" : "팝업 등록"}</div>
            {editing && <button type="button" onClick={() => { setEditing(null); setF(EMPTY); setErr(null); setMsg(null); }} className="bg-transparent border-0 p-0 text-[12px] text-[rgba(33,30,25,.55)] cursor-pointer hover:text-brown">새로 등록으로 돌아가기</button>}
          </div>

          <div className="grid gap-[8px]">
            <div className="text-[12.5px] text-[rgba(33,30,25,.6)]">1. 비율 선택 — 사진을 올리면 이 크기로 가운데 기준 맞춰집니다</div>
            <div className="grid grid-cols-2 gap-[10px] max-w-[520px]">
              {POPUP_RATIO_KEYS.map((k) => {
                const o = POPUP_RATIOS[k]; const on = f.ratio === k;
                return (
                  <button key={k} type="button" onClick={() => set("ratio", k)} className={`text-left p-[14px] border cursor-pointer bg-white ${on ? "border-brown" : "border-[rgba(33,30,25,.2)] hover:border-brownHover"}`} aria-pressed={on}>
                    <div className="flex items-end gap-[12px]">
                      <div className="bg-[#e7e0d3] border border-[rgba(33,30,25,.15)]" style={{ width: 44, aspectRatio: `${o.w} / ${o.h}` }} />
                      <div>
                        <div className="text-[14px] font-semibold text-ink">{k} {o.label}</div>
                        <div className="text-[12px] text-[rgba(33,30,25,.55)]">{o.hint} px</div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid md:grid-cols-[240px_minmax(0,1fr)] gap-[18px] items-start">
            <div className="grid gap-[8px]">
              <div className="text-[12.5px] text-[rgba(33,30,25,.6)]">2. 사진</div>
              <div className="relative bg-[#e7e0d3] border border-[rgba(33,30,25,.15)] overflow-hidden" style={{ aspectRatio: `${r.w} / ${r.h}` }}>
                {f.image_url ? <Image src={f.image_url} alt="" fill sizes="240px" className="object-cover" unoptimized={f.image_url.startsWith("http")} /> : <div className="absolute inset-0 grid place-items-center text-[12px] text-[rgba(33,30,25,.45)] text-center px-[12px]">{r.hint} 권장<br />JPG · PNG · WEBP</div>}
              </div>
              <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={(e) => { const file = e.target.files?.[0]; if (file) onFile(file); }} />
              <div className="flex gap-[6px]">
                <button type="button" onClick={() => fileRef.current?.click()} disabled={uploading} className={`${BTN_SECONDARY} px-[12px] py-[8px] text-[12.5px]`}>{uploading ? "올리는 중…" : f.image_url ? "사진 바꾸기" : "사진 올리기"}</button>
                {f.image_url && <button type="button" onClick={() => previewPopup()} className={`${BTN_SECONDARY} px-[12px] py-[8px] text-[12.5px]`}>미리보기</button>}
              </div>
            </div>
            <div className="grid gap-[12px]">
              <div className="text-[12.5px] text-[rgba(33,30,25,.6)]">3. 내용</div>
              <label className={LABEL}>팝업 이름 (관리용, 화면에는 안 보임)<input value={f.title} onChange={(e) => set("title", e.target.value)} className={FIELD} placeholder="예: 10월 멤버십 오픈 안내" required /></label>
              <label className={LABEL}>클릭하면 이동할 주소 (선택)<input value={f.link_url} onChange={(e) => set("link_url", e.target.value)} className={FIELD} placeholder="예: /news/오픈-안내 또는 https://instagram.com/…" /></label>
              <div className="grid grid-cols-2 gap-[10px]">
                <label className={LABEL}>시작일 (비우면 바로)<input type="date" value={f.starts_at} onChange={(e) => set("starts_at", e.target.value)} className={FIELD} /></label>
                <label className={LABEL}>종료일 (비우면 계속)<input type="date" value={f.ends_at} onChange={(e) => set("ends_at", e.target.value)} className={FIELD} /></label>
              </div>
              <div className="grid grid-cols-2 gap-[10px] items-end">
                <label className={LABEL}>순서 (작을수록 먼저)<input type="number" min={0} max={999} value={f.sort_order} onChange={(e) => set("sort_order", Number(e.target.value) || 0)} className={FIELD} /></label>
                <label className="flex items-center gap-[8px] text-[13px] py-[10px] cursor-pointer"><input type="checkbox" checked={f.active} onChange={(e) => set("active", e.target.checked)} />홈에 보이기 (켜짐)</label>
              </div>
            </div>
          </div>

          {err && <div className="px-[14px] py-[10px] bg-[rgba(163,64,44,.08)] text-error text-[13px]">{err}</div>}
          {msg && <div className="px-[14px] py-[10px] bg-[rgba(90,61,36,.08)] text-brown text-[13px]">{msg}</div>}
          <div className="flex gap-[8px]">
            <button type="submit" disabled={busy || uploading || !f.image_url} className={BTN_PRIMARY}>{busy ? "저장 중…" : editing ? "수정 저장" : "팝업 등록"}</button>
            {!f.image_url && <span className="self-center text-[12px] text-[rgba(33,30,25,.5)]">사진을 올리면 등록할 수 있습니다.</span>}
          </div>
        </form>

        <div className={CARD}>
          <div className="px-[14px] py-[12px] border-b border-[rgba(33,30,25,.12)] text-[12px] tracking-[.2em] text-[rgba(33,30,25,.5)]">팝업 목록</div>
          <div className="overflow-x-auto">
            <table className="border-collapse w-full">
              <thead><tr>{["", "이름", "비율", "기간", "순서", "상태", "등록", ""].map((h, i) => <th key={i} className={`${TH} px-[10px]`}>{h}</th>)}</tr></thead>
              <tbody>
                {popups.length === 0 && <EmptyRow colSpan={8}>아직 팝업이 없습니다. 위에서 사진을 올려 첫 팝업을 등록해 보세요.</EmptyRow>}
                {popups.map((p) => {
                  const st = popupState(p);
                  return (
                    <tr key={p.id} className={`hover:bg-[#faf7f1] ${editing === p.id ? "bg-[rgba(226,180,120,.18)]" : ""}`}>
                      <td className={TD}><div className="relative w-[48px] bg-[#e7e0d3] overflow-hidden" style={{ aspectRatio: `${POPUP_RATIOS[p.ratio].w} / ${POPUP_RATIOS[p.ratio].h}` }}><Image src={p.image_url} alt="" fill sizes="48px" className="object-cover" unoptimized={p.image_url.startsWith("http")} /></div></td>
                      <td className={`${TD} whitespace-normal min-w-[200px]`}>
                        <div className="font-semibold">{p.title}</div>
                        {p.link_url && <div className="text-[11.5px] text-[rgba(33,30,25,.45)] mt-[2px] break-all">→ {p.link_url}</div>}
                      </td>
                      <td className={TD}>{p.ratio}</td>
                      <td className={`${TD} text-[rgba(33,30,25,.6)]`}>{p.starts_at || p.ends_at ? `${p.starts_at ? fmtDate(p.starts_at) : "바로"} ~ ${p.ends_at ? fmtDate(p.ends_at) : "계속"}` : "항상"}</td>
                      <td className={TD}>{p.sort_order}</td>
                      <td className={TD}><Badge style={stateBadge(st)}>{POPUP_STATE_KO[st]}</Badge></td>
                      <td className={`${TD} text-[rgba(33,30,25,.55)]`}>{fmtDate(p.created_at)}</td>
                      <td className={TD}>
                        <div className="flex gap-[10px] flex-wrap text-[12px]">
                          <button type="button" onClick={() => previewPopup(p)} className="bg-transparent border-0 p-0 cursor-pointer text-[rgba(33,30,25,.55)] hover:text-brownHover">미리보기</button>
                          <button type="button" disabled={busy} onClick={() => call(p.id, "PATCH", { active: !p.active })} className="bg-transparent border-0 p-0 cursor-pointer text-brown hover:text-brownHover disabled:opacity-50">{p.active ? "끄기" : "켜기"}</button>
                          <button type="button" onClick={() => { setEditing(p.id); setF(toForm(p)); setErr(null); setMsg(null); window.scrollTo({ top: 0, behavior: "smooth" }); }} className="bg-transparent border-0 p-0 cursor-pointer text-[rgba(33,30,25,.55)] hover:text-brownHover">수정</button>
                          <button type="button" disabled={busy} onClick={() => { if (confirm(`"${p.title}" 팝업을 삭제할까요?`)) call(p.id, "DELETE"); }} className="bg-transparent border-0 p-0 cursor-pointer text-error hover:opacity-80 disabled:opacity-50">삭제</button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="px-[14px] py-[10px] text-[11.5px] text-[rgba(33,30,25,.5)]">홈에는 「노출 중」 팝업만 순서대로(최대 5개) 보입니다. 방문자가 「오늘 하루 보지 않기」를 누르면 그 기기에서 그날은 다시 뜨지 않습니다.</div>
        </div>
      </div>
      {preview && <SitePopups popups={preview} preview onClose={() => setPreview(null)} />}
    </>
  );
}
