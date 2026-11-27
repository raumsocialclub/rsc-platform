import Link from "next/link";
import { CARD, TH, TD, Badge, EmptyRow, PageTitle } from "./ui";
import { JoinFilter } from "./JoinFilter";
import type { InquiryRow } from "./InquiryDetail";
import { INQUIRY_STATUS, badgeStyle, fmtDate, fmtShortDate, inquiryBadge } from "@/lib/admin/format";
import { JOIN_STATE_KO, joinSourceLabel, joinState, matchAnswersOf, type JoinFilter as JoinFilterValue } from "@/lib/inquiries/join";
import { QUESTION_BY_KEY, ageOf, displayMatchAnswer } from "@/lib/match/schema";

export type JoinRow = InquiryRow & { approved_at?: string | null };

/**
 * 어드민 「가입 신청」 목록 (2026-11-23): 프로필 진단(/match-check) 응답 = 라움소셜클럽 가입 요청자. 플로팅 버튼(사전등록)·초대코드 입력자 모두 여기.
 * 승인 대기 / 가입완료 탭, 이름·연락처 검색. 행을 누르면 회원 프로필 카드(/admin/join/:id)로 간다.
 */
export function JoinView({ rows, total, counts, filter }: { rows: JoinRow[]; total: number; counts: { pending: number; approved: number }; filter: { state: JoinFilterValue; q: string } }) {
  const summary = (r: JoinRow) => {
    const m = matchAnswersOf(r);
    const birth = String(m.birth ?? "");
    const age = birth ? ageOf(birth) : null;
    return [displayMatchAnswer(QUESTION_BY_KEY.gender, m), age != null ? `만 ${age}세` : ""].filter(Boolean).join(" · ");
  };
  const cell = (r: JoinRow, key: string) => displayMatchAnswer(QUESTION_BY_KEY[key], matchAnswersOf(r));
  const filtered = !!(filter.state || filter.q);
  return (
    <>
      <PageTitle overline="MEMBERSHIP" title="가입 신청" aside={<span className="text-[16px] text-[rgba(55,56,60,.61)]">승인 대기 {counts.pending}명 · 가입완료 {counts.approved}명</span>}>
        <JoinFilter state={filter.state} q={filter.q} />
      </PageTitle>
      <div className="text-[13px] text-[rgba(55,56,60,.61)] mb-[12px]">프로필 진단 설문(/match-check)으로 들어온 신청은 모두 라움소셜클럽 가입 요청자로 봅니다 — 플로팅 버튼(소셜클럽 사전등록하기 → /match-check?src=prereg)과 초대코드를 적은 신청 포함. 이름을 누르면 회원 프로필 카드가 열리고, 거기서 「가입 승인」을 누르면 가입완료로 바뀝니다. 상담 신청(/fit-check)은 「상담 신청」 메뉴에 따로 있습니다.</div>
      <div className={CARD}>
        <div className="overflow-x-auto">
          <table className="border-collapse w-full">
            <thead><tr>{["신청일", "이름", "성별 · 나이", "연락처", "거주지", "직업", "학력", "사진", "들어온 경로", "상담 상태", "가입 상태"].map((h) => <th key={h} className={TH}>{h}</th>)}</tr></thead>
            <tbody>
              {rows.length === 0 && <EmptyRow colSpan={11}>{filtered ? "조건에 맞는 가입 신청이 없습니다." : total === 0 ? "아직 가입 신청이 없습니다. 플로팅 버튼(소셜클럽 사전등록하기)으로 프로필 진단이 제출되면 여기에 표시됩니다." : "표시할 신청이 없습니다."}</EmptyRow>}
              {rows.map((r) => {
                const st = joinState(r);
                const photos = r.answers?.photos?.length ?? (r.answers?.photo ? 1 : 0);
                return (
                  <tr key={r.id} className="hover:bg-[rgba(112,115,124,.05)]">
                    <td className={`${TD} text-[rgba(55,56,60,.61)]`}><Link href={`/admin/join/${r.id}`} className="block">{fmtShortDate(r.created_at)}</Link></td>
                    <td className={TD}><Link href={`/admin/join/${r.id}`} className="block font-bold text-primary">{r.name || "—"}</Link></td>
                    <td className={TD}>{summary(r) || "—"}</td>
                    <td className={TD}>{r.phone || "—"}</td>
                    <td className={`${TD} text-[rgba(55,56,60,.61)]`}>{[cell(r, "homeSido"), cell(r, "homeGugun")].filter(Boolean).join(" ") || "—"}</td>
                    <td className={`${TD} text-[rgba(55,56,60,.61)]`}>{[cell(r, "jobCategory"), cell(r, "jobDetail")].filter(Boolean).join(" · ") || "—"}</td>
                    <td className={`${TD} text-[rgba(55,56,60,.61)]`}>{cell(r, "education") || "—"}</td>
                    <td className={`${TD} text-[rgba(55,56,60,.61)]`}>{photos ? `${photos}장` : "—"}</td>
                    <td className={TD}><Badge style={badgeStyle(r.answers?.inviteCode ? "warn" : "brand")}>{joinSourceLabel(r)}</Badge></td>
                    <td className={TD}><Badge style={inquiryBadge(r.status)}>{INQUIRY_STATUS[r.status] ?? r.status}</Badge></td>
                    <td className={TD}>
                      <Badge style={badgeStyle(st === "approved" ? "ok" : "mute")}>{JOIN_STATE_KO[st]}</Badge>
                      {r.approved_at && <div className="text-[11px] text-[rgba(55,56,60,.61)] mt-[3px]">{fmtDate(r.approved_at)}</div>}
                    </td>
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
