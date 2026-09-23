import { createClient } from "@/lib/supabase/server";
import { POST_PAGE_SIZE, type Post } from "./types";

const COLS = "id, slug, title, category, summary, body, cover_image, published, published_at, created_at, updated_at";

/** 공개 목록 (발행된 글만, 최신순). RLS 가 비공개 글을 숨긴다. */
export async function listPublishedPosts(page = 1, size = POST_PAGE_SIZE): Promise<{ posts: Post[]; total: number; page: number; pages: number }> {
  const supabase = await createClient();
  const from = (page - 1) * size;
  const { data, count, error } = await supabase
    .from("posts")
    .select(COLS, { count: "exact" })
    .eq("published", true)
    .order("published_at", { ascending: false, nullsFirst: false })
    .range(from, from + size - 1);
  if (error) {
    console.error("[posts/list]", error);
    return { posts: [], total: 0, page: 1, pages: 1 };
  }
  const total = count ?? 0;
  return { posts: (data ?? []) as Post[], total, page, pages: Math.max(1, Math.ceil(total / size)) };
}

/** 사이트맵·llms.txt 용 (slug, 제목, 날짜만) */
export async function listPublishedPostsLite(limit = 500): Promise<Pick<Post, "slug" | "title" | "summary" | "published_at" | "updated_at">[]> {
  const supabase = await createClient();
  const { data } = await supabase.from("posts").select("slug, title, summary, published_at, updated_at").eq("published", true).order("published_at", { ascending: false, nullsFirst: false }).limit(limit);
  return (data ?? []) as Pick<Post, "slug" | "title" | "summary" | "published_at" | "updated_at">[];
}

export async function getPostBySlug(slug: string): Promise<Post | null> {
  if (!slug || slug.length > 120) return null;
  const supabase = await createClient();
  const { data } = await supabase.from("posts").select(COLS).eq("slug", slug).maybeSingle();
  return (data as Post | null) ?? null;
}

/** 어드민 목록 (전체, 최신 수정순) */
export async function listAllPosts(): Promise<Post[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("posts").select(COLS).order("updated_at", { ascending: false });
  if (error) {
    console.error("[posts/listAll]", error);
    return [];
  }
  return (data ?? []) as Post[];
}

export async function getPost(id: string): Promise<Post | null> {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
  const supabase = await createClient();
  const { data } = await supabase.from("posts").select(COLS).eq("id", id).maybeSingle();
  return (data as Post | null) ?? null;
}
