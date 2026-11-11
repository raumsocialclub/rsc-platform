import Link from "next/link";
import { CARD, TH, TD, Badge, EmptyRow, PageTitle } from "./ui";
import { PartnerDetail } from "./PartnerDetail";
import { badgeStyle, fmtShortDate } from "@/lib/admin/format";
import { PARTNER_KIND_KO, PARTNER_STATUSES, PARTNER_STATUS_KO, type PartnerInquiryRow, type PartnerStatus } from "@/lib/partner/types";

export const partnerBadge = (s: PartnerStatus) => badgeStyle(s === "new" ? "brand" : s === "reviewing" ? "warn" : s === "done" ? "ok" : "mute");

/** 제휴문의 목록(좌) + 상세(우). ?status= 로 상태 필터, ?id= 로 선택. */
export function PartnersView({ rows, selected, status }: { rows: PartnerInquiryRow[]; selected: PartnerInquiryRow | null; status: PartnerStatus | "" }) {
  const fresh = rows.filter((r) => r.status === "new").length;
  const q = (s: string) => (s ? `?status=${s}` : "?");
  return (
    <>
      <PageTitle overline="PARTNERSHIP" title="제휴문의" aside={<span className="text-[16px] text-[rgba(55,56,60,.61)]">접수 {fresh}건</span>}>
        <div className="flex flex-wrap gap-[6px] text-[13px]">
          <Link href="/admin/partners" className={`px-[10px] py-[5px] rounded-ds-sm border ${status === "" ? "border-primary text-primary" : "border-lineNeutral text-labelAlt hover:border-line"}`}>전체</Link>
          {PARTNER_STATUSES.map((s) => <Link key={s} href={`/admin/partners${q(s)}`} className={`px-[10px] py-[5px] rounded-ds-sm border ${status === s ? "border-primary text-primary" : "border-lineNeutral text-labelAlt hover:border-line"}`}>{PARTNER_STATUS_KO[s]}</Link>)}
        </div>
      </PageTitle>
      <div className="grid grid-cols-1 min-[1201px]:grid-cols-[minmax(0,1fr)_minmax(0,400px)] gap-[20px] items-start">
        <div className={CARD}>
          <div className="overflow-x-auto">
            <table className="border-collapse w-full">
              <thead><tr>{["접수일", "회사 · 브랜드", "담당자", "문의 유형", "연락처", "상태"].map((h) => <th key={h} className={TH}>{h}</th>)}</tr></thead>
              <tbody>
                {rows.length === 0 && <EmptyRow colSpan={6}>{status ? "이 상태의 제휴문의가 없습니다." : "아직 제휴문의가 없습니다. 제휴문의 페이지(/partner)의 양식이 제출되면 여기에 표시됩니다."}</EmptyRow>}
                {rows.map((r) => {
                  const active = selected?.id === r.id;
                  const href = `/admin/partners?${status ? `status=${status}&` : ""}id=${r.id}`;
                  return (
                    <tr key={r.id} className={active ? "bg-[rgba(0,102,255,.06)]" : "hover:bg-[rgba(112,115,124,.05)]"}>
                      <td className={`${TD} text-[rgba(55,56,60,.61)]`}><Link href={href} className="block">{fmtShortDate(r.created_at)}</Link></td>
                      <td className={TD}><Link href={href} className="block font-bold">{r.company}</Link></td>
                      <td className={TD}>{r.name}</td>
                      <td className={TD}>{PARTNER_KIND_KO[r.kind] ?? r.kind}</td>
                      <td className={`${TD} text-[rgba(55,56,60,.61)]`}>{r.phone}<div className="text-[11px]">{r.email}</div></td>
                      <td className={TD}><Badge style={partnerBadge(r.status)}>{PARTNER_STATUS_KO[r.status] ?? r.status}</Badge></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
        {selected ? <PartnerDetail key={selected.id} row={selected} /> : <div className={`${CARD} p-[26px] text-[13px] text-[rgba(55,56,60,.61)]`}>목록에서 제휴문의를 선택하면 상세가 표시됩니다.</div>}
      </div>
    </>
  );
}
