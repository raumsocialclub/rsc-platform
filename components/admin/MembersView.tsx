import Link from "next/link";
import { MemberDetail } from "./MemberDetail";
import { MembersFilter } from "./MembersFilter";
import { CARD, TH, TD, Badge, EmptyRow, PageTitle } from "./ui";
import { fmtDate, memberBadge, won } from "@/lib/admin/format";
import { MEMBER_STATUS_KO, PROVIDER_KO, type MemberRow, type OrderRow } from "@/lib/admin/types";

type Props = { rows: MemberRow[]; total: number; selected: MemberRow | null; selectedOrders: OrderRow[]; filter: { q: string; status: string }; canExport?: boolean };

/** design/RSC Admin.dc.html MEMBERS 뷰 + 상세 드로어 */
export function MembersView({ rows, total, selected, selectedOrders, filter, canExport = false }: Props) {
  const href = (id: string) => {
    const p = new URLSearchParams();
    if (filter.q) p.set("q", filter.q);
    if (filter.status) p.set("status", filter.status);
    p.set("id", id);
    return `/admin/members?${p}`;
  };
  return (
    <>
      <PageTitle overline="MEMBERS" title="회원 관리" aside={<span className="text-[16px] text-[rgba(33,30,25,.5)]">{total}명</span>}>
        <div className="flex items-center gap-[10px] flex-wrap">
          <MembersFilter filter={filter} />
          {canExport && <a href="/api/admin/stats/export?type=members&preset=all" className="border border-brown text-brown px-[14px] py-[9px] text-[12.5px] font-semibold whitespace-nowrap hover:text-brownHover hover:border-brownHover">회원 CSV ↓</a>}
        </div>
      </PageTitle>
      <div className="grid grid-cols-1 min-[1201px]:grid-cols-[minmax(0,1fr)_minmax(0,380px)] gap-[20px] items-start">
        <div className={CARD}>
          <div className="overflow-x-auto">
            <table className="border-collapse w-full">
              <thead><tr>{["회원", "연락처", "가입", "가입 경로", "참여", "누적 결제", "초대코드", "상태"].map((h) => <th key={h} className={TH}>{h}</th>)}</tr></thead>
              <tbody>
                {rows.length === 0 && <EmptyRow colSpan={8}>조건에 맞는 회원이 없습니다.</EmptyRow>}
                {rows.map((m) => {
                  const active = selected?.id === m.id;
                  return (
                    <tr key={m.id} className={active ? "bg-[rgba(226,180,120,.18)]" : "hover:bg-[#faf7f1]"}>
                      <td className={TD}>
                        <Link href={href(m.id)} className="flex items-center gap-[10px]">
                          <div className="w-[30px] h-[30px] rounded-full bg-[#e7e0d3] flex items-center justify-center text-[12px] font-semibold flex-none">{m.name?.[0] ?? "?"}</div>
                          <div><b>{m.name || "이름 없음"}</b>{m.role !== "member" && <span className="ml-[6px] text-[10px] text-brown tracking-[.1em]">{m.role === "owner" ? "OWNER" : "ADMIN"}</span>}<div className="text-[11.5px] text-[rgba(33,30,25,.5)]">{m.email}</div></div>
                        </Link>
                      </td>
                      <td className={TD}>{m.phone ?? "—"}</td>
                      <td className={`${TD} text-[rgba(33,30,25,.6)]`}>{fmtDate(m.created_at)}</td>
                      <td className={TD}>{PROVIDER_KO[m.provider] ?? m.provider}</td>
                      <td className={TD}>{m.visits}회</td>
                      <td className={TD}><b>{won(m.spent)}</b></td>
                      <td className={`${TD} text-[12px] text-[rgba(33,30,25,.6)]`}>{m.invite_code ?? "—"}</td>
                      <td className={TD}><Badge style={memberBadge(m.status)}>{MEMBER_STATUS_KO[m.status]}</Badge></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
        {selected ? <MemberDetail key={`${selected.id}-${selected.status}-${selected.memo ?? ""}`} member={selected} orders={selectedOrders} /> : <div className={`${CARD} p-[26px] text-[13px] text-[rgba(33,30,25,.5)]`}>목록에서 회원을 선택하면 상세(이력·메모·상태)가 표시됩니다.</div>}
      </div>
    </>
  );
}
