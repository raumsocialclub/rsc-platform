import type { Metadata } from "next";
import Link from "next/link";
import { SiteEditor } from "@/components/admin/SiteEditor";
import { CARD, PageTitle } from "@/components/admin/ui";
import { mergeDoc } from "@/lib/cms/get";
import { DOCS, DOC_BY_ID, PAGES } from "@/lib/cms/schema";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "사이트 관리" };

/** 사이트 관리: 페이지 탭 → 문서 목록 → 편집기. 문구·사진·색상·연락처를 코드 수정 없이 바꾼다. (M9) */
export default async function AdminSitePage({ searchParams }: { searchParams: Promise<{ page?: string; doc?: string }> }) {
  const sp = await searchParams;
  const page = PAGES.find((p) => p.key === sp.page)?.key ?? "global";
  const docs = DOCS.filter((d) => d.page === page);
  const def = (sp.doc && DOC_BY_ID.get(sp.doc)?.page === page ? DOC_BY_ID.get(sp.doc) : docs[0])!;
  const supabase = await createClient();
  const [{ data: rows }, { data: row }] = await Promise.all([
    supabase.from("site_content").select("id, updated_at").eq("page", page),
    supabase.from("site_content").select("data, updated_at").eq("id", def.id).maybeSingle(),
  ]);
  const updated = new Map((rows ?? []).map((r) => [r.id as string, r.updated_at as string]));
  const initial = mergeDoc(def, (row?.data ?? null) as Record<string, unknown> | null);
  const preview = PAGES.find((p) => p.key === page)!.preview;

  return (
    <>
      <PageTitle overline="SITE" title="사이트 관리">
        <div className="flex gap-[6px] flex-wrap">
          {PAGES.map((p) => (
            <Link key={p.key} href={`/admin/site?page=${p.key}`} className="border border-[rgba(33,30,25,.2)] px-[16px] py-[8px] rounded-pill text-[12.5px] font-semibold" style={{ background: p.key === page ? "#5a3d24" : "transparent", color: p.key === page ? "#f7f3ec" : "#5a3d24" }}>
              {p.label}
            </Link>
          ))}
        </div>
      </PageTitle>
      <div className="grid grid-cols-1 min-[1101px]:grid-cols-[260px_minmax(0,1fr)] gap-[20px] items-start">
        <div className={`${CARD} p-[10px] grid gap-[2px]`}>
          {docs.map((d) => {
            const active = d.id === def.id;
            const u = updated.get(d.id);
            return (
              <Link key={d.id} href={`/admin/site?page=${page}&doc=${d.id}`} className="px-[12px] py-[10px] text-[13px] rounded-[4px]" style={{ background: active ? "rgba(226,180,120,.25)" : "transparent", fontWeight: active ? 600 : 500 }}>
                {d.label}
                <span className="block text-[11px] text-[rgba(33,30,25,.45)]">{u ? "수정됨" : "기본값"}</span>
              </Link>
            );
          })}
        </div>
        <SiteEditor key={`${def.id}-${row?.updated_at ?? "default"}`} def={def} initial={initial} previewHref={preview} updatedAt={(row?.updated_at as string | undefined) ?? null} />
      </div>
    </>
  );
}
