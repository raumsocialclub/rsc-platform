import type { NextResponse } from "next/server";
import { getSettings } from "./get";
import { matchHiddenClosed } from "./matchHidden";

/** Route Handler 첫 줄에서: 1:1 매칭 전체 숨김이면 404 응답을, 아니면 null 을 돌려준다. (proxy 는 /api 를 거치지 않으므로 여기서 닫는다) */
export async function matchHiddenGuard(): Promise<NextResponse | null> {
  const s = await getSettings();
  return s.matchHidden ? matchHiddenClosed() : null;
}
