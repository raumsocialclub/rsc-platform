import type { Metadata } from "next";
import Image from "next/image";
import { SiteEditor } from "@/components/admin/SiteEditor";
import { CARD, PageTitle } from "@/components/admin/ui";
import { mergeDoc } from "@/lib/cms/get";
import { absUrl, getSeo, siteUrl } from "@/lib/seo/get";
import { SEO_DOCS, PUBLIC_PAGES } from "@/lib/seo/schema";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "SEO 설정" };

const CONSOLE_GUIDE = [
  ["1. 실도메인 연결 후", "www.raumsocialclub.co.kr 같은 실도메인을 연결한 뒤에 등록합니다. 지금 .vercel.app 주소로 등록하면 도메인 변경 때 다시 해야 합니다."],
  ["2. 구글 서치콘솔", "search.google.com/search-console → 속성 추가 → 'URL 접두어' 에 https://도메인 입력 → 확인 방법 중 'HTML 태그' 선택 → content=\"…\" 안의 값만 복사 → 아래 '검색엔진 소유 확인 → 구글' 에 붙여넣고 저장 → 서치콘솔에서 '확인' 클릭. 이후 왼쪽 메뉴 Sitemaps 에 sitemap.xml 입력 → 제출."],
  ["3. 네이버 서치어드바이저", "searchadvisor.naver.com → 웹마스터 도구 → 사이트 등록(https://도메인) → 'HTML 태그' 방식 → content=\"…\" 값 복사 → 아래 '네이버' 칸에 붙여넣고 저장 → 서치어드바이저에서 '소유확인'. 이후 요청 → 사이트맵 제출에 https://도메인/sitemap.xml, 검증 → robots.txt 검증."],
  ["4. 오픈 때", "위 '검색 노출 · 공유 기본값' 의 '검색 노출 켜기' 를 켜고 저장하면 robots.txt 와 사이트맵이 검색엔진에 열립니다. 켜기 전까지는 어떤 페이지도 검색에 잡히지 않습니다."],
];

