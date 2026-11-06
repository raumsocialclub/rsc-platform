import { NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient, hasServiceRoleKey } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { normalizePhone } from "@/lib/phone";
import { limitByIp, tooManyResponse } from "@/lib/ratelimit";
import { UTM_KEYS } from "@/lib/utm/client";
import { PRIVACY_CONSENT_VERSION } from "@/lib/legal/content";

/**
 * POST /api/inquiries — Fit Check 설문 완료 시 inquiries 에 저장한다. (FLOWS.md 1-1)
 * 로그인 불필요. 저장은 서버(service role)만 한다 — inquiries 의 익명 insert 정책("anyone can submit inquiry")은 2026-11-04 에 없앴다
 * (공개 anon 키로 DB 에 직접 넣는 스팸 차단). 요청 제한: 같은 IP 10분에 5번 (lib/ratelimit.ts).
 *
 * 개인정보 최소화: 이름·휴대폰·상담 가능 시간·광고 UTM·동의 시각만 저장한다. (설문형 모드일 때만 결과 유형·유입 경로가 추가됨)
 * 설문 답변 원본(picks/answers)은 받더라도 버린다 (zod 가 정의되지 않은 키를 제거).
 * 개인정보 수집·이용 동의(consent) 없이는 저장하지 않으며, 동의 시각과 동의문 버전(PRIVACY_CONSENT_VERSION)을 서버에서 기록한다.
 * 보관: 180일 (DB purge_expired_inquiries 크론) — 개인정보처리방침 제4조와 일치.
 */
const UtmSchema = z.object(Object.fromEntries(UTM_KEYS.map((k) => [k, z.string().trim().max(100).optional()])) as Record<(typeof UTM_KEYS)[number], z.ZodOptional<z.ZodString>>);

const BodySchema = z.object({
  name: z.string().trim().min(1, "성함을 입력해 주세요").max(50, "성함이 너무 깁니다"),
  phone: z.string().trim().min(1, "연락처를 입력해 주세요").max(30),
  route: z.string().max(40).optional().default(""),
  slot: z.string().max(120).optional().default(""),
  resultType: z.string().max(60).optional().default(""),
  consent: z.literal(true, { message: "개인정보 수집·이용에 동의해 주세요." }),
  utm: UtmSchema.nullable().optional(),
});

/** 값이 있는 utm_* 만 남긴다. 하나도 없으면 null. */
function cleanUtm(utm: z.infer<typeof UtmSchema> | null | undefined): Record<string, string> | null {
  if (!utm) return null;
  const out: Record<string, string> = {};
  for (const k of UTM_KEYS) if (utm[k]) out[k] = utm[k]!;
  return Object.keys(out).length ? out : null;
}

export async function POST(req: Request) {
  const limited = await limitByIp(req, "inquiries", 5, 600);
  if (!limited.ok) return tooManyResponse(limited);
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
    answers: { route: body.route, slot: body.slot, consentAt: new Date().toISOString(), consentVersion: PRIVACY_CONSENT_VERSION },
    result_type: body.resultType || null,
    utm: cleanUtm(body.utm),
  };

  try {
    if (!hasServiceRoleKey()) console.warn("[inquiries] SUPABASE_SERVICE_ROLE_KEY 없음 — inquiries 는 익명 insert 정책이 없어 저장이 거부될 수 있습니다");
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
