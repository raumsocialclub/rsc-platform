import { NextResponse } from "next/server";
import { z } from "zod";
import { flattenAnswers, sanitizeAnswers } from "@/lib/apply/schema";
import { PRIVACY_CONSENT_VERSION } from "@/lib/legal/content";
import { normalizePhone } from "@/lib/phone";
import { limitByIp, tooManyResponse } from "@/lib/ratelimit";
import { getSettings } from "@/lib/settings/get";
import { createAdminClient, hasServiceRoleKey } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { UTM_KEYS } from "@/lib/utm/client";

/**
 * POST /api/apply — 상담 전 고객 정보 설문(/apply) 제출. 일반 설정에서 「상담 전 설문 열기」가 켜져 있을 때만 받는다.
 * 저장은 기존 inquiries 테이블: 이름·휴대폰·이메일은 컬럼에, 나머지 답은 answers.answers[] (어드민 「상담 신청」 상세가 그대로 보여줌)
 * 와 answers.apply (원본 키-값) 에 넣는다. 보관 180일(purge 크론)·CRM 시트 연동(전화번호)·UTM 필터는 기존 그대로 적용된다.
 * 선택지 밖의 값·모르는 키·길이 초과는 서버에서 버린다 (lib/apply/schema.ts sanitizeAnswers).
 * 요청 제한: 같은 IP 10분에 5번 (lib/ratelimit.ts). 저장은 서버(service role)만 — inquiries 에 익명 insert 정책은 없다.
 */
const UtmSchema = z.object(Object.fromEntries(UTM_KEYS.map((k) => [k, z.string().trim().max(100).optional()])) as Record<(typeof UTM_KEYS)[number], z.ZodOptional<z.ZodString>>);
const BodySchema = z.object({
  answers: z.record(z.string(), z.unknown()),
  consent: z.literal(true, { message: "개인정보 수집·이용에 동의해 주세요." }),
  utm: UtmSchema.nullable().optional(),
});

function cleanUtm(utm: z.infer<typeof UtmSchema> | null | undefined): Record<string, string> | null {
  if (!utm) return null;
  const out: Record<string, string> = {};
  for (const k of UTM_KEYS) if (utm[k]) out[k] = utm[k]!;
  return Object.keys(out).length ? out : null;
}

export async function POST(req: Request) {
  const { applyEnabled } = await getSettings();
  if (!applyEnabled) return NextResponse.json({ ok: false, message: "지금은 상담 전 설문을 받고 있지 않습니다." }, { status: 403 });
  const limited = await limitByIp(req, "apply", 5, 600);
  if (!limited.ok) return tooManyResponse(limited);

  let json: unknown;
  try { json = await req.json(); } catch { return NextResponse.json({ ok: false, message: "요청 형식이 올바르지 않습니다." }, { status: 400 }); }
  const parsed = BodySchema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ ok: false, message: parsed.error.issues[0]?.message ?? "입력값을 확인해 주세요." }, { status: 400 });

  const a = sanitizeAnswers(parsed.data.answers);
  const name = String(a.name ?? "").trim();
  if (!name) return NextResponse.json({ ok: false, message: "이름을 입력해 주세요." }, { status: 400 });
  const phone = normalizePhone(String(a.phone ?? ""));
  if (!phone) return NextResponse.json({ ok: false, message: "휴대폰 번호는 010-1234-5678 형식으로 입력해 주세요." }, { status: 400 });
  if (!a.gender || !a.birth) return NextResponse.json({ ok: false, message: "성별과 생년월일을 입력해 주세요." }, { status: 400 });
  const email = String(a.email ?? "").trim();
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return NextResponse.json({ ok: false, message: "이메일 주소 형식을 확인해 주세요." }, { status: 400 });

  const { name: _n, phone: _p, email: _e, ...rest } = a;
  void _n; void _p; void _e;
  const row = {
    name,
    phone,
    email: email || null,
    answers: {
      form: "apply",
      route: String(a.joinRoute ?? ""),
      slot: "",
      ref: String(a.refCode ?? ""),
      consentAt: new Date().toISOString(),
      consentVersion: PRIVACY_CONSENT_VERSION,
      answers: flattenAnswers(a),
      apply: rest,
    },
    result_type: null,
    utm: cleanUtm(parsed.data.utm),
  };

  try {
    if (!hasServiceRoleKey()) console.warn("[apply] SUPABASE_SERVICE_ROLE_KEY 없음 — inquiries 는 익명 insert 정책이 없어 저장이 거부될 수 있습니다");
    const supabase = hasServiceRoleKey() ? createAdminClient() : await createClient();
    const { error } = await supabase.from("inquiries").insert(row);
    if (error) {
      console.error("[apply] insert failed:", error);
      return NextResponse.json({ ok: false, message: "설문을 저장하지 못했습니다. 잠시 후 다시 시도해 주세요." }, { status: 500 });
    }
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[apply] error:", e);
    return NextResponse.json({ ok: false, message: "서버 설정 오류입니다. 관리자에게 문의해 주세요." }, { status: 500 });
  }
}
