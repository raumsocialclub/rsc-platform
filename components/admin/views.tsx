import Link from "next/link";
import { CARD, TH, TD, Badge, EmptyRow, PageTitle } from "./ui";
import { InquiryDetail, type InquiryRow } from "./InquiryDetail";
import { IssueInviteForm } from "./IssueInviteForm";
import { CopyButton } from "./CopyButton";
import { INQUIRY_STATUS, badgeStyle, fmtDate, fmtShortDate, inquiryBadge } from "@/lib/admin/format";
import { PROFILES } from "@/lib/fit-check/questions";

/* ---------- 상담 신청 ---------- */
export function InquiriesView({ rows, selected }: { rows: InquiryRow[]; selected: InquiryRow | null }) {
  const pending = rows.filter((r) => r.status === "pending").length;
  const profile = selected?.result_type ? Object.values(PROFILES).find((p) => p.en === selected.result_type) : undefined;
  return (
    <>
      <PageTitle overline="FIT CHECK" title="상담 신청" aside={<span className="text-[16px] text-[rgba(33,30,25,.5)]">대기 {pending}건</span>} />
      <div className="grid grid-cols-1 min-[1201px]:grid-cols-[minmax(0,1fr)_minmax(0,380px)] gap-[20px] items-start">
        <div className={CARD}>
          <div className="overflow-x-auto">
            <table className="border-collapse w-full">
              <thead><tr>{["신청일", "이름", "연락처", "성향 결과", "희망 시간", "상태"].map((h) => <th key={h} className={TH}>{h}</th>)}</tr></thead>
              <tbody>
                {rows.length === 0 && <EmptyRow colSpan={6}>아직 상담 신청이 없습니다. /fit-check 에서 설문을 제출하면 여기에 표시됩니다.</EmptyRow>}
                {rows.map((r) => {
                  const active = selected?.id === r.id;
                  return (
                    <tr key={r.id} className={active ? "bg-[rgba(226,180,120,.18)]" : "hover:bg-[#faf7f1]"}>
                      <td className={`${TD} text-[rgba(33,30,25,.6)]`}><Link href={`/admin/inquiries?id=${r.id}`} className="block">{fmtShortDate(r.created_at)}</Link></td>
                      <td className={TD}><Link href={`/admin/inquiries?id=${r.id}`} className="block font-bold">{r.name || "—"}</Link></td>
                      <td className={TD}>{r.phone || "—"}</td>
                      <td className={TD}>{r.result_type || "—"}</td>
                      <td className={`${TD} text-[rgba(33,30,25,.6)]`}>{r.answers?.slot || "—"}</td>
                      <td className={TD}><Badge style={inquiryBadge(r.status)}>{INQUIRY_STATUS[r.status] ?? r.status}</Badge></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
        {selected ? (
          <InquiryDetail key={selected.id} inquiry={selected} profileKo={profile?.ko} profileBody={profile?.body} />
        ) : (
          <div className={`${CARD} p-[26px] text-[13px] text-[rgba(33,30,25,.5)]`}>목록에서 신청을 선택하면 상세가 표시됩니다.</div>
        )}
      </div>
    </>
  );
}

/* ---------- 쿠폰 · 초대권 ---------- */
export type InviteRow = {
  id: string;
  code: string;
  issued_to_name: string | null;
  issued_to_phone: string | null;
  created_at: string;
  expires_at: string | null;
  used_at: string | null;
  used_by_name?: string | null;
  inquiry_name?: string | null;
};

export function CouponsView({ invites }: { invites: InviteRow[] }) {
  const stateOf = (r: InviteRow) => {
    if (r.used_at) return { label: "사용됨", style: badgeStyle("brand") };
    if (r.expires_at && new Date(r.expires_at) < new Date()) return { label: "만료", style: badgeStyle("bad") };
    return { label: "미사용", style: badgeStyle("ok") };
  };
  return (
    <>
      <PageTitle overline="COUPONS & INVITES" title="쿠폰 · 초대권">
        <IssueInviteForm />
      </PageTitle>
      <div className="text-[12px] tracking-[.2em] text-[rgba(33,30,25,.5)] mb-[10px]">초대코드</div>
      <div className={`${CARD} mb-[28px]`}>
        <div className="overflow-x-auto">
          <table className="border-collapse w-full">
            <thead><tr>{["코드", "발급 대상", "연락처", "상담 연결", "발급일", "만료", "사용", "상태", ""].map((h, i) => <th key={i} className={TH}>{h}</th>)}</tr></thead>
            <tbody>
              {invites.length === 0 && <EmptyRow colSpan={9}>발급된 초대코드가 없습니다.</EmptyRow>}
              {invites.map((r) => {
                const st = stateOf(r);
                return (
                  <tr key={r.id} className="hover:bg-[#faf7f1]">
                    <td className={TD}><b className="tracking-[.06em]">{r.code}</b></td>
                    <td className={TD}>{r.issued_to_name || "—"}</td>
                    <td className={`${TD} text-[rgba(33,30,25,.65)]`}>{r.issued_to_phone || "—"}</td>
                    <td className={`${TD} text-[rgba(33,30,25,.65)]`}>{r.inquiry_name || "—"}</td>
                    <td className={`${TD} text-[rgba(33,30,25,.65)]`}>{fmtDate(r.created_at)}</td>
                    <td className={`${TD} text-[rgba(33,30,25,.65)]`}>{fmtDate(r.expires_at)}</td>
                    <td className={`${TD} text-[rgba(33,30,25,.65)]`}>{r.used_at ? `${fmtDate(r.used_at)}${r.used_by_name ? ` · ${r.used_by_name}` : ""}` : "—"}</td>
                    <td className={TD}><Badge style={st.style}>{st.label}</Badge></td>
                    <td className={TD}>{!r.used_at && <CopyButton text={r.code} />}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
      <div className="text-[12px] tracking-[.2em] text-[rgba(33,30,25,.5)] mb-[10px]">지인 초대권 · 할인 쿠폰</div>
      <div className={`${CARD} p-[24px] text-[13px] text-[rgba(33,30,25,.5)]`}>지인 초대권(회원별 연 8/12매)과 할인 쿠폰은 멤버십 결제(2차)와 함께 붙습니다.</div>
    </>
  );
}
