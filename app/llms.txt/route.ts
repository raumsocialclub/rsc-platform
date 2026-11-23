import { getDoc } from "@/lib/cms/get";
import { listPublishedPostsLite } from "@/lib/posts/queries";
import { getSeo, siteUrl } from "@/lib/seo/get";
import { PUBLIC_PAGES } from "@/lib/seo/schema";
import { fmtDate } from "@/lib/posts/types";
import { getSettings } from "@/lib/settings/get";
import { isLeadHiddenPath } from "@/lib/settings/leadMode";
import { llmsPreview, stripMatchingText } from "@/lib/settings/matchPreview";
import { MATCHCHECK_HIDDEN_SEO, isMatchHiddenPath, llmsHidden, matchVisibility } from "@/lib/settings/matchHidden";

/**
 * GET /llms.txt — AI 검색엔진용 사이트 소개 (llmstxt.org 형식).
 * 어드민 "SEO 설정 → AI 검색" 의 본문 뒤에 공개 페이지 목록과 최근 소식 20건을 자동으로 붙인다.
 * 리드 모드면 숨김 페이지(가격·환불규정)를 뺀다. 본문의 금액 줄은 2026-11-12 부터 그대로 둔다 — 1:1 매칭 가입비는 결혼중개업 공개 항목.
 * 1:1 매칭 사전등록 모드(2026-11-20)면 본문의 1:1 매칭 상세(플랜·가입비·회원 행사)를 빼고 /matching 은 사전등록 안내로 소개한다.
 * 1:1 매칭 전체 숨김(2026-11-23)이면 1:1 매칭 줄을 모두 빼고 /matching 은 목록에서도 뺀다. /match-check 는 소셜클럽 사전등록 제목·설명으로 소개한다.
 */
export async function GET() {
  const [seo, settings] = await Promise.all([getSeo(), getSettings()]);
  const lead = settings.leadMode;
  const base = siteUrl();
  const { hidden, preview } = matchVisibility(settings);
  const [pageDocs, posts, pv] = await Promise.all([Promise.all(PUBLIC_PAGES.map((p) => getDoc(`seo.${p.key}`))), listPublishedPostsLite(20), preview ? getDoc("matching.preview") : Promise.resolve<Record<string, unknown>>({})]);
  const intro = hidden ? llmsHidden(seo.llmsText) : preview ? llmsPreview(seo.llmsText) : seo.llmsText;
  const lines: string[] = [intro.trim(), "", "## 주요 페이지"];
  PUBLIC_PAGES.forEach((p, i) => {
    const d = pageDocs[i];
    if (d.noindex === true) return;
    if (lead && isLeadHiddenPath(p.path)) return;
    if (hidden && isMatchHiddenPath(p.path)) return;
    if (hidden && p.key === "matchcheck") { lines.push(`- [${MATCHCHECK_HIDDEN_SEO.title}](${base}${p.path}): ${MATCHCHECK_HIDDEN_SEO.description}`); return; }
    if (preview && p.key === "matching") {
      const t = typeof pv.seoTitle === "string" && pv.seoTitle ? pv.seoTitle : "1:1 매칭 사전등록";
      lines.push(`- [${t}](${base}${p.path})${typeof pv.seoDescription === "string" && pv.seoDescription ? `: ${pv.seoDescription}` : ""}`);
      return;
    }
    const clean = (v: string) => (hidden ? stripMatchingText(v) : v); // 전체 숨김이면 페이지 설명(예: 멤버십 안내의 「1:1 매칭(RAUM CLASSIC …)」)에서도 뺀다
    const desc0 = clean(typeof d.description === "string" ? d.description : "");
    const desc = desc0 ? `: ${desc0}` : "";
    lines.push(`- [${clean(typeof d.title === "string" && d.title ? d.title : p.label) || p.label}](${base}${p.path})${desc}`);
  });
  if (posts.length) {
    lines.push("", "## 최근 소식");
    for (const p of posts) lines.push(`- [${p.title}](${base}/news/${encodeURIComponent(p.slug)})${p.published_at ? ` (${fmtDate(p.published_at)})` : ""}${p.summary ? `: ${p.summary}` : ""}`);
  }
  lines.push("", `## 사이트맵`, `- ${base}/sitemap.xml`, "");
  return new Response(lines.join("\n"), { headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "public, s-maxage=300, stale-while-revalidate=1800" } });
}
