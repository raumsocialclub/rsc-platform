import { NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient, hasServiceRoleKey } from "@/lib/supabase/admin";
import { limitByIp, tooManyResponse } from "@/lib/ratelimit";
import { PARTNER_FILES_BUCKET, fileProblem, uploadPathFor } from "@/lib/partner/files";

/**
 * POST /api/partner/upload-url { name, size } — 제휴문의 첨부 파일의 서명 업로드 URL 발급.
 * 확장자·크기를 검사한 뒤 partner-files 버킷(비공개)의 inbox/<uuid>/<파일명> 경로로 한 번 쓸 수 있는 토큰을 준다(2시간).
 * 브라우저는 supabase-js uploadToSignedUrl 로 직접 올린다 — Vercel 함수의 4.5MB 요청 본문 한도를 피한다. 같은 IP 10분에 20번.
 */
const Body = z.object({ name: z.string().trim().min(1).max(200), size: z.number().int().positive() });

export async function POST(req: Request) {
  const limited = await limitByIp(req, "partner-upload", 20, 600);
  if (!limited.ok) return tooManyResponse(limited);
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ ok: false, message: "파일 정보가 올바르지 않습니다." }, { status: 400 });
  const problem = fileProblem(parsed.data.name, parsed.data.size);
  if (problem) return NextResponse.json({ ok: false, message: problem }, { status: 400 });
  if (!hasServiceRoleKey()) return NextResponse.json({ ok: false, message: "지금은 파일을 첨부할 수 없습니다. 첨부 없이 보내시거나 이메일로 보내 주세요." }, { status: 503 });
  const path = uploadPathFor(parsed.data.name);
  const { data, error } = await createAdminClient().storage.from(PARTNER_FILES_BUCKET).createSignedUploadUrl(path);
  if (error || !data) {
    console.error("[partner/upload-url]", error);
    return NextResponse.json({ ok: false, message: "업로드 주소를 만들지 못했습니다. 잠시 후 다시 시도해 주세요." }, { status: 500 });
  }
  return NextResponse.json({ ok: true, path, token: data.token });
}
