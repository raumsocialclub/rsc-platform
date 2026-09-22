import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/lib/admin/guard";
import { logAdmin } from "@/lib/admin/log";
import { DOC_BY_ID } from "@/lib/cms/schema";
import { createClient } from "@/lib/supabase/server";

type Ctx = { params: Promise<{ id: string }> };
const MAX_BYTES = 200_000;

/** 입력값을 스키마에 있는 키만 남기고 정리 */
function sanitize(id: string, raw: unknown): Record<string, unknown> | null {
  const def = DOC_BY_ID.get(id);
  if (!def || !raw || typeof raw !== "object") return null;
  const src = raw as Record<string, unknown>;
  const out: Record<string, unknown> = {};
  for (const f of def.fields) {
    const v = src[f.key];
    if (v === undefined) continue;
    if (f.type === "boolean") out[f.key] = !!v;
    else if (f.type === "number") out[f.key] = Number.isFinite(Number(v)) ? Number(v) : 0;
    else out[f.key] = String(v ?? "").slice(0, 5000);
  }
  for (const l of def.lists ?? []) {
    const arr = Array.isArray(src[l.key]) ? (src[l.key] as unknown[]) : [];
    out[l.key] = arr.slice(0, l.max ?? 50).map((item) => {
      const it = (item && typeof item === "object" ? item : {}) as Record<string, unknown>;
      const o: Record<string, unknown> = {};
      for (const f of l.fields) {
        const v = it[f.key];
        if (f.type === "boolean") o[f.key] = !!v;
        else if (f.type === "number") o[f.key] = Number.isFinite(Number(v)) ? Number(v) : 0;
        else o[f.key] = String(v ?? "").slice(0, 5000);
      }
      return o;
    });
  }
  return out;
}

function pathsFor(id: string): string[] {
  const page = id.split(".")[0];
  if (page === "global") return ["/", "/pricing", "/benefits", "/fit-check", "/terms", "/privacy", "/refund", "/login", "/join", "/programs", "/my"];
  if (page === "home") return ["/"];
  if (page === "pricing") return ["/pricing"];
  if (page === "benefits") return ["/benefits"];
  if (page === "legal") return [`/${id.split(".")[1]}`];
  return [];
}

/** PUT /api/admin/site/[id] { data } — 저장(즉시 게시) + 이력 + 캐시 갱신 */
export async function PUT(req: Request, ctx: Ctx) {
  const me = await requireAdmin();
  if (!me) return NextResponse.json({ ok: false, message: "관리자만 사용할 수 있습니다." }, { status: 403 });
  const { id } = await ctx.params;
  const def = DOC_BY_ID.get(id);
  if (!def) return NextResponse.json({ ok: false, message: "알 수 없는 문서입니다." }, { status: 404 });
  const text = await req.text();
  if (text.length > MAX_BYTES) return NextResponse.json({ ok: false, message: "내용이 너무 큽니다." }, { status: 413 });
  const parsed = z.object({ data: z.record(z.string(), z.unknown()) }).safeParse(JSON.parse(text || "{}"));
  if (!parsed.success) return NextResponse.json({ ok: false, message: "잘못된 요청입니다." }, { status: 400 });
  const data = sanitize(id, parsed.data.data);
  if (!data) return NextResponse.json({ ok: false, message: "잘못된 요청입니다." }, { status: 400 });

  const supabase = await createClient();
  const { error } = await supabase.from("site_content").upsert({ id, page: def.page, data, updated_at: new Date().toISOString(), updated_by: me.id });
  if (error) {
    console.error("[admin/site PUT]", error);
    return NextResponse.json({ ok: false, message: "저장하지 못했습니다." }, { status: 500 });
  }
  await supabase.from("site_content_history").insert({ content_id: id, data, saved_by: me.id });
  await logAdmin(me.id, "site.save", id, { label: def.label });
  for (const p of pathsFor(id)) revalidatePath(p);
  if (def.page === "global") revalidatePath("/", "layout");
  return NextResponse.json({ ok: true });
}

/** DELETE /api/admin/site/[id] — 기본값으로 되돌리기 (DB 행 삭제) */
export async function DELETE(_req: Request, ctx: Ctx) {
  const me = await requireAdmin();
  if (!me) return NextResponse.json({ ok: false, message: "관리자만 사용할 수 있습니다." }, { status: 403 });
  const { id } = await ctx.params;
  const def = DOC_BY_ID.get(id);
  if (!def) return NextResponse.json({ ok: false, message: "알 수 없는 문서입니다." }, { status: 404 });
  const supabase = await createClient();
  const { error } = await supabase.from("site_content").delete().eq("id", id);
  if (error) return NextResponse.json({ ok: false, message: "되돌리지 못했습니다." }, { status: 500 });
  await logAdmin(me.id, "site.reset", id, { label: def.label });
  for (const p of pathsFor(id)) revalidatePath(p);
  if (def.page === "global") revalidatePath("/", "layout");
  return NextResponse.json({ ok: true });
}

/** GET /api/admin/site/[id] — 저장 이력(최근 20) */
export async function GET(_req: Request, ctx: Ctx) {
  const me = await requireAdmin();
  if (!me) return NextResponse.json({ ok: false }, { status: 403 });
  const { id } = await ctx.params;
  const supabase = await createClient();
  const { data } = await supabase.from("site_content_history").select("id, data, saved_at, saved_by").eq("content_id", id).order("saved_at", { ascending: false }).limit(20);
  return NextResponse.json({ ok: true, history: data ?? [] });
}
