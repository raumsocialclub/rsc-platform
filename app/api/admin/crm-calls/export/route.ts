import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin/guard";
import { callsCsv, type ExportKind } from "@/lib/crm/export";
import { loadCallsDataSafe } from "@/lib/crm/load";
import { crmConfigured } from "@/lib/crm/sheet";

const NO_STORE = { "Cache-Control": "private, no-store", Pragma: "no-cache" };
export const maxDuration = 30;

/**
 * GET /api/admin/crm-calls/export?kind=interviews|needs — 콜 현황 CSV (lib/crm/export.ts).
 * 이름은 가운데를 가리고 전화번호는 넣지 않는다. 시트가 잠깐 실패하면 마지막으로 읽은 내용으로 만든다.
 */
export async function GET(req: Request) {
  const me = await requireAdmin();
  if (!me) return NextResponse.json({ ok: false, message: "관리자만 내려받을 수 있습니다." }, { status: 403, headers: NO_STORE });
  if (!crmConfigured()) return NextResponse.json({ ok: false, message: "시트 연결이 아직 설정되지 않았습니다." }, { status: 503, headers: NO_STORE });
  const k = new URL(req.url).searchParams.get("kind");
  const kind: ExportKind = k === "needs" ? "needs" : "interviews";
  const { data, error } = await loadCallsDataSafe();
  if (!data) return NextResponse.json({ ok: false, message: error ?? "시트를 읽지 못했습니다." }, { status: 502, headers: NO_STORE });
  const { csv, filename } = callsCsv(kind, data);
  return new Response(csv, {
    headers: { ...NO_STORE, "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="${filename}"` },
  });
}
