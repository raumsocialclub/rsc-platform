import { requireAdmin } from "@/lib/admin/guard";
import { listOrders } from "@/lib/admin/queries";
import { BOOKING_STATUS_KO } from "@/lib/bookings/types";
import { fmtFull } from "@/lib/programs/format";

/** GET /api/admin/orders/export?program=&status= — 현재 필터의 예약·결제 내역을 CSV(엑셀용, BOM) 로 내려준다. */
export async function GET(req: Request) {
  const me = await requireAdmin();
  if (!me) return new Response("forbidden", { status: 403 });
  const sp = new URL(req.url).searchParams;
  const rows = await listOrders({ program: sp.get("program") || undefined, status: sp.get("status") || undefined, limit: 5000 });
  const esc = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  const head = ["예약번호", "예약일시", "회원", "이메일", "연락처", "프로그램", "프로그램 일시", "인원", "결제수단", "금액", "결제상태", "예약상태", "승인일시", "취소일시"];
  const lines = rows.map((r) => [
    r.order_id, fmtFull(r.created_at), r.member?.name, r.member?.email, r.member?.phone, r.program?.name, r.session ? fmtFull(r.session.starts_at) : "",
    r.qty, r.payment?.method ?? "", r.amount, r.payment?.status ?? "", BOOKING_STATUS_KO[r.status], r.payment?.approved_at ? fmtFull(r.payment.approved_at) : "", r.cancelled_at ? fmtFull(r.cancelled_at) : "",
  ].map(esc).join(","));
  const csv = "﻿" + [head.map(esc).join(","), ...lines].join("\r\n");
  return new Response(csv, { headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="rsc-orders-${new Date().toISOString().slice(0, 10)}.csv"` } });
}
