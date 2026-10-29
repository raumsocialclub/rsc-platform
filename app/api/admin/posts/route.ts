import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin/guard";
import { logAdmin } from "@/lib/admin/log";
import { revalidateNews, slugTaken, toRow } from "@/lib/posts/admin";
import { PostInputSchema, firstIssue } from "@/lib/posts/schema";
import { createClient } from "@/lib/supabase/server";

/** POST /api/admin/posts — 새 소식 */
export async function POST(req: Request) {
  const me = await requireAdmin();
  if (!me) return NextResponse.json({ ok: false, message: "관리자만 사용할 수 있습니다." }, { status: 403 });
  const parsed = PostInputSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ ok: false, message: firstIssue(parsed.error) }, { status: 400 });
  const supabase = await createClient();
  if (await slugTaken(supabase, parsed.data.slug)) return NextResponse.json({ ok: false, message: "같은 주소(슬러그)의 글이 이미 있습니다. 주소를 바꿔 주세요." }, { status: 409 });
  const { data, error } = await supabase.from("posts").insert({ ...toRow(parsed.data), created_by: me.id }).select("id, slug").single();
  if (error || !data) {
    console.error("[admin/posts POST]", error);
    return NextResponse.json({ ok: false, message: "저장하지 못했습니다. 잠시 후 다시 시도해 주세요." }, { status: 500 });
  }
  await logAdmin(me.id, "post.create", data.id, { title: parsed.data.title, published: parsed.data.published });
  revalidateNews(data.slug);
  return NextResponse.json({ ok: true, id: data.id });
}
