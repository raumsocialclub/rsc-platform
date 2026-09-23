import { getDoc } from "@/lib/cms/get";
import { listPublishedPostsLite } from "@/lib/posts/queries";
import { getSeo, siteUrl } from "@/lib/seo/get";
import { PUBLIC_PAGES } from "@/lib/seo/schema";
import { fmtDate } from "@/lib/posts/types";

/**
 * GET /llms.txt — AI 검색엔진용 사이트 소개 (llmstxt.org 형식).
 * 어드민 "SEO 설정 → AI 검색" 의 본문 뒤에 공개 페이지 목록과 최근 소식 20건을 자동으로 붙인다.
 */
export async function GET() {
  const seo = await getSeo();
  const base = siteUrl();
  const [pageDocs, posts] = await Promise.all([Promise.all(PUBLIC_PAGES.map((p) => getDoc(`seo.${p.key}`))), listPublishedPostsLite(20)]);
  const lines: string[] = [seo.llmsText.trim(), "", "## 주요 페이지"];
  PUBLIC_PAGES.forEach((p, i) => {
    const d = pageDocs[i];
    if (d.noindex === true) return;
    const desc = typeof d.description === "string" && d.description ? `: ${d.description}` : "";
    lines.push(`- [${typeof d.title === "string" && d.title ? d.title : p.label}](${base}${p.path})${desc}`);
  });
  if (posts.length) {
    lines.push("", "## 최근 소식");
    for (const p of posts) lines.push(`- [${p.title}](${base}/news/${encodeURIComponent(p.slug)})${p.published_at ? ` (${fmtDate(p.published_at)})` : ""}${p.summary ? `: ${p.summary}` : ""}`);
  }
  lines.push("", `## 사이트맵`, `- ${base}/sitemap.xml`, "");
  return new Response(lines.join("\n"), { headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "public, s-maxage=300, stale-while-revalidate=1800" } });
}
