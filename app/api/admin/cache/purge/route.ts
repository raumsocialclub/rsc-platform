import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin/guard";
import { logAdmin } from "@/lib/admin/log";

/** POST /api/admin/cache/purge — 서버 렌더 캐시 전체 갱신. CDN 캐시는 설정한 시간 안에 자동 갱신된다. */
export async function POST() {
  const me = await requireAdmin();
  if (!me) return NextResponse.json({ ok: false, message: "관리자만 사용할 수 있습니다." }, { status: 403 });
  revalidatePath("/", "layout");
  await logAdmin(me.id, "cache.purge");
  return NextResponse.json({ ok: true });
}
