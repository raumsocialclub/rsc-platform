"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { BTN_PRIMARY, BTN_SECONDARY, CARD } from "./ui";
import { fromKstIso } from "@/lib/programs/format";
import { POST_CATEGORIES, slugify, type Post } from "@/lib/posts/types";

type FormState = { title: string; slug: string; slugTouched: boolean; category: string; summary: string; body: string; cover_image: string; published: boolean; published_at: string };

const LABEL = "grid gap-[6px] text-[12.5px] text-[rgba(33,30,25,.6)]";
const INPUT = "px-[14px] py-[13px] text-[14px] border border-[rgba(33,30,25,.2)] outline-none text-ink bg-white rounded-none focus:border-brown w-full min-w-0";
const SECTION = "text-[12px] tracking-[.2em] text-[rgba(33,30,25,.5)]";
const MAX_SIDE = 2000;

const HELP = [
  ["# 큰 제목", "## 중간 제목"],
  ["**굵게**", "*기울임*"],
  ["- 목록", "1. 번호 목록"],
  ["> 인용문", "--- (구분선)"],
  ["[문구](https://…)", "![설명](사진주소)"],
];

async function shrink(file: File): Promise<Blob> {
  const bmp = await createImageBitmap(file);
  const scale = Math.min(1, MAX_SIDE / Math.max(bmp.width, bmp.height));
  if (scale === 1 && file.type !== "image/png") return file;
  const c = document.createElement("canvas");
  c.width = Math.round(bmp.width * scale);
  c.height = Math.round(bmp.height * scale);
  c.getContext("2d")!.drawImage(bmp, 0, 0, c.width, c.height);
  return new Promise((res, rej) => c.toBlob((b) => (b ? res(b) : rej(new Error("변환 실패"))), "image/jpeg", 0.88));
}

function initial(p?: Post): FormState {
  if (!p) return { title: "", slug: "", slugTouched: false, category: POST_CATEGORIES[0], summary: "", body: "", cover_image: "", published: false, published_at: "" };
  return { title: p.title, slug: p.slug, slugTouched: true, category: p.category, summary: p.summary ?? "", body: p.body, cover_image: p.cover_image ?? "", published: p.published, published_at: p.published_at ? fromKstIso(p.published_at).date : "" };
}

