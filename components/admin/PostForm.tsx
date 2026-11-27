"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { BTN_PRIMARY, BTN_SECONDARY, CARD } from "./ui";
import { fromKstIso } from "@/lib/programs/format";
import { POST_CATEGORIES, slugify, type Post } from "@/lib/posts/types";
import { byName, imageLine, MAX_W } from "@/lib/posts/images";
import { prepareImage } from "@/lib/posts/imageUpload";

type FormState = { title: string; slug: string; slugTouched: boolean; category: string; summary: string; body: string; cover_image: string; published: boolean; published_at: string; event_date: string; apply_open: boolean };

const LABEL = "grid gap-[6px] text-[13px] text-[rgba(55,56,60,.61)]";
const INPUT = "px-[14px] py-[13px] text-[14px] border border-[rgba(112,115,124,.22)] outline-none text-label bg-white rounded-ds-sm focus:border-primary w-full min-w-0";
const SECTION = "text-[15px] font-semibold text-label";

const HELP = [
  ["# 큰 제목", "## 중간 제목"],
  ["**굵게**", "*기울임*"],
  ["- 목록", "1. 번호 목록"],
  ["> 인용문", "--- (구분선)"],
  ["[문구](https://…)", "![](사진주소) 사진 · ![설명](사진주소) 캡션 있는 사진"],
];

