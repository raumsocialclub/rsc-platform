import { NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient, hasServiceRoleKey } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { normalizePhone } from "@/lib/phone";
import { limitByIp, tooManyResponse } from "@/lib/ratelimit";
import { PARTNER_CONSENT_VERSION, PARTNER_KINDS, PARTNER_MESSAGE_MAX, PARTNER_MESSAGE_MIN } from "@/lib/partner/types";
import { sendPartnerInquiryNotice } from "@/lib/notify";
import { PARTNER_FILE_MAX, verifyFiles } from "@/lib/partner/files";
import { getBrand } from "@/lib/cms/get";

/**
 * POST /api/partner — 제휴문의 양식(/partner) 저장. 로그인 불필요, 저장은 서버(service role)만.
 * 요청 제한: 같은 IP 10분에 3번. 개인정보 동의(consent) 없이는 저장하지 않고 동의 시각·버전을 기록한다. 보관 1년(DB 크론).
 * 첨부(files, 최대 3개)는 브라우저가 /api/partner/upload-url 로 먼저 올린 경로를 받아 버킷에 실제로 있는지 확인한 뒤 기록한다(lib/partner/files.ts).
 * 저장 후 제휴 담당 이메일(global.brand.partnerEmail)로 접수 알림을 보낸다(RESEND_API_KEY 가 있을 때만, 실패해도 접수는 성공).
 */
const BodySchema = z.object({
  kind: z.enum(PARTNER_KINDS, { message: "문의 유형을 선택해 주세요." }),
  company: z.string().trim().min(1, "회사 · 브랜드명을 입력해 주세요.").max(80, "회사 · 브랜드명이 너무 깁니다."),
  name: z.string().trim().min(1, "담당자명을 입력해 주세요.").max(50, "담당자명이 너무 깁니다."),
  phone: z.string().trim().min(1, "연락처를 입력해 주세요.").max(30),
  email: z.string().trim().min(1, "이메일을 입력해 주세요.").max(120).email("이메일 형식을 확인해 주세요."),
  message: z.string().trim().min(PARTNER_MESSAGE_MIN, `제안 내용을 ${PARTNER_MESSAGE_MIN}자 이상 적어 주세요.`).max(PARTNER_MESSAGE_MAX, `제안 내용은 ${PARTNER_MESSAGE_MAX.toLocaleString()}자까지 적을 수 있습니다.`),
  consent: z.literal(true, { message: "개인정보 수집·이용에 동의해 주세요." }),
  /** 봇 함정(honeypot): 사람은 비워 두는 숨은 칸 */
  website: z.string().max(0).optional().default(""),
  files: z.array(z.object({ path: z.string().max(200), name: z.string().max(200), size: z.number().int().nonnegative() })).max(PARTNER_FILE_MAX, "첨부 파일은 3개까지 보낼 수 있습니다.").optional().default([]),
});

export async function POST(req: Request) {
  const limited = await limitByIp(req, "partner", 3, 600);
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
  if (!phone) return NextResponse.json({ ok: false, message: "연락처는 010-1234-5678 형식으로 입력해 주세요." }, { status: 400 });

  const row = {
    kind: body.kind,
    files: [] as { path: string; name: string; size: number }[],
    company: body.company,
    name: body.name,
    phone,
    email: body.email.toLowerCase(),
    message: body.message,
    consent_at: new Date().toISOString(),
    consent_version: PARTNER_CONSENT_VERSION,
  };

  try {
    if (!hasServiceRoleKey()) console.warn("[partner] SUPABASE_SERVICE_ROLE_KEY 없음 — partner_inquiries 는 익명 insert 정책이 없어 저장이 거부될 수 있습니다");
    const supabase = hasServiceRoleKey() ? createAdminClient() : await createClient();
    if (body.files.length) {
      const verified = await verifyFiles(supabase, body.files);
      if (!verified) return NextResponse.json({ ok: false, message: "첨부 파일을 확인하지 못했습니다. 파일을 다시 선택해 주세요." }, { status: 400 });
      row.files = verified;
    }
    const { error } = await supabase.from("partner_inquiries").insert(row);
    if (error) {
      console.error("[partner] insert failed:", error);
      return NextResponse.json({ ok: false, message: "접수하지 못했습니다. 잠시 후 다시 시도해 주세요." }, { status: 500 });
    }
    try {
      const brand = await getBrand();
      if (brand.partnerEmail) await sendPartnerInquiryNotice({ to: brand.partnerEmail, ...row });
    } catch (e) {
      console.warn("[partner] notice failed:", e);
    }
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[partner] error:", e);
    return NextResponse.json({ ok: false, message: "서버 설정 오류입니다. 관리자에게 문의해 주세요." }, { status: 500 });
  }
}
