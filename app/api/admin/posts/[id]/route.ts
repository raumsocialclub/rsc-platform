import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/admin/guard";
import { logAdmin } from "@/lib/admin/log";
import { revalidateNews, slugTaken, toRow } from "@/lib/posts/admin";
import { PostInputSchema, firstIssue } from "@/lib/posts/schema";
import { createClient } from "@/lib/supabase/server";

type Ctx = { params: Promise<{ id: string }> };
const Id = z.string().uuid();

/** PUT /api/admin/posts/[id] — 전체 저장 */
export async function PUT(req: Request, ctx: Ctx) {
  const me = await requireAdmin();
  if (!me) return NextResponse.json({ ok: false, message: "관리자만 사용할 수 있습니다." }, { status: 403 });
  const { id } = await ctx.params;
  if (!Id.safeParse(id).success) return NextResponse.json({ ok: false, message: "잘못된 요청입니다." }, { status: 400 });
  const parsed = PostInputSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ ok: false, message: firstIssue(parsed.error) }, { status: 400 });
  const supabase = await createClient();
  const { data: prev } = await supabase.from("posts").select("slug, published_at").eq("id", id).maybeSingle();
  if (!prev) return NextResponse.json({ ok: false, message: "글을 찾을 수 없습니다." }, { status: 404 });
  if (await slugTaken(supabase, parsed.data.slug, id)) return NextResponse.json({ ok: false, message: "같은 주소(슬러그)의 글이 이미 있습니다. 주소를 바꿔 주세요." }, { status: 409 });
  const { error } = await supabase.from("posts").update(toRow(parsed.data, prev.published_at as string | null)).eq("id", id);
  if (error) {
    console.error("[admin/posts PUT]", error);
    return NextResponse.json({ ok: false, message: "저장하지 못했습니다. 잠시 후 다시 시도해 주세요." }, { status: 500 });
  }
  await logAdmin(me.id, "post.update", id, { title: parsed.data.title, published: parsed.data.published });
  revalidateNews(parsed.data.slug, prev.slug as string);
  return NextResponse.json({ ok: true, id });
}

/** PATCH /api/admin/posts/[id] { published } — 목록에서 발행/숨김 토글 */
export async function PATCH(req: Request, ctx: Ctx) {
  const me = await requireAdmin();
  if (!me) return NextResponse.json({ ok: false, message: "관리자만 사용할 수 있습니다." }, { status: 403 });
  const { id } = await ctx.params;
  const parsed = z.object({ published: z.boolean() }).safeParse(await req.json().catch(() => null));
  if (!Id.safeParse(id).success || !parsed.success) return NextResponse.json({ ok: false, message: "잘못된 요청입니다." }, { status: 400 });
  const supabase = await createClient();
  const { data: prev } = await supabase.from("posts").select("slug, published_at").eq("id", id).maybeSingle();
  if (!prev) return NextResponse.json({ ok: false, message: "글을 찾을 수 없습니다." }, { status: 404 });
  const patch: Record<string, unknown> = { published: parsed.data.published };
  if (parsed.data.published && !prev.published_at) patch.published_at = new Date().toISOString();
  const { error } = await supabase.from("posts").update(patch).eq("id", id);
  if (error) return NextResponse.json({ ok: false, message: "변경하지 못했습니다." }, { status: 500 });
  await logAdmin(me.id, "post.publish", id, { published: parsed.data.published });
  revalidateNews(prev.slug as string);
  return NextResponse.json({ ok: true });
}

/** DELETE /api/admin/posts/[id] */
export async function DELETE(_req: Request, ctx: Ctx) {
  const me = await requireAdmin();
  if (!me) return NextResponse.json({ ok: false, message: "관리자만 사용할 수 있습니다." }, { status: 403 });
  const { id } = await ctx.params;
  if (!Id.safeParse(id).success) return NextResponse.json({ ok: false, message: "잘못된 요청입니다." }, { status: 400 });
  const supabase = await createClient();
  const { data: prev } = await supabase.from("posts").select("slug, title").eq("id", id).maybeSingle();
  const { error } = await supabase.from("posts").delete().eq("id", id);
  if (error) return NextResponse.json({ ok: false, message: "삭제하지 못했습니다." }, { status: 500 });
  await logAdmin(me.id, "post.delete", id, { title: prev?.title });
  revalidateNews(undefined, (prev?.slug as string | undefined) ?? null);
  return NextResponse.json({ ok: true });
}
