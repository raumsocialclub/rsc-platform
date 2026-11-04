import Link from "next/link";
import { ApplyLinkForm, RevokeLinkButton } from "./ApplyLinkForm";
import { CopyButton } from "./CopyButton";
import { CARD, TH, TD, Badge, EmptyRow, PageTitle } from "./ui";
import { badgeStyle, fmtDate } from "@/lib/admin/format";
import { APPLY_LINK_STATUS_KO, applyLinkUrl, linkStatus, type ApplyLink } from "@/lib/apply/links";

export type ApplyLinkRow = ApplyLink & { responses: number };

const statusBadge = (s: ReturnType<typeof linkStatus>) => badgeStyle(s === "active" ? "ok" : s === "revoked" ? "bad" : "mute");

/**
 * /admin/apply — 상담 전 설문 공용 비밀 링크 관리. 흐름: 전화 상담 완료 → 「설문 링크 만들기」(용도별 하나면 충분) → 주소를 직접 전달(재전달 가능) →
 * 받은 분이 로그인 없이 작성 → 상담 신청 목록에 「설문」으로 들어온다(상세에서 전 문항 확인, 주관리자는 설문 응답 CSV).
 */
export function ApplyLinksView({ rows, applyCount }: { rows: ApplyLinkRow[]; applyCount: number }) {
  const active = rows.filter((r) => linkStatus(r) === "active").length;
  return (
    <>
      <PageTitle overline="PRE-CONSULTATION" title="상담 전 설문" aside={<span className="text-[16px] text-[rgba(33,30,25,.5)]">사용 중인 링크 {active}개 · 응답 {applyCount}건</span>}>
        <ApplyLinkForm />
      </PageTitle>
      <div className="text-[12.5px] leading-[1.7] text-[rgba(33,30,25,.6)] mb-[16px]">
        전화 상담을 마치고 니즈가 확실한 분들에게 보내는 대면 상담 전 설문입니다. 사이트 어디에도 노출되지 않고 여기서 만든 비밀 링크로만 열립니다.
        링크 하나를 여러 분에게 보내도 되고 받은 분이 다시 전달해도 됩니다(로그인 불필요). 용도별로 링크를 나누면(예: 월별) 어느 링크로 들어온 응답인지 구분됩니다.
        응답은 <Link href="/admin/inquiries?kind=apply" className="text-brown font-semibold">상담 신청 → 상담 전 설문</Link>에 모이고 주관리자는 「설문 응답 CSV」로 내려받습니다.
      </div>
      <div className={CARD}>
        <div className="overflow-x-auto">
          <table className="border-collapse w-full">
            <thead><tr>{["만든 날", "링크 이름", "메모", "유효기간", "상태", "응답", "링크", ""].map((h, i) => <th key={i} className={TH}>{h}</th>)}</tr></thead>
            <tbody>
              {rows.length === 0 && <EmptyRow colSpan={8}>아직 만든 설문 링크가 없습니다. 「설문 링크 만들기」로 시작하세요.</EmptyRow>}
              {rows.map((r) => {
                const s = linkStatus(r);
                return (
                  <tr key={r.id} className="hover:bg-[#faf7f1]">
                    <td className={`${TD} text-[rgba(33,30,25,.6)]`}>{fmtDate(r.created_at)}</td>
                    <td className={TD}><b>{r.name || "—"}</b></td>
                    <td className={`${TD} whitespace-normal max-w-[240px] text-[12.5px] text-[rgba(33,30,25,.65)]`}>{r.memo || "—"}</td>
                    <td className={`${TD} text-[rgba(33,30,25,.6)]`}>~ {fmtDate(r.expires_at)}</td>
                    <td className={TD}><Badge style={statusBadge(s)}>{APPLY_LINK_STATUS_KO[s]}</Badge></td>
                    <td className={TD}>{r.responses ? <Link href={`/admin/inquiries?kind=apply&link=${r.id}`} className="text-brown font-semibold">{r.responses}건 보기 →</Link> : <span className="text-[rgba(33,30,25,.35)]">0건</span>}{r.last_used_at && <div className="text-[11.5px] text-[rgba(33,30,25,.45)] mt-[2px]">최근 {fmtDate(r.last_used_at, true)}</div>}</td>
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
