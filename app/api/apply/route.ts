import { NextResponse } from "next/server";
import { z } from "zod";
import { TOKEN_RE, findLink, linkStatus, LINK_MESSAGE } from "@/lib/apply/links";
import { flattenAnswers, sanitizeAnswers } from "@/lib/apply/schema";
import { PRIVACY_CONSENT_VERSION } from "@/lib/legal/content";
import { normalizePhone } from "@/lib/phone";
import { limitByIp, tooManyResponse } from "@/lib/ratelimit";
import { createAdminClient, hasServiceRoleKey } from "@/lib/supabase/admin";

/**
 * POST /api/apply { token, answers, consent } — 상담 전 설문(/apply/<토큰>) 제출.
 * 관리자가 만든 공용 비밀 링크(apply_links)의 토큰이 유효(기간 내·취소 안 됨)하면 로그인 없이 누구나, 몇 번이든 받는다.
 * 저장은 inquiries 테이블(서버 service role 전용): 이름·휴대폰·이메일은 컬럼에, 나머지 답은 answers.answers[] (어드민 상세가 그대로 보여줌)
 * 와 answers.apply (원본 키-값) 에 넣고, answers.linkId 로 어느 링크의 응답인지 남긴다. 링크의 uses·last_used_at 을 올린다.
 * 보관 180일(purge 크론)·CRM 시트 연동(전화번호)은 기존 그대로. 선택지 밖의 값·모르는 키·길이 초과는 서버에서 버린다.
 * 요청 제한: 같은 IP 10분에 5번 (lib/ratelimit.ts).
 */
const BodySchema = z.object({
  token: z.string().regex(TOKEN_RE, "유효하지 않은 설문 링크입니다."),
  answers: z.record(z.string(), z.unknown()),
  consent: z.literal(true, { message: "개인정보 수집·이용에 동의해 주세요." }),
});

export async function POST(req: Request) {
  const limited = await limitByIp(req, "apply", 5, 600);
  if (!limited.ok) return tooManyResponse(limited);
  if (!hasServiceRoleKey()) {
    console.error("[apply] SUPABASE_SERVICE_ROLE_KEY 없음 — 설문 링크 확인·저장 불가");
    return NextResponse.json({ ok: false, message: "서버 설정 오류입니다. 관리자에게 문의해 주세요." }, { status: 500 });
  }

  let json: unknown;
  try { json = await req.json(); } catch { return NextResponse.json({ ok: false, message: "요청 형식이 올바르지 않습니다." }, { status: 400 }); }
  const parsed = BodySchema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ ok: false, message: parsed.error.issues[0]?.message ?? "입력값을 확인해 주세요." }, { status: 400 });

  const admin = createAdminClient();
  const link = await findLink(admin, parsed.data.token);
  const status = link ? linkStatus(link) : "invalid";
  if (!link || status !== "active") return NextResponse.json({ ok: false, message: LINK_MESSAGE[status === "active" ? "invalid" : status] }, { status: 403 });

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
      linkId: link.id,
      route: String(a.joinRoute ?? ""),
      slot: "",
      ref: String(a.refCode ?? ""),
      consentAt: new Date().toISOString(),
      consentVersion: PRIVACY_CONSENT_VERSION,
      answers: flattenAnswers(a),
      apply: rest,
    },
    result_type: null,
    utm: null,
  };

  try {
    const { error } = await admin.from("inquiries").insert(row);
    if (error) {
      console.error("[apply] insert failed:", error);
      return NextResponse.json({ ok: false, message: "설문을 저장하지 못했습니다. 잠시 후 다시 시도해 주세요." }, { status: 500 });
    }
    // 링크 응답 수·마지막 응답 시각 (어드민 목록 표시용. 정확한 수는 상담 신청 목록이 기준)
    await admin.from("apply_links").update({ uses: (link.uses ?? 0) + 1, last_used_at: new Date().toISOString() }).eq("id", link.id);
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[apply] error:", e);
    return NextResponse.json({ ok: false, message: "서버 설정 오류입니다. 관리자에게 문의해 주세요." }, { status: 500 });
  }
}
