import { z } from "zod";
import { requireAdmin } from "@/lib/admin/guard";
import { logAdmin } from "@/lib/admin/log";
import { fmtDate } from "@/lib/admin/format";
import { listEventApplications } from "@/lib/events/admin";
import { JOIN_STATE_KO, joinState, matchAnswersOf } from "@/lib/inquiries/join";
import { QUESTION_BY_KEY, ageOf, displayMatchAnswer } from "@/lib/match/schema";
import { APPLY_SOURCE_KO, APPLY_STATUS_KO } from "@/lib/posts/apply";
import { createClient } from "@/lib/supabase/server";

const esc = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;
const row = (cells: unknown[]) => cells.map(esc).join(",");

/** GET /api/admin/events/export?post=<소식 id> — 한 소식의 참여 신청자 CSV(엑셀용 BOM). 관리자 활동 로그 event.export */
export async function GET(req: Request) {
  const me = await requireAdmin();
  if (!me) return new Response("forbidden", { status: 403 });
  const postId = new URL(req.url).searchParams.get("post") ?? "";
  if (!z.string().uuid().safeParse(postId).success) return new Response("bad request", { status: 400 });
  const supabase = await createClient();
  const [{ data: post }, apps] = await Promise.all([supabase.from("posts").select("title, slug, event_date").eq("id", postId).maybeSingle(), listEventApplications(supabase, postId)]);
  if (!post) return new Response("not found", { status: 404 });
  const head = ["신청일시", "이름", "휴대폰", "성별", "만 나이", "거주지", "직업", "학력", "가입 상태", "참석 상태", "상태 변경일", "신청 경로", "메모"];
  const lines = apps.map((a) => {
    const r = a.inquiry;
    const m = r ? matchAnswersOf(r) : {};
    const birth = String(m.birth ?? "");
    const age = birth ? ageOf(birth) : null;
    const cell = (k: string) => (r ? displayMatchAnswer(QUESTION_BY_KEY[k], m) : "");
    return row([
      fmtDate(a.created_at, true), r?.name ?? "", r?.phone ?? "", cell("gender"), age ?? "", [cell("homeSido"), cell("homeGugun")].filter(Boolean).join(" "), [cell("jobCategory"), cell("jobDetail")].filter(Boolean).join(" · "), cell("education"),
      r ? JOIN_STATE_KO[joinState(r)] : "", APPLY_STATUS_KO[a.status], a.status_at ? fmtDate(a.status_at, true) : "", APPLY_SOURCE_KO[a.source], a.memo ?? "",
    ]);
  });
  const body = "﻿" + [row([`참여 신청자 — ${(post as { title: string }).title}`]), row(head), ...lines].join("\r\n");
  await logAdmin(me.id, "event.export", postId, { count: apps.length });
  const name = `event-applications-${(post as { slug: string }).slug}-${new Date().toISOString().slice(0, 10)}.csv`;
  return new Response(body, { headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(name)}` } });
}