/** SEO · GEO 설정 (M11): 상태 패널 + seo.* 문서 편집기 + 검색엔진 등록 안내 */
export default async function AdminSeoPage() {
  const supabase = await createClient();
  const [{ data: rows }, seo, { count: postCount }] = await Promise.all([
    supabase.from("site_content").select("id, data, updated_at").eq("page", "seo"),
    getSeo(),
    supabase.from("posts").select("id", { count: "exact", head: true }).eq("published", true),
  ]);
  const byId = new Map((rows ?? []).map((r) => [r.id as string, r]));
  const base = siteUrl();
  const og = absUrl(seo.ogImage);
  const status: [string, React.ReactNode][] = [
    ["검색 노출", seo.indexing ? <b className="text-[#2e6b3e]">켜짐 — 검색엔진이 사이트를 수집합니다</b> : <b className="text-[#a3402c]">꺼짐 — 오픈 전 상태 (검색 제외)</b>],
    ["AI 크롤러", seo.aiCrawlers ? "허용 (GPTBot · ClaudeBot · PerplexityBot · Google-Extended …)" : "차단"],
    ["구글 소유 확인", seo.google ? "코드 등록됨" : "미등록 (실도메인 연결 후)"],
    ["네이버 소유 확인", seo.naver ? "코드 등록됨" : "미등록 (실도메인 연결 후)"],
    ["사이트 주소", base],
    ["발행된 소식", `${postCount ?? 0}건 (사이트맵·llms.txt 에 자동 포함)`],
  ];
  const links = [
    ["robots.txt", `${base}/robots.txt`],
    ["sitemap.xml", `${base}/sitemap.xml`],
    ["llms.txt", `${base}/llms.txt`],
  ];
  const general = SEO_DOCS.filter((d) => !PUBLIC_PAGES.some((p) => d.id === `seo.${p.key}`));
  const pages = SEO_DOCS.filter((d) => PUBLIC_PAGES.some((p) => d.id === `seo.${p.key}`));

  return (
    <>
      <PageTitle overline="SEO · GEO" title="SEO 설정" />
      <div className={`${CARD} p-[22px] mb-[20px]`}>
        <div className="text-[12px] tracking-[.2em] text-[rgba(33,30,25,.5)] mb-[12px]">현재 상태</div>
        <div className="grid grid-cols-1 md:grid-cols-[minmax(0,1fr)_260px] gap-[24px]">
          <div className="grid gap-y-[8px] text-[13.5px]">
            {status.map(([k, v]) => <div key={k} className="flex justify-between gap-[12px] border-b border-[rgba(33,30,25,.08)] pb-[6px]"><span className="text-[rgba(33,30,25,.55)] flex-none">{k}</span><span className="text-right">{v}</span></div>)}
            <div className="flex gap-[14px] flex-wrap text-[12.5px] mt-[6px]">
              {links.map(([k, href]) => <a key={k} href={href} target="_blank" rel="noreferrer" className="text-brown font-semibold underline">{k} ↗</a>)}
            </div>
          </div>
          <div>
            <div className="text-[11px] tracking-[.2em] text-[rgba(33,30,25,.5)] mb-[8px]">공유 미리보기 (카카오톡 · 인스타)</div>
            <div className="border border-[rgba(33,30,25,.14)] bg-[#faf7f1]">
              <div className="relative w-full aspect-[1200/630] bg-[#e7e0d3] overflow-hidden">{og && <Image src={og} alt="" fill sizes="260px" className="object-cover" unoptimized />}</div>
              <div className="p-[12px]">
                <div className="text-[13px] font-semibold leading-[1.4] line-clamp-2">{(byId.get("seo.home")?.data as Record<string, string> | undefined)?.title || "라움소셜클럽 | 검증된 싱글 라이프스타일 커뮤니티"}</div>
                <div className="text-[11.5px] text-[rgba(33,30,25,.55)] leading-[1.5] mt-[4px] line-clamp-2">{seo.defaultDescription}</div>
                <div className="text-[10.5px] text-[rgba(33,30,25,.4)] mt-[6px]">{base.replace(/^https?:\/\//, "")}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-[20px]">
        {general.map((def) => {
          const row = byId.get(def.id);
          return (
            <div key={def.id} id={def.id} className="border-t border-[rgba(33,30,25,.12)] pt-[20px]">
              <SiteEditor key={`${def.id}-${row?.updated_at ?? "default"}`} def={def} initial={mergeDoc(def, (row?.data ?? null) as Record<string, unknown> | null)} previewHref="/" updatedAt={(row?.updated_at as string | undefined) ?? null} />
            </div>
          );
        })}
        <div className="border-t border-[rgba(33,30,25,.12)] pt-[20px]">
          <div className="text-[12px] tracking-[.2em] text-[rgba(33,30,25,.5)] mb-[6px]">페이지별 제목 · 설명</div>
          <div className="text-[12.5px] text-[rgba(33,30,25,.55)] mb-[16px]">검색 결과와 공유 카드에 보이는 제목·설명입니다. 제목 뒤에는 위 &lsquo;브랜드명&rsquo; 이 자동으로 붙습니다(메인 제외).</div>
          <div className="grid gap-[20px]">
            {pages.map((def) => {
              const row = byId.get(def.id);
              const p = PUBLIC_PAGES.find((x) => def.id === `seo.${x.key}`)!;
              return <SiteEditor key={`${def.id}-${row?.updated_at ?? "default"}`} def={def} initial={mergeDoc(def, (row?.data ?? null) as Record<string, unknown> | null)} previewHref={p.path} updatedAt={(row?.updated_at as string | undefined) ?? null} />;
            })}
          </div>
        </div>
      </div>

      <div className={`${CARD} p-[22px] mt-[28px]`}>
        <div className="text-[12px] tracking-[.2em] text-[rgba(33,30,25,.5)] mb-[6px]">검색엔진 등록 순서 (실도메인 연결 후)</div>
        <div className="grid gap-[12px] mt-[12px]">
          {CONSOLE_GUIDE.map(([k, v]) => <div key={k} className="grid md:grid-cols-[180px_1fr] gap-[6px] md:gap-[16px] text-[13.5px] leading-[1.7]"><b>{k}</b><span className="text-[rgba(33,30,25,.75)]">{v}</span></div>)}
        </div>
      </div>
    </>
  );
}
