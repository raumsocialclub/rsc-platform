import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin/guard";
import { loadCallsData } from "@/lib/crm/load";
import { crmConfigured } from "@/lib/crm/sheet";

const NO_STORE = { "Cache-Control": "private, no-store" };

/** GET /api/admin/crm-calls — 콜 현황 대시보드가 30초마다 부르는 최신 데이터 (M18). 관리자만 */
export async function GET() {
  const me = await requireAdmin();
  if (!me) return NextResponse.json({ ok: false, message: "관리자만 사용할 수 있습니다." }, { status: 403, headers: NO_STORE });
  if (!crmConfigured()) return NextResponse.json({ ok: false, message: "시트 연결이 아직 설정되지 않았습니다. SETUP.md 4-4 를 참고해 주세요." }, { status: 503, headers: NO_STORE });
  try {
    return NextResponse.json(await loadCallsData(), { headers: NO_STORE });
  } catch (e) {
    console.error("[admin/crm-calls]", e);
    return NextResponse.json({ ok: false, message: e instanceof Error ? e.message : "시트를 읽지 못했습니다." }, { status: 502, headers: NO_STORE });
  }
}
