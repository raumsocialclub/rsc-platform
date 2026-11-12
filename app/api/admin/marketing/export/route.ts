import { requireOwner } from "@/lib/admin/guard";
import { marketingCsv } from "@/lib/admin/marketingCsv";
import type { MarketingConsentRow } from "@/lib/inquiries/marketing";
import { createClient } from "@/lib/supabase/server";

const PAGE = 1000;

/** GET /api/admin/marketing/export?state=active|withdrawn — 마케팅 수신 동의 CSV (주관리자 전용, 개인정보 파일이라 캐시 안 함) */
export async function GET(req: Request) {
  const me = await requireOwner();
  if (!me) return new Response("주관리자만 내려받을 수 있습니다.", { status: 403, headers: { "Content-Type": "text/plain; charset=utf-8" } });
  const state = new URL(req.url).searchParams.get("state") ?? "";
  const supabase = await createClient();
  const all: MarketingConsentRow[] = [];
  for (let from = 0; ; from += PAGE) {
    let q = supabase.from("marketing_consents").select("*").order("consent_at", { ascending: false }).range(from, from + PAGE - 1);
    if (state === "active") q = q.is("withdrawn_at", null);
    if (state === "withdrawn") q = q.not("withdrawn_at", "is", null);
    const { data, error } = await q;
    if (error) return new Response("조회 실패", { status: 500 });
    all.push(...((data ?? []) as MarketingConsentRow[]));
    if (!data || data.length < PAGE) break;
  }
  const day = new Date().toLocaleDateString("sv-SE", { timeZone: "Asia/Seoul" });
  return new Response(marketingCsv(all), {
    headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="rsc-marketing-${state || "all"}-${day}.csv"`, "Cache-Control": "no-store" },
  });
}
