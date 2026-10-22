import { requireOwner } from "@/lib/admin/guard";
import { leadsCsv, matchesUtmFilter, type LeadSource } from "@/lib/admin/leads";
import { createClient } from "@/lib/supabase/server";

/** Supabase 는 한 번에 최대 1000행만 주므로 범위를 옮겨 가며 전부 모은다. */
const PAGE = 1000;

/**
 * GET /api/admin/inquiries/export?source=&campaign= — 현재 유입 필터에 해당하는 상담 신청 **전체**를
 * 메타 광고 관리자 리드 CSV 양식(id, created_time, ad_id … phone_number + 원본 UTM)으로 내려준다. (lib/admin/leads.ts)
 * 회원 CSV 와 같이 주관리자 전용(M12). 개인정보 파일이라 캐시하지 않는다.
 */
export async function GET(req: Request) {
  const me = await requireOwner();
  if (!me) return new Response("주관리자만 내려받을 수 있습니다.", { status: 403, headers: { "Content-Type": "text/plain; charset=utf-8" } });
  const sp = new URL(req.url).searchParams;
  const filter = { source: sp.get("source") ?? "", campaign: sp.get("campaign") ?? "" };
  const supabase = await createClient();
  const all: LeadSource[] = [];
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await supabase.from("inquiries").select("id, name, phone, created_at, utm").order("created_at", { ascending: false }).range(from, from + PAGE - 1);
    if (error) return new Response("조회 실패", { status: 500 });
    all.push(...((data ?? []) as LeadSource[]));
    if (!data || data.length < PAGE) break;
  }
  const csv = leadsCsv(all.filter((r) => matchesUtmFilter(r, filter)));
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="rsc-leads-${new Date().toISOString().slice(0, 10)}.csv"`,
      "Cache-Control": "private, no-store",
      Pragma: "no-cache",
    },
  });
}
