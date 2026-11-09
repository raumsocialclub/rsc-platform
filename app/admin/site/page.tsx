import type { Metadata } from "next";
import Link from "next/link";
import { SiteEditor } from "@/components/admin/SiteEditor";
import { CARD, FIELD, PageTitle } from "@/components/admin/ui";
import { mergeDoc, type DocData } from "@/lib/cms/get";
import { DOCS, DOC_BY_ID, PAGES } from "@/lib/cms/schema";
import { searchDocs } from "@/lib/cms/search";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "사이트 관리" };

/**
 * 사이트 관리: 페이지 탭 → 섹션 목록 → 편집기. 문구·사진·색상·연락처를 코드 수정 없이 바꾼다. (M9 → M17: 모든 공개 문구 편입 + 문구 검색)
 * 「문구 검색」에 사이트에서 본 문장을 붙여 넣으면 어느 탭 → 어느 섹션 → 어느 항목인지 바로 찾아 준다.
 */
export default async function AdminSitePage({ searchParams }: { searchParams: Promise<{ page?: string; doc?: string; q?: string }> }) {
  const sp = await searchParams;
  const q = (sp.q ?? "").trim();
  const supabase = await createClient();

  // 검색: 모든 문서의 현재 값(기본값 + 저장값)에서 찾는다
  let hits: ReturnType<typeof searchDocs> = [];
  if (q) {
    const ids = DOCS.filter((d) => !d.hidden).map((d) => d.id);
    const { data: all } = await supabase.from("site_content").select("id, data").in("id", ids);
    const saved = new Map((all ?? []).map((r) => [r.id as string, (r.data ?? {}) as DocData]));
    const merged: Record<string, DocData> = {};
    for (const d of DOCS) if (!d.hidden) merged[d.id] = mergeDoc(d, saved.get(d.id));
    hits = searchDocs(merged, q);
  }

  const page = PAGES.find((p) => p.key === sp.page)?.key ?? (hits[0]?.page ?? "global");
  // 섹션은 라벨의 번호(00, 00-1, 01 …) 순으로 — 화면 위에서 아래 순서와 같게
  const docs = DOCS.filter((d) => d.page === page && !d.hidden).sort((a, b) => a.label.localeCompare(b.label, "ko", { numeric: true }));
  const requested = sp.doc ? DOC_BY_ID.get(sp.doc) : undefined;
  const def = (requested && requested.page === page && !requested.hidden ? requested : docs[0])!;
  const [{ data: rows }, { data: row }] = await Promise.all([
    supabase.from("site_content").select("id, updated_at").in("id", docs.map((d) => d.id)),
    supabase.from("site_content").select("data, updated_at").eq("id", def.id).maybeSingle(),
  ]);
  const updated = new Map((rows ?? []).map((r) => [r.id as string, r.updated_at as string]));
  const initial = mergeDoc(def, (row?.data ?? null) as Record<string, unknown> | null);
  const pageDef = PAGES.find((p) => p.key === page)!;
  const preview = `${pageDef.preview}${def.anchor ?? ""}`;

  return (
    <>
      <PageTitle overline="SITE" title="사이트 관리">
        <div className="flex gap-[6px] flex-wrap">
          {PAGES.map((p) => (
            <Link key={p.key} href={`/admin/site?page=${p.key}`} className="border border-[rgba(112,115,124,.22)] px-[16px] py-[8px] rounded-pill text-[13px] font-semibold" style={{ background: p.key === page ? "#0066ff" : "transparent", color: p.key === page ? "#ffffff" : "#0066ff" }}>
              {p.label}
            </Link>
          ))}
        </div>
      </PageTitle>

      {/* 문구 검색 */}
      <form action="/admin/site" method="get" className={`${CARD} p-[14px] md:p-[16px] mb-[20px] grid gap-[10px] md:grid-cols-[minmax(0,1fr)_auto] md:items-center`}>
        <label className="grid gap-[6px] text-[13px] text-[rgba(55,56,60,.61)]">
          <span>문구 검색 <span className="text-[11px] text-[rgba(55,56,60,.28)]">사이트에서 본 문장을 그대로 붙여 넣으면 어디서 고치는지 찾아 드립니다</span></span>
          <input name="q" defaultValue={q} placeholder="예: 아무나, 들어올 수 없습니다" className={FIELD} />
        </label>
        <div className="flex gap-[8px] md:pt-[22px]">
          <button type="submit" className="bg-[#0066ff] text-white border-0 rounded-[6px] px-[16px] py-[10px] text-[13px] font-semibold cursor-pointer">찾기</button>
          {q && <Link href="/admin/site" className="border border-[rgba(112,115,124,.22)] rounded-[6px] px-[14px] py-[10px] text-[13px] font-semibold text-[rgba(55,56,60,.61)]">지우기</Link>}
        </div>
        {q && (
          <div className="md:col-span-2 grid gap-[4px]">
            <div className="text-[12px] text-[rgba(55,56,60,.61)]">“{q}” 검색 결과 {hits.length}건{hits.length >= 40 ? " (최대 40건까지 표시)" : ""}</div>
            {hits.length === 0 ? (
              <div className="text-[13px] text-[rgba(55,56,60,.61)] py-[6px]">일치하는 문구가 없습니다. 더 짧은 단어로 다시 찾아보세요. 글(소식)·프로그램 내용은 각 메뉴에서, 일반 설정·SEO 문구는 해당 메뉴에서 관리합니다.</div>
            ) : (
              hits.map((h, i) => (
                <Link key={i} href={`/admin/site?page=${h.page}&doc=${h.docId}`} className="grid gap-[2px] px-[10px] py-[8px] rounded-[6px] hover:bg-[rgba(0,102,255,.06)] border border-transparent hover:border-[rgba(0,102,255,.18)]">
                  <span className="text-[12px] text-[#0066ff] font-semibold">{h.pageLabel} › {h.docLabel} › {h.field}</span>
                  <span className="text-[13px] text-[#171719]">{h.snippet}</span>
                </Link>
              ))
            )}
          </div>
        )}
      </form>

      <div className="grid grid-cols-1 min-[1101px]:grid-cols-[280px_minmax(0,1fr)] gap-[20px] items-start">
        <div className={`${CARD} p-[10px] grid gap-[2px]`}>
          <div className="px-[12px] pt-[6px] pb-[8px] text-[11px] tracking-[.04em] text-[rgba(55,56,60,.61)] flex items-center justify-between">
            <span>{pageDef.label} · 섹션 {docs.length}개</span>
            <a href={pageDef.preview} target="_blank" rel="noreferrer" className="text-[#0066ff]">페이지 보기 ↗</a>
          </div>
          {docs.map((d) => {
            const active = d.id === def.id;
            const u = updated.get(d.id);
            return (
              <Link key={d.id} href={`/admin/site?page=${page}&doc=${d.id}`} className="px-[12px] py-[10px] text-[13px] rounded-[4px]" style={{ background: active ? "rgba(255,146,0,.14)" : "transparent", fontWeight: active ? 600 : 500 }}>
                {d.label}
                <span className="block text-[11px] text-[rgba(55,56,60,.61)]">{u ? `수정됨 · ${new Date(u).toLocaleDateString("ko-KR", { timeZone: "Asia/Seoul" })}` : "기본값"}</span>
              </Link>
            );
          })}
        </div>
        <SiteEditor key={`${def.id}-${row?.updated_at ?? "default"}`} def={def} initial={initial} previewHref={preview} updatedAt={(row?.updated_at as string | undefined) ?? null} />
      </div>
    </>
  );
}
