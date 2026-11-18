import { NextResponse } from "next/server";
import { z } from "zod";
import { PRIVACY_CONSENT_VERSION } from "@/lib/legal/content";
import { limitByIp, tooManyResponse } from "@/lib/ratelimit";
import { createAdminClient, hasServiceRoleKey } from "@/lib/supabase/admin";
import { PHONE4_RE, missingSurveyAnswer, sanitizeSurveyAnswers, surveyDef } from "@/lib/survey/definitions";
import { SURVEY_MESSAGE, TOKEN_RE, findSurvey, surveyStatus } from "@/lib/survey/links";

/**
 * POST /api/survey { token, answers, name?, phone4?, consent? } — 회원 설문조사(/s/<토큰>) 제출.
 * 비밀 링크(surveys.token)가 열려 있으면(마감·기간 종료 아님) 로그인 없이 누구나, 몇 번이든 받는다(중복은 브라우저 표시와 이름·뒤 4자리로 어드민에서 가린다).
 * 답은 정의(lib/survey/definitions.ts)대로 정제해 survey_responses 한 행에 넣는다(서버 service role 전용). 이름·휴대폰 뒤 4자리는 선택이며, 적은 경우에만 개인정보 동의(consent)가 있어야 한다 —
 * 동의가 없으면 400 으로 돌려보내고, 둘 다 비어 있으면 동의 없이 무기명으로 저장한다. 1년이 지나면 이름·뒤 4자리는 자동으로 지워진다(purge_expired_survey_identities).
 * 요청 제한: 같은 IP 10분에 10번(모임 현장에서 같은 와이파이로 여러 명이 답할 수 있어 상담 신청보다 넉넉히).
 */
const BodySchema = z.object({
  token: z.string().regex(TOKEN_RE, SURVEY_MESSAGE.invalid),
  answers: z.record(z.string(), z.unknown()),
  name: z.string().trim().max(50).optional().default(""),
  phone4: z.string().trim().max(4).optional().default(""),
  consent: z.boolean().optional().default(false),
});

export async function POST(req: Request) {
  const limited = await limitByIp(req, "survey", 10, 600);
  if (!limited.ok) return tooManyResponse(limited);
  if (!hasServiceRoleKey()) {
    console.error("[survey] SUPABASE_SERVICE_ROLE_KEY 없음 — 설문 확인·저장 불가");
    return NextResponse.json({ ok: false, message: "서버 설정 오류입니다. 관리자에게 문의해 주세요." }, { status: 500 });
  }
  let json: unknown;
  try { json = await req.json(); } catch { return NextResponse.json({ ok: false, message: "요청 형식이 올바르지 않습니다." }, { status: 400 }); }
  const parsed = BodySchema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ ok: false, message: parsed.error.issues[0]?.message ?? "입력값을 확인해 주세요." }, { status: 400 });
  const body = parsed.data;

  const admin = createAdminClient();
  const survey = await findSurvey(admin, body.token);
  const status = survey ? surveyStatus(survey) : "invalid";
  const def = survey ? surveyDef(survey.kind) : null;
  if (!survey || !def || status !== "open") return NextResponse.json({ ok: false, message: SURVEY_MESSAGE[status === "open" ? "invalid" : status] }, { status: 403 });

  const a = sanitizeSurveyAnswers(def, body.answers);
  const miss = missingSurveyAnswer(def, a);
  if (miss) return NextResponse.json({ ok: false, message: `「${miss.label}」 문항에 답해 주세요.` }, { status: 400 });

  const name = def.identify ? body.name : "";
  const phone4 = def.identify ? body.phone4 : "";
  if (phone4 && !PHONE4_RE.test(phone4)) return NextResponse.json({ ok: false, message: "휴대폰 뒤 4자리는 숫자 4자리로 적어 주세요." }, { status: 400 });
  const identified = !!(name || phone4);
  if (identified && !body.consent) return NextResponse.json({ ok: false, message: "이름·휴대폰 뒤 4자리를 남기려면 개인정보 수집·이용에 동의해 주세요." }, { status: 400 });

  const now = new Date().toISOString();
  const row = {
    survey_id: survey.id,
    answers: a,
    name: identified ? name || null : null,
    phone_last4: identified ? phone4 || null : null,
    consent_at: identified ? now : null,
    consent_version: identified ? PRIVACY_CONSENT_VERSION : null,
  };
  try {
    const { error } = await admin.from("survey_responses").insert(row);
    if (error) {
      console.error("[survey] insert failed:", error);
      return NextResponse.json({ ok: false, message: "응답을 저장하지 못했습니다. 잠시 후 다시 시도해 주세요." }, { status: 500 });
    }
    await admin.from("surveys").update({ last_response_at: now }).eq("id", survey.id);
  } catch (e) {
    console.error("[survey]", e);
    return NextResponse.json({ ok: false, message: "응답을 저장하지 못했습니다. 잠시 후 다시 시도해 주세요." }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
