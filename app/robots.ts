import type { MetadataRoute } from "next";
import { getSeo, siteUrl } from "@/lib/seo/get";
import { AI_BOTS } from "@/lib/seo/schema";

/** 회원·관리자·결제·API 영역은 항상 크롤링 제외 */
const PRIVATE = ["/admin", "/my", "/checkout", "/api", "/auth", "/login", "/join", "/programs"];

/**
 * robots.txt — 어드민 "SEO 설정" 값으로 매번 생성한다(DB 를 읽으므로 동적).
 * - 검색 노출 꺼짐: 검색엔진(*) 전체 차단. AI 크롤러 허용이 켜져 있으면 AI 봇만 공개 영역 허용
 * - 검색 노출 켜짐: 공개 영역 허용 + 사이트맵 안내
 */
export default async function robots(): Promise<MetadataRoute.Robots> {
  const seo = await getSeo();
  const rules: MetadataRoute.Robots["rules"] = [];
  if (seo.aiCrawlers) rules.push({ userAgent: AI_BOTS, allow: "/", disallow: PRIVATE });
  else rules.push({ userAgent: AI_BOTS, disallow: "/" });
  if (seo.indexing) rules.push({ userAgent: "*", allow: "/", disallow: PRIVATE });
  else rules.push({ userAgent: "*", disallow: "/" });
  return { rules, sitemap: seo.indexing ? `${siteUrl()}/sitemap.xml` : undefined, host: siteUrl() };
}
