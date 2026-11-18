import { NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient, hasServiceRoleKey } from "@/lib/supabase/admin";
import { normalizePhone } from "@/lib/phone";
import { limitByIp, tooManyResponse } from "@/lib/ratelimit";
import { UTM_KEYS } from "@/lib/utm/client";
import { MARKETING_CONSENT_VERSION, PRIVACY_CONSENT_VERSION } from "@/lib/legal/content";
import { MARKETING_CHANNELS } from "@/lib/inquiries/marketing";
import { cleanEntryPath } from "@/lib/inquiries/track";
import { MATCH_PHOTO_COUNT, SENSITIVE_KEYS, flattenMatchAnswers, missingMatchRequired, sanitizeMatchAnswers } from "@/lib/match/schema";
import { isPhotoPath, verifyPhoto } from "@/lib/match/photo";

/**
 * POST /api/match { answers, consent, sensitiveConsent?, marketing?, photos?, entryPath?, utm? } — 프로필 진단(/match-check) 제출.
 * 로그인 없이 누구나. 저장은 inquiries(서버 service role 전용) 한 행: 이름·휴대폰은 컬럼, 나머지는 answers 에
 *   form: "match" · track: "matching"(1:1 매칭 관심) · job/education/region/district(어드민 목록·CSV 의 「직업 · 학력 · 거주지」열이 그대로 읽음)
 *   · answers[](어드민 상세가 그대로 보여주는 질문·답 목록) · match(원본 키-값) · photos(버킷 경로 최대 3장, photo 는 첫 장) · 동의 시각·버전.
 * 종교·건강(민감정보)은 sensitiveConsent 가 true 일 때만 남긴다 (개인정보 보호법 제23조). 사진은 버킷에 실제로 있어야 기록한다.
 * 마케팅 수신 동의(선택)는 /api/inquiries 와 같이 marketing_consents 에 따로 저장. 보관 180일(purge_expired_inquiries 가 사진도 함께 지움).
 * 요청 제한: 같은 IP 10분에 5번.
 */
const UtmSchema = z.object(Object.fromEntries(UTM_KEYS.map((k) => [k, z.string().trim().max(100).optional()])) as Record<(typeof UTM_KEYS)[number], z.ZodOptional<z.ZodString>>);
const BodySchema = z.object({
  answers: z.record(z.string(), z.unknown()),
  consent: z.literal(true, { message: "개인정보 수집·이용에 동의해 주세요." }),
  sensitiveConsent: z.boolean().optional().default(false),
  marketing: z.boolean().optional().default(false),
  /** 사진 경로(최대 3장). 옛 클라이언트의 photo(한 장)도 받는다 */
  photos: z.array(z.string().max(200)).max(MATCH_PHOTO_COUNT).optional().default([]),
  photo: z.string().max(200).optional().nullable(),
  entryPath: z.string().max(200).optional().default(""),
  utm: UtmSchema.nullable().optional(),
});

function cleanUtm(utm: z.infer<typeof UtmSchema> | null | undefined): Record<string, string> | null {
  if (!utm) return null;
  const out: Record<string, string> = {};
  for (const k of UTM_KEYS) if (utm[k]) out[k] = utm[k]!;
  return Object.keys(out).length ? out : null;
}

export async function POST(req: Request) {
  const limited = await limitByIp(req, "match", 5, 600);
  if (!limited.ok) return tooManyResponse(limited);
  if (!hasServiceRoleKey()) {
    console.error("[match] SUPABASE_SERVICE_ROLE_KEY 없음 — 저장 불가");
    return NextResponse.json({ ok: false, message: "서버 설정 오류입니다. 관리자에게 문의해 주세요." }, { status: 500 });
  }
  let json: unknown;
  try { json = await req.json(); } catch { return NextResponse.json({ ok: false, message: "요청 형식이 올바르지 않습니다." }, { status: 400 }); }
  const parsed = BodySchema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ ok: false, message: parsed.error.issues[0]?.message ?? "입력값을 확인해 주세요." }, { status: 400 });
  const body = parsed.data;

  const a = sanitizeMatchAnswers(body.answers);
  if (!body.sensitiveConsent) for (const k of SENSITIVE_KEYS) delete a[k];
  const phone = normalizePhone(String(a.phone ?? ""));
  if (!phone) return NextResponse.json({ ok: false, message: "휴대폰 번호는 010-1234-5678 형식으로 입력해 주세요." }, { status: 400 });
  const miss = missingMatchRequired(a);
  if (miss) return NextResponse.json({ ok: false, message: `「${miss.label}」을(를) 입력해 주세요.` }, { status: 400 });
  const name = String(a.name).trim();

  const admin = createAdminClient();
  const photos: string[] = [];
  for (const p of [...body.photos, ...(body.photo ? [body.photo] : [])]) {
    if (photos.includes(p)) continue;
    if (!isPhotoPath(p) || !(await verifyPhoto(admin, p))) return NextResponse.json({ ok: false, message: "사진이 올라가지 않았습니다. 다시 올리거나 「나중에 올릴게요」로 넘어가 주세요." }, { status: 400 });
    photos.push(p);
  }
  const photo = photos[0] ?? null;

  const { name: _n, phone: _p, ...rest } = a;
  void _n; void _p;
  const now = new Date().toISOString();
  const hasSensitive = body.sensitiveConsent && SENSITIVE_KEYS.some((k) => a[k]);
  const region = typeof a.homeSido === "string" ? a.homeSido : "";
  const row = {
    name,
    phone,
    email: null,
    answers: {
      form: "match",
      track: "matching",
      route: "1:1 매칭",
      entryTrack: "matching",
      ...(cleanEntryPath(body.entryPath) ? { entryPath: cleanEntryPath(body.entryPath) } : {}),
      slot: "",
      ...(a.jobCategory ? { job: a.jobCategory } : {}),
      ...(a.education ? { education: a.education } : {}),
      ...(region ? { region } : {}),
      ...(region && a.homeGugun ? { district: a.homeGugun } : {}),
      ...(a.source ? { source: a.source } : {}),
      consentAt: now,
      consentVersion: PRIVACY_CONSENT_VERSION,
      ...(hasSensitive ? { sensitiveConsentAt: now } : {}),
      marketing: body.marketing,
      ...(body.marketing ? { marketingAt: now, marketingVersion: MARKETING_CONSENT_VERSION } : {}),
      ...(photo ? { photo, photos } : {}),
      answers: flattenMatchAnswers(a),
      match: rest,
    },
    result_type: null,
    utm: cleanUtm(body.utm),
  };

  try {
    const { data: inserted, error } = await admin.from("inquiries").insert(row).select("id").single();
    if (error) {
      console.error("[match] insert failed:", error);
      return NextResponse.json({ ok: false, message: "제출을 저장하지 못했습니다. 잠시 후 다시 시도해 주세요." }, { status: 500 });
    }
    if (body.marketing) {
      const { error: mErr } = await admin.from("marketing_consents").insert({
        inquiry_id: (inserted as { id?: string } | null)?.id ?? null, name, phone, region: region || null, track: "matching",
        channels: MARKETING_CHANNELS, consent_at: now, consent_version: MARKETING_CONSENT_VERSION,
      });
      if (mErr) console.error("[match] marketing consent insert failed (제출은 저장됨):", mErr);
    }
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[match] error:", e);
    return NextResponse.json({ ok: false, message: "서버 설정 오류입니다. 관리자에게 문의해 주세요." }, { status: 500 });
  }
}