/** 소식 작성·편집 폼 (M11). 본문은 간단 마크다운, 사진은 site 버킷에 업로드 */
export function PostForm({ post }: { post?: Post }) {
  const router = useRouter();
  const [f, setF] = useState<FormState>(() => initial(post));
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const coverRef = useRef<HTMLInputElement>(null);
  const bodyRef = useRef<HTMLTextAreaElement>(null);
  const bodyFileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState<"cover" | "body" | null>(null);
  const set = <K extends keyof FormState>(k: K, v: FormState[K]) => setF((s) => ({ ...s, [k]: v }));

  const upload = async (file: File): Promise<string> => {
    const fd = new FormData();
    fd.append("file", await shrink(file), file.name);
    const res = await fetch("/api/admin/upload?bucket=site", { method: "POST", body: fd });
    const j = (await res.json().catch(() => null)) as { ok?: boolean; url?: string; message?: string } | null;
    if (!j?.ok || !j.url) throw new Error(j?.message ?? "업로드하지 못했습니다.");
    return j.url;
  };
  const onCover = async (file: File) => {
    setUploading("cover"); setErr(null);
    try { set("cover_image", await upload(file)); } catch (e) { setErr(e instanceof Error ? e.message : "업로드하지 못했습니다."); } finally { setUploading(null); if (coverRef.current) coverRef.current.value = ""; }
  };
  const onBodyImage = async (file: File) => {
    setUploading("body"); setErr(null);
    try {
      const url = await upload(file);
      const ta = bodyRef.current;
      const pos = ta ? ta.selectionStart : f.body.length;
      const snippet = `\n![사진 설명](${url})\n`;
      set("body", f.body.slice(0, pos) + snippet + f.body.slice(pos));
    } catch (e) { setErr(e instanceof Error ? e.message : "업로드하지 못했습니다."); } finally { setUploading(null); if (bodyFileRef.current) bodyFileRef.current.value = ""; }
  };

  const submit = async (publish?: boolean) => {
    setBusy(true); setErr(null); setMsg(null);
    try {
      const payload = { title: f.title, slug: f.slug || slugify(f.title), category: f.category, summary: f.summary, body: f.body, cover_image: f.cover_image, published: publish ?? f.published, published_at: f.published_at };
      const res = await fetch(post ? `/api/admin/posts/${post.id}` : "/api/admin/posts", { method: post ? "PUT" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      const j = (await res.json().catch(() => null)) as { ok?: boolean; id?: string; message?: string } | null;
      if (!j?.ok) throw new Error(j?.message ?? "저장하지 못했습니다.");
      if (!post && j.id) { router.replace(`/admin/posts/${j.id}`); router.refresh(); return; }
      setF((s) => ({ ...s, published: payload.published }));
      setMsg(payload.published ? "저장했습니다. 공개 화면에 반영됐습니다." : "임시 저장했습니다.");
      router.refresh();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "저장하지 못했습니다.");
    } finally {
      setBusy(false);
    }
  };
  const remove = async () => {
    if (!post || !confirm("이 글을 삭제할까요? 되돌릴 수 없습니다.")) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/posts/${post.id}`, { method: "DELETE" });
      const j = (await res.json().catch(() => null)) as { ok?: boolean; message?: string } | null;
      if (!j?.ok) throw new Error(j?.message ?? "삭제하지 못했습니다.");
      router.replace("/admin/posts"); router.refresh();
    } catch (e) { setErr(e instanceof Error ? e.message : "삭제하지 못했습니다."); setBusy(false); }
  };

  return (
    <>
      <div className="flex items-end justify-between gap-[20px] flex-wrap mb-[28px]">
        <div>
          <div className="text-[11px] tracking-[.3em] text-[rgba(33,30,25,.5)] mb-[10px]"><Link href="/admin/posts" className="hover:text-brownHover">NEWS</Link> / {post ? "EDIT" : "NEW"}</div>
          <h1 className="font-medium text-[30px] m-0">{post ? "소식 편집" : "새 글 쓰기"}</h1>
        </div>
        <div className="flex gap-[8px] items-center flex-wrap">
          {post?.published && <Link href={`/news/${encodeURIComponent(post.slug)}`} target="_blank" className="text-[12.5px] text-[rgba(33,30,25,.55)] underline mr-[6px]">공개 화면 보기 ↗</Link>}
          {post && <button type="button" onClick={remove} disabled={busy} className={`${BTN_SECONDARY} text-error border-[rgba(163,64,44,.4)]`}>삭제</button>}
          <button type="button" onClick={() => submit(false)} disabled={busy} className={BTN_SECONDARY}>{busy ? "저장 중…" : "임시 저장"}</button>
          <button type="button" onClick={() => submit(true)} disabled={busy} className={BTN_PRIMARY}>{busy ? "저장 중…" : f.published ? "저장 (발행 유지)" : "발행하기"}</button>
        </div>
      </div>
      {err && <div className="mb-[16px] px-[16px] py-[12px] bg-[rgba(163,64,44,.08)] text-error text-[13px]">{err}</div>}
      {msg && <div className="mb-[16px] px-[16px] py-[12px] bg-[rgba(46,107,62,.08)] text-[#2e6b3e] text-[13px]">{msg}</div>}

      <div className="grid grid-cols-1 min-[1101px]:grid-cols-[minmax(0,1fr)_320px] gap-[20px] items-start">
        <div className="grid gap-[20px]">
          <div className={`${CARD} p-[22px] grid gap-[16px]`}>
            <label className={LABEL}>제목
              <input value={f.title} onChange={(e) => setF((s) => ({ ...s, title: e.target.value, slug: s.slugTouched ? s.slug : slugify(e.target.value) }))} className={INPUT} placeholder="예: 10월 RAUM SOCIAL NIGHT 안내" />
            </label>
            <label className={LABEL}>요약 <span className="text-[11px]">(목록·검색 결과·공유 미리보기에 표시, 300자 이내)</span>
              <textarea value={f.summary} onChange={(e) => set("summary", e.target.value)} rows={2} className={INPUT} />
            </label>
            <div className={LABEL}>
              <div className="flex items-center justify-between gap-[12px] flex-wrap">
                <span>본문</span>
                <div className="flex items-center gap-[10px]">
                  <input ref={bodyFileRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={(e) => { const x = e.target.files?.[0]; if (x) void onBodyImage(x); }} />
                  <button type="button" onClick={() => bodyFileRef.current?.click()} disabled={uploading === "body"} className={`${BTN_SECONDARY} px-[12px] py-[6px] text-[12px]`}>{uploading === "body" ? "업로드 중…" : "본문에 사진 넣기"}</button>
                </div>
              </div>
              <textarea ref={bodyRef} value={f.body} onChange={(e) => set("body", e.target.value)} rows={22} className={`${INPUT} font-mono text-[13.5px] leading-[1.7]`} placeholder={"빈 줄로 문단을 나눕니다.\n\n## 소제목\n본문 내용…"} />
              <div className="grid grid-cols-2 md:grid-cols-5 gap-[6px] text-[11.5px] text-[rgba(33,30,25,.5)]">
                {HELP.map(([a, b], i) => <div key={i}><code className="text-ink">{a}</code><br /><code className="text-ink">{b}</code></div>)}
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-[20px]">
          <div className={`${CARD} p-[22px] grid gap-[16px]`}>
            <div className={SECTION}>발행</div>
            <label className="flex items-center gap-[10px] text-[13.5px]">
              <input type="checkbox" checked={f.published} onChange={(e) => set("published", e.target.checked)} /> 공개 화면에 표시
            </label>
            <label className={LABEL}>발행일 <span className="text-[11px]">(비우면 발행 시각)</span>
              <input type="date" value={f.published_at} onChange={(e) => set("published_at", e.target.value)} className={INPUT} />
            </label>
            <label className={LABEL}>분류
              <select value={f.category} onChange={(e) => set("category", e.target.value)} className={INPUT}>
                {POST_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </label>
            <label className={LABEL}>주소(슬러그) <span className="text-[11px]">/news/ 뒤에 붙는 부분. 제목에서 자동 생성</span>
              <input value={f.slug} onChange={(e) => setF((s) => ({ ...s, slug: e.target.value, slugTouched: true }))} onBlur={() => set("slug", slugify(f.slug))} className={INPUT} />
            </label>
          </div>
          <div className={`${CARD} p-[22px] grid gap-[12px]`}>
            <div className={SECTION}>대표 사진</div>
            <div className="relative w-full aspect-[3/2] bg-[#e7e0d3] overflow-hidden border border-[rgba(33,30,25,.1)]">
              {f.cover_image && <Image src={f.cover_image} alt="" fill sizes="320px" className="object-cover" unoptimized={f.cover_image.startsWith("http")} />}
            </div>
            <input ref={coverRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={(e) => { const x = e.target.files?.[0]; if (x) void onCover(x); }} />
            <div className="flex gap-[6px]">
              <button type="button" onClick={() => coverRef.current?.click()} disabled={uploading === "cover"} className={`${BTN_SECONDARY} px-[12px] py-[6px] text-[12px]`}>{uploading === "cover" ? "업로드 중…" : "사진 업로드"}</button>
              {f.cover_image && <button type="button" onClick={() => set("cover_image", "")} className="bg-transparent border-0 text-[12px] text-[rgba(33,30,25,.5)] cursor-pointer hover:text-error">비우기</button>}
            </div>
            <div className="text-[11.5px] text-[rgba(33,30,25,.5)]">가로 1200px 이상, 3:2 비율 권장. 목록 카드와 공유 미리보기에 쓰입니다.</div>
          </div>
        </div>
      </div>
    </>
  );
}
