import { NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient, hasServiceRoleKey } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { normalizePhone } from "@/lib/phone";

/**
 * POST /api/inquiries — Fit Check 설문 완료 시 inquiries 에 저장한다. (FLOWS.md 1-1)
 * 로그인 불필요. service role key 가 있으면 관리자 클라이언트로, 없으면
 * "anyone can submit inquiry" RLS 정책에 따라 anon 클라이언트로 insert 한다.
 */
const AnswerSchema = z.object({
  key: z.string().min(1).max(40),
  label: z.string().max(60),
  question: z.string().max(200),
  answer: z.string().max(200),
});

const BodySchema = z.object({
  name: z.string().trim().min(1, "성함을 입력해 주세요").max(50, "성함이 너무 깁니다"),
  phone: z.string().trim().min(1, "연락처를 입력해 주세요").max(30),
  route: z.string().max(40).optional().default(""),
  slot: z.string().max(40).optional().default(""),
  picks: z.record(z.string(), z.number().int().min(0).max(20)),
  answers: z.array(AnswerSchema).max(20),
  resultType: z.string().max(60),
});

export async function POST(req: Request) {
  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ ok: false, message: "요청 형식이 올바르지 않습니다." }, { status: 400 });
  }

  const parsed = BodySchema.safeParse(json);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return NextResponse.json({ ok: false, message: first?.message ?? "입력값을 확인해 주세요." }, { status: 400 });
  }
  const body = parsed.data;

  const phone = normalizePhone(body.phone);
  if (!phone) {
    return NextResponse.json({ ok: false, message: "연락처는 010-1234-5678 형식으로 입력해 주세요." }, { status: 400 });
  }

  const row = {
    name: body.name,
    phone,
    email: null,
    answers: {
      picks: body.picks,
      answers: body.answers,
      route: body.route,
      slot: body.slot,
      profile: body.resultType,
    },
    result_type: body.resultType,
  };

  try {
    // anon 경로는 insert 정책만 있고 select 정책이 없으므로 RETURNING(.select) 을 쓰지 않는다.
    const supabase = hasServiceRoleKey() ? createAdminClient() : await createClient();
    const { error } = await supabase.from("inquiries").insert(row);
    if (error) {
      console.error("[inquiries] insert failed:", error);
      return NextResponse.json({ ok: false, message: "신청을 저장하지 못했습니다. 잠시 후 다시 시도해 주세요." }, { status: 500 });
    }
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[inquiries] error:", e);
    return NextResponse.json({ ok: false, message: "서버 설정 오류입니다. 관리자에게 문의해 주세요." }, { status: 500 });
  }
}
