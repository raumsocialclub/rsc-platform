import { requireOwner } from "@/lib/admin/guard";
import { leadRangeBounds, leadsCsv, matchesUtmFilter, parseLeadRange, type LeadSource } from "@/lib/admin/leads";
import { applyCsv, matchesKind, parseKind } from "@/lib/apply/export";
import type { InquiryRow } from "@/components/admin/InquiryDetail";
import { createClient } from "@/lib/supabase/server";
import { matchesTrack, parseTrackFilter } from "@/lib/inquiries/track";

/** Supabase 는 한 번에 최대 1000행만 주므로 범위를 옮겨 가며 전부 모은다. */
const PAGE = 1000;

/**
 * GET /api/admin/inquiries/export?source=&campaign=&kind=&track=&from=&to= — 현재 필터에 해당하는 상담 신청을 CSV 로 내려준다.
 *  - kind=apply: 상담 전 설문(/apply) 응답 — 설문 전 문항이 열로 들어간 분석용 파일 (lib/apply/export.ts)
 *  - 그 외: 메타 광고 관리자 리드 CSV 양식(id, created_time, ad_id … phone_number + 원본 UTM) (lib/admin/leads.ts)
 * from/to 는 한국 날짜(YYYY-MM-DD, 양 끝 포함). 없거나 잘못되면 전체.
 * 회원 CSV 와 같이 주관리자 전용(M12). 개인정보 파일이라 캐시하지 않는다.
 */
export async function GET(req: Request) {
  const me = await requireOwner();
  if (!me) return new Response("주관리자만 내려받을 수 있습니다.", { status: 403, headers: { "Content-Type": "text/plain; charset=utf-8" } });
  const sp = new URL(req.url).searchParams;
  const filter = { source: sp.get("source") ?? "", campaign: sp.get("campaign") ?? "" };
  const kind = parseKind(sp.get("kind"));
  const track = parseTrackFilter(sp.get("track"));
  const range = parseLeadRange({ from: sp.get("from"), to: sp.get("to") });
  const supabase = await createClient();
  const all: InquiryRow[] = [];
  for (let from = 0; ; from += PAGE) {
    let q = supabase.from("inquiries").select("id, name, phone, email, status, created_at, answers, utm");
    if (range) { const b = leadRangeBounds(range); q = q.gte("created_at", b.gte).lt("created_at", b.lt); }
    const { data, error } = await q.order("created_at", { ascending: false }).range(from, from + PAGE - 1);
    if (error) return new Response("조회 실패", { status: 500 });
    all.push(...((data ?? []) as InquiryRow[]));
    if (!data || data.length < PAGE) break;
  }
  const rows = all.filter((r) => matchesUtmFilter(r, filter) && matchesKind(r, kind) && matchesTrack(r, track));
  const csv = kind === "apply" ? applyCsv(rows) : leadsCsv(rows as LeadSource[]);
  const stem = kind === "apply" ? "rsc-apply" : "rsc-leads";
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${stem}-${range ? `${range.from}_${range.to}` : `all-${new Date().toISOString().slice(0, 10)}`}.csv"`,
      "Cache-Control": "private, no-store",
      Pragma: "no-cache",
    },
  });
}
