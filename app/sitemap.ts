import type { MetadataRoute } from "next";
import { getDoc } from "@/lib/cms/get";
import { listPublishedPostsLite } from "@/lib/posts/queries";
import { getSeo, siteUrl } from "@/lib/seo/get";
import { PUBLIC_PAGES } from "@/lib/seo/schema";
import { getSettings } from "@/lib/settings/get";
import { isLeadHiddenPath } from "@/lib/settings/leadMode";

/** sitemap.xml — 공개 페이지(검색 제외 표시 안 된 것) + 발행된 소식. 검색 노출이 꺼져 있으면 비어 있다. 리드 모드면 숨김 페이지(가격·환불규정)도 뺀다. */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [seo, settings] = await Promise.all([getSeo(), getSettings()]);
  if (!seo.indexing) return [];
  const base = siteUrl();
  const pageDocs = await Promise.all(PUBLIC_PAGES.map((p) => getDoc(`seo.${p.key}`)));
  const out: MetadataRoute.Sitemap = PUBLIC_PAGES.filter((p, i) => pageDocs[i].noindex !== true && !(settings.leadMode && isLeadHiddenPath(p.path))).map((p) => ({
    url: `${base}${p.path}`,
    changeFrequency: p.changeFrequency,
    priority: p.priority,
  }));
  const posts = await listPublishedPostsLite();
  for (const p of posts) {
    out.push({ url: `${base}/news/${encodeURIComponent(p.slug)}`, lastModified: p.updated_at, changeFrequency: "monthly", priority: 0.6 });
  }
  return out;
}