function initial(p?: Post): FormState {
  if (!p) return { title: "", slug: "", slugTouched: false, category: POST_CATEGORIES[0], summary: "", body: "", cover_image: "", published: false, published_at: "", event_date: "", apply_open: true };
  return { title: p.title, slug: p.slug, slugTouched: true, category: p.category, summary: p.summary ?? "", body: p.body, cover_image: p.cover_image ?? "", published: p.published, published_at: p.published_at ? fromKstIso(p.published_at).date : "", event_date: p.event_date ? p.event_date.slice(0, 10) : "", apply_open: p.apply_open !== false };
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
  const [progress, setProgress] = useState("");
  const set = <K extends keyof FormState>(k: K, v: FormState[K]) => setF((s) => ({ ...s, [k]: v }));

  const uploadBlob = async (blob: Blob, name: string): Promise<string> => {
    const fd = new FormData();
    fd.append("file", blob, name);
    const res = await fetch("/api/admin/upload?bucket=site", { method: "POST", body: fd });
    const j = (await res.json().catch(() => null)) as { ok?: boolean; url?: string; message?: string } | null;
    if (!j?.ok || !j.url) throw new Error(j?.message ?? "업로드하지 못했습니다.");
    return j.url;
  };
  const onCover = async (file: File) => {
    setUploading("cover"); setErr(null);
    try { const [blob] = await prepareImage(file, 1); set("cover_image", await uploadBlob(blob, file.name)); } catch (e) { setErr(e instanceof Error ? e.message : "업로드하지 못했습니다."); } finally { setUploading(null); if (coverRef.current) coverRef.current.value = ""; }
  };
  /** 여러 장을 한 번에: 파일 이름 순(01, 02 …)으로 올리고, 긴 사진은 조각으로 나눠 올린 뒤 커서 위치에 사진 줄을 이어서 넣는다 */
  const onBodyImages = async (list: FileList | File[]) => {
    const files = Array.from(list).sort(byName);
    if (!files.length) return;
    setUploading("body"); setErr(null);
    const urls: string[] = [];
    try {
      for (let i = 0; i < files.length; i++) {
        setProgress(files.length > 1 ? `${i + 1}/${files.length}장 준비 중…` : "준비 중…");
        const blobs = await prepareImage(files[i]);
        for (let j = 0; j < blobs.length; j++) {
          setProgress(files.length > 1 ? `${i + 1}/${files.length}장 올리는 중…${blobs.length > 1 ? ` (${j + 1}/${blobs.length}조각)` : ""}` : blobs.length > 1 ? `올리는 중… (${j + 1}/${blobs.length}조각)` : "올리는 중…");
          urls.push(await uploadBlob(blobs[j], files[i].name));
        }
      }
    } catch (e) {
      setErr(e instanceof Error ? e.message : "업로드하지 못했습니다.");
    } finally {
      setUploading(null); setProgress("");
      if (bodyFileRef.current) bodyFileRef.current.value = "";
    }
    if (!urls.length) return;
    const ta = bodyRef.current;
    const pos = ta ? ta.selectionStart : f.body.length;
    const before = f.body.slice(0, pos);
    const after = f.body.slice(pos);
    // 사진 줄 사이는 빈 줄 없이 붙여야 공개 화면에서 한 장처럼 이어진다. 앞뒤 글과는 빈 줄로 띄운다
    const snippet = (before && !before.endsWith("\n\n") ? (before.endsWith("\n") ? "\n" : "\n\n") : "") + urls.map(imageLine).join("\n") + (after && !after.startsWith("\n\n") ? (after.startsWith("\n") ? "\n" : "\n\n") : "");
    set("body", before + snippet + after);
  };

  const submit = async (publish?: boolean) => {
    setBusy(true); setErr(null); setMsg(null);
    try {
      const payload = { title: f.title, slug: f.slug || slugify(f.title), category: f.category, summary: f.summary, body: f.body, cover_image: f.cover_image, published: publish ?? f.published, published_at: f.published_at, event_date: f.event_date, apply_open: f.apply_open };
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
          <div className="text-[11px] tracking-[.02em] text-[rgba(55,56,60,.61)] mb-[10px]"><Link href="/admin/posts" className="hover:text-primaryStrong">NEWS</Link> / {post ? "EDIT" : "NEW"}</div>
          <h1 className="font-medium t-title-2 m-0">{post ? "소식 편집" : "새 글 쓰기"}</h1>
        </div>
        <div className="flex gap-[8px] items-center flex-wrap">
          {post?.published && <Link href={`/news/${encodeURIComponent(post.slug)}`} target="_blank" className="text-[13px] text-[rgba(55,56,60,.61)] underline mr-[6px]">공개 화면 보기 ↗</Link>}
          {post && <button type="button" onClick={remove} disabled={busy} className={`${BTN_SECONDARY} text-negativeFg border-[rgba(255,66,66,.4)]`}>삭제</button>}
          <button type="button" onClick={() => submit(false)} disabled={busy} className={BTN_SECONDARY}>{busy ? "저장 중…" : "임시 저장"}</button>
          <button type="button" onClick={() => submit(true)} disabled={busy} className={BTN_PRIMARY}>{busy ? "저장 중…" : f.published ? "저장 (발행 유지)" : "발행하기"}</button>
        </div>
      </div>
      {err && <div className="mb-[16px] px-[16px] py-[12px] bg-[rgba(255,66,66,.08)] text-negativeFg text-[13px]">{err}</div>}
      {msg && <div className="mb-[16px] px-[16px] py-[12px] bg-[rgba(0,191,64,.08)] text-[#009632] text-[13px]">{msg}</div>}

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
                  <input ref={bodyFileRef} type="file" multiple accept="image/jpeg,image/png,image/webp" className="hidden" onChange={(e) => { if (e.target.files?.length) void onBodyImages(e.target.files); }} />
                  <button type="button" onClick={() => bodyFileRef.current?.click()} disabled={uploading === "body"} className={`${BTN_SECONDARY} px-[12px] py-[6px] text-[12px]`}>{uploading === "body" ? progress || "업로드 중…" : "본문에 사진 넣기 (여러 장 가능)"}</button>
                </div>
              </div>
              <textarea ref={bodyRef} value={f.body} onChange={(e) => set("body", e.target.value)} onDragOver={(e) => { if (e.dataTransfer.types.includes("Files")) e.preventDefault(); }} onDrop={(e) => { const fs = Array.from(e.dataTransfer.files).filter((x) => x.type.startsWith("image/")); if (fs.length) { e.preventDefault(); void onBodyImages(fs); } }} rows={22} className={`${INPUT} font-mono text-[14px] leading-[1.7]`} placeholder={"빈 줄로 문단을 나눕니다.\n\n## 소제목\n본문 내용…\n\n사진은 「본문에 사진 넣기」 또는 이 칸에 끌어다 놓기"} />
              <div className="text-[12px] text-[rgba(55,56,60,.61)] leading-[1.7] grid gap-[2px]">
                <div><b className="text-label">상세 페이지 사진 넣는 법</b> — 통으로 긴 한 장이든, 잘라 둔 여러 장이든 그대로 올리면 됩니다(여러 장은 파일 이름 순 01, 02…로 들어감). 긴 사진은 자동으로 조각내어 올리고, 공개 화면에서는 붙어 있는 사진 줄을 틈 없이 한 장처럼 이어 보여 줍니다.</div>
                <div>권장 크기: 가로 <b className="text-label">1200px</b>(최대 {MAX_W}px, 더 크면 자동 축소) · 세로 자유 · JPG·PNG·WEBP. 사진 사이에 글을 넣으려면 사진 줄 사이에 빈 줄을 두고 쓰세요. 대괄호 안에 설명을 적으면 사진 아래 캡션으로 보입니다.</div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-[6px] text-[12px] text-[rgba(55,56,60,.61)]">
                {HELP.map(([a, b], i) => <div key={i}><code className="text-label">{a}</code><br /><code className="text-label">{b}</code></div>)}
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-[20px]">
          <div className={`${CARD} p-[22px] grid gap-[16px]`}>
            <div className={SECTION}>발행</div>
            <label className="flex items-center gap-[10px] text-[14px]">
              <input type="checkbox" checked={f.published} onChange={(e) => set("published", e.target.checked)} /> 공개 화면에 표시
            </label>
            <label className={LABEL}>행사 일자 <span className="text-[11px]">(소식 목록의 연도·월 탭에 들어갈 달. 비우면 발행일로 분류)</span>
              <input type="date" value={f.event_date} onChange={(e) => set("event_date", e.target.value)} className={INPUT} />
            </label>
            <label className="flex items-start gap-[10px] text-[14px]">
              <input type="checkbox" checked={f.apply_open} onChange={(e) => set("apply_open", e.target.checked)} className="mt-[3px]" />
              <span>「참여하기」 버튼 표시<br /><span className="text-[11px] text-[rgba(55,56,60,.61)]">소식 목록 카드와 상세에 버튼이 보이고, 누르면 사전등록 설문(3분 프로필 설문)으로 갑니다. 설문을 마치면 어드민 「가입 신청」에 「참여 신청 · 이 글 제목」으로 들어옵니다. 공지처럼 참여를 받지 않는 글은 끄세요.</span></span>
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
            <div className="relative w-full aspect-[4/5] bg-[#f4f4f5] overflow-hidden border border-[rgba(112,115,124,.08)]">
              {f.cover_image && <Image src={f.cover_image} alt="" fill sizes="320px" className="object-cover" unoptimized={f.cover_image.startsWith("http")} />}
            </div>
            <input ref={coverRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={(e) => { const x = e.target.files?.[0]; if (x) void onCover(x); }} />
            <div className="flex gap-[6px]">
              <button type="button" onClick={() => coverRef.current?.click()} disabled={uploading === "cover"} className={`${BTN_SECONDARY} px-[12px] py-[6px] text-[12px]`}>{uploading === "cover" ? "업로드 중…" : "사진 업로드"}</button>
              {f.cover_image && <button type="button" onClick={() => set("cover_image", "")} className="bg-transparent border-0 text-[12px] text-[rgba(55,56,60,.61)] cursor-pointer hover:text-negativeFg">비우기</button>}
            </div>
            <div className="text-[12px] text-[rgba(55,56,60,.61)]">인스타그램 피드 이미지(1080×1350, 4:5) 권장. 목록에서는 모든 카드가 4:5 상자로 같은 크기로 정렬되며, 비율이 다른 사진은 가운데 기준으로 상자에 맞춰집니다. 상세와 공유 미리보기는 원본 비율입니다.</div>
          </div>
        </div>
      </div>
    </>
  );
}
