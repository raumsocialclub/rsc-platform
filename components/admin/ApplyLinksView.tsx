import Link from "next/link";
import { ApplyLinkForm, RevokeLinkButton } from "./ApplyLinkForm";
import { CopyButton } from "./CopyButton";
import { CARD, TH, TD, Badge, EmptyRow, PageTitle } from "./ui";
import { INQUIRY_STATUS, badgeStyle, fmtDate, inquiryBadge } from "@/lib/admin/format";
import { APPLY_LINK_STATUS_KO, applyLinkUrl, linkStatus, type ApplyLink } from "@/lib/apply/links";

export type ApplyLinkRow = ApplyLink & { inquiry_name: string | null; response: { id: string; name: string | null; status: string; created_at: string } | null };

const statusBadge = (s: ReturnType<typeof linkStatus>) => badgeStyle(s === "used" ? "ok" : s === "active" ? "brand" : s === "revoked" ? "bad" : "mute");

/**
 * /admin/apply — 상담 전 설문 비밀 링크 관리. 흐름: 전화 상담 완료 → 니즈가 확실한 분에게 「설문 링크 만들기」 → 주소를 직접 전달 →
 * 응답하면 「응답 완료」로 바뀌고 상담 신청 목록에 「설문」으로 들어온다(상세에서 전 문항 확인, 주관리자는 설문 응답 CSV).
 */
export function ApplyLinksView({ rows, applyCount }: { rows: ApplyLinkRow[]; applyCount: number }) {
  const active = rows.filter((r) => linkStatus(r) === "active").length;
  const used = rows.filter((r) => linkStatus(r) === "used").length;
  return (
    <>
      <PageTitle overline="PRE-CONSULTATION" title="상담 전 설문" aside={<span className="text-[16px] text-[rgba(33,30,25,.5)]">전달 가능 {active} · 응답 완료 {used}</span>}>
        <ApplyLinkForm />
      </PageTitle>
      <div className="text-[12.5px] leading-[1.7] text-[rgba(33,30,25,.6)] mb-[16px]">
        전화 상담을 마치고 니즈가 확실한 분에게만 보내는 대면 상담 전 설문입니다. 사이트 어디에도 노출되지 않고 여기서 만든 비밀 링크로만 열립니다(1회 제출, 기본 30일).
        상담 신청 목록에서 온 분은 그 신청의 상세 화면에서 「설문 링크 발급」을 누르면 자동으로 연결됩니다. 응답은 <Link href="/admin/inquiries?kind=apply" className="text-brown font-semibold">상담 신청 → 상담 전 설문</Link>에 모입니다{applyCount ? ` (지금까지 ${applyCount}건)` : ""}.
      </div>
      <div className={CARD}>
        <div className="overflow-x-auto">
          <table className="border-collapse w-full">
            <thead><tr>{["발급일", "받는 분", "휴대폰", "메모", "상태", "응답", "링크", ""].map((h, i) => <th key={i} className={TH}>{h}</th>)}</tr></thead>
            <tbody>
              {rows.length === 0 && <EmptyRow colSpan={8}>아직 만든 설문 링크가 없습니다. 「설문 링크 만들기」로 시작하세요.</EmptyRow>}
              {rows.map((r) => {
                const s = linkStatus(r);
                return (
                  <tr key={r.id} className="hover:bg-[#faf7f1]">
                    <td className={`${TD} text-[rgba(33,30,25,.6)]`}>{fmtDate(r.created_at)}<div className="text-[11.5px] text-[rgba(33,30,25,.45)]">~ {fmtDate(r.expires_at)}</div></td>
                    <td className={TD}><b>{r.name || "—"}</b>{r.inquiry_id && <div className="text-[11.5px]"><Link href={`/admin/inquiries?id=${r.inquiry_id}`} className="text-brown">상담 신청{r.inquiry_name ? ` · ${r.inquiry_name}` : ""} →</Link></div>}</td>
                    <td className={TD}>{r.phone || "—"}</td>
                    <td className={`${TD} whitespace-normal max-w-[240px] text-[12.5px] text-[rgba(33,30,25,.65)]`}>{r.memo || "—"}</td>
                    <td className={TD}><Badge style={statusBadge(s)}>{APPLY_LINK_STATUS_KO[s]}</Badge>{r.used_at && <div className="text-[11.5px] text-[rgba(33,30,25,.45)] mt-[2px]">{fmtDate(r.used_at, true)}</div>}</td>
                    <td className={TD}>{r.response ? <Link href={`/admin/inquiries?id=${r.response.id}`} className="text-brown font-semibold">응답 보기 → <Badge style={inquiryBadge(r.response.status)}>{INQUIRY_STATUS[r.response.status] ?? r.response.status}</Badge></Link> : <span className="text-[rgba(33,30,25,.35)]">—</span>}</td>
                    <td className={TD}>{s === "active" ? <CopyButton text={applyLinkUrl(r.token)} label="링크 복사" /> : <span className="text-[rgba(33,30,25,.35)]">—</span>}</td>
                    <td className={TD}>{s === "active" && <RevokeLinkButton id={r.id} />}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
