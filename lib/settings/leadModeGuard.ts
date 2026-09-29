import type { NextResponse } from "next/server";
import { getSettings } from "./get";
import { leadModeClosed } from "./leadMode";

/** Route Handler 첫 줄에서: 리드 모드면 404 응답을, 아니면 null 을 돌려준다. (proxy 는 /api 를 거치지 않으므로 여기서 닫는다) */
export async function leadModeGuard(): Promise<NextResponse | null> {
  const s = await getSettings();
  return s.leadMode ? leadModeClosed() : null;
}
