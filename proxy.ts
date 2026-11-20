import type { NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/proxy";

/** Next 16 의 proxy (구 middleware). 세션 갱신 + 보호 라우트. */
export async function proxy(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  // 정적 파일·이미지 최적화·API 는 제외
  matcher: ["/((?!_next/static|_next/image|favicon.ico|images/|api/).*)"],
};
