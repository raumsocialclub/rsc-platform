import { revalidatePath } from "next/cache";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { PostInput } from "./schema";
import { toKstIso } from "@/lib/programs/format";

/** 입력값 → DB 행. 발행일이 비어 있고 발행 상태면 지금 시각 */
export function toRow(input: PostInput, existingPublishedAt?: string | null) {
  let published_at: string | null = existingPublishedAt ?? null;
  if (input.published_at) {
    if (/^\d{4}-\d{2}-\d{2}$/.test(input.published_at)) published_at = toKstIso(input.published_at, "09:00");
    else published_at = Number.isNaN(Date.parse(input.published_at)) ? null : new Date(input.published_at).toISOString();
  }
  if (input.published && !published_at) published_at = new Date().toISOString();
  return {
    title: input.title,
    slug: input.slug,
    category: input.category,
    summary: input.summary || null,
    body: input.body,
    cover_image: input.cover_image || null,
    published: input.published,
    published_at,
  };
}

/** 소식 저장 후 공개 화면·사이트맵 캐시 갱신 */
export function revalidateNews(slug?: string, prevSlug?: string | null) {
  revalidatePath("/news");
  revalidatePath("/");
  if (slug) revalidatePath(`/news/${encodeURIComponent(slug)}`);
  if (prevSlug && prevSlug !== slug) revalidatePath(`/news/${encodeURIComponent(prevSlug)}`);
  revalidatePath("/sitemap.xml");
  revalidatePath("/llms.txt");
}

export async function slugTaken(supabase: SupabaseClient, slug: string, exceptId?: string): Promise<boolean> {
  let q = supabase.from("posts").select("id", { count: "exact", head: true }).eq("slug", slug);
  if (exceptId) q = q.neq("id", exceptId);
  const { count } = await q;
  return (count ?? 0) > 0;
}
