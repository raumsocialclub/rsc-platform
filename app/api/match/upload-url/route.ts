import { NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient, hasServiceRoleKey } from "@/lib/supabase/admin";
import { limitByIp, tooManyResponse } from "@/lib/ratelimit";
import { MATCH_PHOTO_BUCKET, photoPathFor, photoProblem } from "@/lib/match/photo";

/**
 * POST /api/match/upload-url { name, size } — 프로필 진단 사진의 서명 업로드 URL 발급 (lib/match/photo.ts).
 * 확장자·크기를 검사한 뒤 match-photos 버킷(비공개)의 inbox/<uuid>/photo.<확장자> 경로로 한 번 쓸 수 있는 토큰을 준다.
 * 브라우저가 supabase-js uploadToSignedUrl 로 직접 올린다. 같은 IP 10분에 10번.
 */
const Body = z.object({ name: z.string().trim().min(1).max(200), size: z.number().int().positive() });

export async function POST(req: Request) {
  const limited = await limitByIp(req, "match-upload", 10, 600);
  if (!limited.ok) return tooManyResponse(limited);
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ ok: false, message: "파일 정보가 올바르지 않습니다." }, { status: 400 });
  const problem = photoProblem(parsed.data.name, parsed.data.size);
  if (problem) return NextResponse.json({ ok: false, message: problem }, { status: 400 });
  if (!hasServiceRoleKey()) return NextResponse.json({ ok: false, message: "지금은 사진을 올릴 수 없습니다. 「나중에 올릴게요」로 넘어가 주세요." }, { status: 503 });
  const path = photoPathFor(parsed.data.name);
  const { data, error } = await createAdminClient().storage.from(MATCH_PHOTO_BUCKET).createSignedUploadUrl(path);
  if (error || !data) {
    console.error("[match/upload-url]", error);
    return NextResponse.json({ ok: false, message: "업로드 주소를 만들지 못했습니다. 잠시 후 다시 시도해 주세요." }, { status: 500 });
  }
  return NextResponse.json({ ok: true, path, token: data.token });
}
