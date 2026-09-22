import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

/**
 * POST /api/invites/consume { code } — 로그인한(주로 소셜 가입) 사용자가 초대코드를 사용 처리한다.
 * DB 함수 consume_invite_code 가 미사용·미만료를 확인하고 used_by / members.invite_code_id 를 기록한다.
 */
const Body = z.object({ code: z.string().trim().min(1).max(20) });

export async function POST(req: Request) {
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ ok: false, message: "코드를 입력해 주세요." }, { status: 400 });

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ ok: false, message: "로그인이 필요합니다." }, { status: 401 });

  const { data, error } = await supabase.rpc("consume_invite_code", { p_code: parsed.data.code.toUpperCase() });
  if (error) {
    console.error("[invites/consume]", error);
    return NextResponse.json({ ok: false, message: "처리 중 오류가 났습니다. 잠시 후 다시 시도해 주세요." }, { status: 500 });
  }
  if (!data) return NextResponse.json({ ok: false, message: "유효하지 않은 코드입니다. 상담 담당자에게 확인해주세요." }, { status: 400 });
  return NextResponse.json({ ok: true });
}
