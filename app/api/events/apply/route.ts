import { NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient, hasServiceRoleKey } from "@/lib/supabase/admin";
import { normalizePhone } from "@/lib/phone";
import { limitByIp, tooManyResponse } from "@/lib/ratelimit";
import { cleanEventSlug, type EventEntry } from "@/lib/posts/apply";
import { isJoinRequest } from "@/lib/inquiries/join";

/**
 * POST /api/events/apply { event, phone } — 소식 「참여하기」 빠른 신청 (M24, 2026-11-25).
 * 이미 3분 프로필 설문을 제출한 사람(어드민 「가입 신청」에 있는 사람)은 설문을 다시 하지 않고 휴대폰 번호만으로 참여 신청한다.
 * - 같은 번호의 가장 최근 프로필 설문 행(answers.form=match)을 찾아 answers.events[] 에 { slug, title, at } 를 붙인다.
 * - 찾지 못하면 { ok, found:false } → 화면은 설문으로 이어진다(설문 제출 때 POST /api/match 가 같은 자리에 기록).
 * - 이미 같은 행사가 있으면 { found:true, already:true }. 개인정보는 돌려주지 않는다(접수 여부만).
 * 요청 제한: 같은 IP 10분에 10번.
 */
const BodySchema = z.object({ event: z.string().min(1).max(120), phone: z.string().min(1).max(30) });

export async function POST(req: Request) {
  const limited = await limitByIp(req, "event-apply", 10, 600);
  if (!limited.ok) return tooManyResponse(limited);
  if (!hasServiceRoleKey()) return NextResponse.json({ ok: false, message: "서버 설정 오류입니다. 관리자에게 문의해 주세요." }, { status: 500 });
  const parsed = BodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ ok: false, message: "입력값을 확인해 주세요." }, { status: 400 });
  const slug = cleanEventSlug(parsed.data.event);
  const phone = normalizePhone(parsed.data.phone);
  if (!slug) return NextResponse.json({ ok: false, message: "참여 신청할 소식을 찾을 수 없습니다." }, { status: 400 });
  if (!phone) return NextResponse.json({ ok: false, message: "휴대폰 번호는 010-1234-5678 형식으로 입력해 주세요." }, { status: 400 });

  const admin = createAdminClient();
  const { data: post } = await admin.from("posts").select("slug, title, published, apply_open").eq("slug", slug).maybeSingle();
  const p = post as { slug: string; title: string; published: boolean; apply_open?: boolean | null } | null;
  if (!p || !p.published || p.apply_open === false) return NextResponse.json({ ok: false, message: "지금은 참여 신청을 받지 않는 소식입니다." }, { status: 400 });

  const { data: rows, error } = await admin.from("inquiries").select("id, answers, created_at").eq("phone", phone).order("created_at", { ascending: false }).limit(20);
  if (error) {
    console.error("[events/apply] lookup failed:", error);
    return NextResponse.json({ ok: false, message: "잠시 후 다시 시도해 주세요." }, { status: 500 });
  }
  // 같은 번호의 프로필 설문 행 중 가장 최근 것 (상담 신청 /fit-check 행은 대상이 아니다)
  const mine = ((rows ?? []) as { id: string; answers: Record<string, unknown> | null; created_at: string }[])
    .filter((r) => isJoinRequest({ answers: (r.answers ?? null) as never }))
    .sort((a, b) => String(b.created_at).localeCompare(String(a.created_at)))[0];
  if (!mine) return NextResponse.json({ ok: true, found: false });

  const answers = (mine.answers ?? {}) as Record<string, unknown> & { events?: EventEntry[] };
  const events = Array.isArray(answers.events) ? answers.events : [];
  if (events.some((e) => e?.slug === p.slug)) return NextResponse.json({ ok: true, found: true, already: true });
  const next = [...events, { slug: p.slug, title: p.title, at: new Date().toISOString() }];
  const { error: uErr } = await admin.from("inquiries").update({ answers: { ...answers, events: next } }).eq("id", mine.id);
  if (uErr) {
    console.error("[events/apply] update failed:", uErr);
    return NextResponse.json({ ok: false, message: "참여 신청을 저장하지 못했습니다. 잠시 후 다시 시도해 주세요." }, { status: 500 });
  }
  return NextResponse.json({ ok: true, found: true, already: false });
}
