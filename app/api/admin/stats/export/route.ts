import { requireAdmin } from "@/lib/admin/guard";
import { isOwnerRole } from "@/lib/auth/session";
import { listMembers, listOrders } from "@/lib/admin/queries";
import { fullStats, parseRange } from "@/lib/admin/statsFull";
import { BOOKING_STATUS_KO } from "@/lib/bookings/types";
import { fmtFull } from "@/lib/programs/format";
import { createClient } from "@/lib/supabase/server";

/**
 * GET /api/admin/stats/export?type=…&from=&to= — 통계·관리 항목 CSV(엑셀용 BOM).
 * type: revenue-daily | revenue-program | revenue-method | orders | members | inquiries | traffic-daily | traffic-paths | traffic-referrers | funnel | logs | all
 */
const esc = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;
const row = (cells: unknown[]) => cells.map(esc).join(",");

export async function GET(req: Request) {
  const me = await requireAdmin();
  if (!me) return new Response("forbidden", { status: 403 });
  const sp = new URL(req.url).searchParams;
  const type = sp.get("type") ?? "all";
  const range = parseRange({ from: sp.get("from") ?? undefined, to: sp.get("to") ?? undefined, preset: sp.get("preset") ?? undefined });
  const st = await fullStats(range);
  const sections: { name: string; head: string[]; rows: unknown[][] }[] = [];
  const owner = isOwnerRole(me);
  // 회원 목록 CSV 는 주관리자만 (M12). 전체 리포트에서도 부관리자는 회원 항목이 빠진다
  if (type === "members" && !owner) return new Response("주관리자만 내려받을 수 있습니다.", { status: 403, headers: { "Content-Type": "text/plain; charset=utf-8" } });
  const want = (k: string) => (type === "all" || type === k) && (k !== "members" || owner);

  if (want("revenue-daily")) sections.push({ name: "일별 매출", head: ["날짜", "결제액", "환불액", "순매출", "결제 건수"], rows: st.revenue.daily.map((d) => [d.day, d.paid, d.refunded, d.net, d.count]) });
  if (want("revenue-program")) sections.push({ name: "프로그램별 매출", head: ["프로그램", "순매출", "결제 건수"], rows: st.revenue.byProgram.map((p) => [p.name, p.net, p.count]) });
  if (want("revenue-method")) sections.push({ name: "결제수단별", head: ["결제수단", "순매출", "결제 건수"], rows: st.revenue.byMethod.map((m) => [m.method, m.net, m.count]) });
  if (want("orders")) {
    const orders = await listOrders({ limit: 5000 });
    const { fromIso, toIso } = { fromIso: `${range.from}T00:00:00+09:00`, toIso: `${range.to}T23:59:59+09:00` };
    const inRange = orders.filter((o) => new Date(o.created_at) >= new Date(fromIso) && new Date(o.created_at) <= new Date(toIso));
    sections.push({ name: "예약·결제 내역", head: ["예약번호", "예약일시", "회원", "이메일", "연락처", "프로그램", "프로그램 일시", "결제수단", "금액", "남은 금액", "예약상태", "승인일시", "취소일시"], rows: inRange.map((r) => [r.order_id, fmtFull(r.created_at), r.member?.name, r.member?.email, r.member?.phone, r.program?.name, r.session ? fmtFull(r.session.starts_at) : "", r.payment?.method ?? "", r.amount, r.payment?.balance ?? "", BOOKING_STATUS_KO[r.status], r.payment?.approved_at ? fmtFull(r.payment.approved_at) : "", r.cancelled_at ? fmtFull(r.cancelled_at) : ""]) });
  }
  if (want("members")) {
    const members = await listMembers();
    sections.push({ name: "회원", head: ["이름", "이메일", "연락처", "가입일", "가입 경로", "상태", "참여 횟수", "누적 결제", "초대코드", "메모"], rows: members.map((m) => [m.name, m.email, m.phone, fmtFull(m.created_at), m.provider, m.status, m.visits, m.spent, m.invite_code, m.memo]) });
  }
  if (want("inquiries")) {
    const supabase = await createClient();
    const { data } = await supabase.from("inquiries").select("created_at, name, phone, email, result_type, status, memo").gte("created_at", `${range.from}T00:00:00+09:00`).lte("created_at", `${range.to}T23:59:59+09:00`).order("created_at", { ascending: false });
    sections.push({ name: "상담 신청", head: ["신청일시", "이름", "연락처", "이메일", "성향", "상태", "메모"], rows: (data ?? []).map((i) => [fmtFull(i.created_at), i.name, i.phone, i.email, i.result_type, i.status, i.memo]) });
  }
  if (want("traffic-daily")) sections.push({ name: "일별 접속", head: ["날짜", "페이지뷰", "방문자"], rows: (st.traffic?.daily ?? []).map((d) => [d.day, d.pv, d.uv]) });
  if (want("traffic-paths")) sections.push({ name: "페이지별 접속", head: ["경로", "페이지뷰", "방문자"], rows: (st.traffic?.paths ?? []).map((d) => [d.path, d.pv, d.uv]) });
  if (want("traffic-referrers")) sections.push({ name: "유입 경로", head: ["유입", "페이지뷰"], rows: (st.traffic?.referrers ?? []).map((d) => [d.host, d.pv]) });
  if (want("funnel")) sections.push({ name: "전환 퍼널", head: ["단계", "수"], rows: [["방문자", st.funnel.visitors], ["상담 신청", st.funnel.inquiries], ["가입", st.funnel.signups], ["결제 회원", st.funnel.payers]] });
  if (want("logs")) sections.push({ name: "관리자 활동", head: ["일시", "관리자", "작업", "대상", "상세"], rows: st.logs.map((l) => [fmtFull(l.ts), l.admin, l.action, l.target, l.detail ? JSON.stringify(l.detail) : ""]) });

  const out: string[] = [row(["RSC 리포트", `${range.from} ~ ${range.to}`, `생성 ${fmtFull(new Date().toISOString())}`]), ""];
  for (const sct of sections) {
    if (type === "all") out.push(row([`[${sct.name}]`]));
    out.push(row(sct.head));
    for (const r of sct.rows) out.push(row(r));
    out.push("");
  }
  const csv = "﻿" + out.join("\r\n");
  const name = `rsc-${type}-${range.from}_${range.to}.csv`;
  return new Response(csv, { headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="${name}"` } });
}
