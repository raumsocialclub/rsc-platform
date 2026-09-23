import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentMember } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

/**
 * POST /api/bookings { sessionId } → DB 함수 book_session (reserve_seat 래퍼: pending, 15분, 가격은 DB 계산)
 * → { bookingId }. 같은 회차에 유효한 예약이 있으면 그 예약으로 이어간다.
 */
const Body = z.object({ sessionId: z.string().uuid() });

const MESSAGES: Record<string, string> = {
  SOLD_OUT: "아쉽지만 방금 마감되었습니다. 다른 회차나 프로그램을 확인해 주세요.",
  SESSION_CLOSED: "예약이 닫힌 회차입니다.",
  SESSION_PAST: "이미 지난 회차입니다.",
  SESSION_NOT_FOUND: "회차를 찾을 수 없습니다.",
  PROGRAM_UNPUBLISHED: "현재 예약할 수 없는 프로그램입니다.",
  MEMBER_INACTIVE: "휴면·탈퇴 상태에서는 예약할 수 없습니다.",
  NOT_INVITED: "초대코드 등록 후 예약할 수 있습니다.",
  NOT_MEMBER: "회원 정보를 찾을 수 없습니다. 다시 로그인해 주세요.",
};

export async function POST(req: Request) {
  const me = await getCurrentMember();
  if (!me) return NextResponse.json({ ok: false, message: "로그인이 필요합니다." }, { status: 401 });
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ ok: false, message: "잘못된 요청입니다." }, { status: 400 });

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("book_session", { p_session: parsed.data.sessionId });
  if (error || !data) {
    const key = Object.keys(MESSAGES).find((k) => error?.message?.includes(k));
    if (!key) console.error("[bookings POST]", error);
    return NextResponse.json({ ok: false, code: key ?? "UNKNOWN", message: key ? MESSAGES[key] : "예약을 만들지 못했습니다. 잠시 후 다시 시도해 주세요." }, { status: key ? 409 : 500 });
  }
  const b = data as { id: string; status: string };
  return NextResponse.json({ ok: true, bookingId: b.id, status: b.status });
}
