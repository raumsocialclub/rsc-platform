import Link from "next/link";
import { CARD, TH, TD, Badge, EmptyRow, PageTitle, BTN_SECONDARY } from "./ui";
import { EventsFilter } from "./EventsFilter";
import { EventStatusButtons } from "./EventStatusButtons";
import { INQUIRY_STATUS, badgeStyle, fmtDate, fmtShortDate, inquiryBadge } from "@/lib/admin/format";
import type { EventApplicationRow, EventSummary } from "@/lib/events/admin";
import { JOIN_STATE_KO, joinState, matchAnswersOf } from "@/lib/inquiries/join";
import { QUESTION_BY_KEY, ageOf, displayMatchAnswer } from "@/lib/match/schema";
import { APPLY_SOURCE_KO, APPLY_STATUS_KO, type ApplyState, type ApplyStatus } from "@/lib/posts/apply";

const STATE_KO: Record<ApplyState, { label: string; tone: "ok" | "mute" | "warn" }> = { open: { label: "모집 중", tone: "ok" }, closed: { label: "참여 종료", tone: "mute" }, off: { label: "버튼 꺼짐 · 비공개", tone: "warn" } };
const statusTone = (s: ApplyStatus) => (s === "confirmed" ? "ok" : s === "cancelled" ? "bad" : "warn");

/**
 * 어드민 「프로그램 참여 신청」 (M24): 소식별 현황 표 + 고른 소식의 신청자 표.
 * 참여 신청은 소식 「참여하기」 → 사전등록 설문(처음) 또는 휴대폰 확인(이미 설문을 낸 사람)으로 들어온다. 행 = event_applications 한 건.
 */
export function EventsView({ events, selected, rows, total, filter }: { events: EventSummary[]; selected: EventSummary | null; rows: EventApplicationRow[]; total: number; filter: { status: ApplyStatus | null; q: string } }) {
  const sum = (k: ApplyStatus) => events.reduce((n, e) => n + e.counts[k], 0);
  const withApps = events.filter((e) => e.total > 0 || e.state === "open");
  const summary = (r: EventApplicationRow["inquiry"]) => {
    if (!r) return "";
    const m = matchAnswersOf(r);
    const birth = String(m.birth ?? "");
    const age = birth ? ageOf(birth) : null;
    return [displayMatchAnswer(QUESTION_BY_KEY.gender, m), age != null ? `만 ${age}세` : ""].filter(Boolean).join(" · ");
  };
  const cell = (r: EventApplicationRow["inquiry"], key: string) => (r ? displayMatchAnswer(QUESTION_BY_KEY[key], matchAnswersOf(r)) : "");
  const filtered = !!(filter.status || filter.q);
  return (
    <>
      <PageTitle overline="PROGRAMS" title="프로그램 참여 신청" aside={<span className="text-[16px] text-[rgba(55,56,60,.61)]">신청 {sum("applied")}건 · 참석 확정 {sum("confirmed")}건 · 취소 {sum("cancelled")}건</span>} />
      <div className="text-[13px] text-[rgba(55,56,60,.61)] mb-[12px]">소식 게시판 글의 「참여하기」 버튼으로 들어온 참여 신청자 DB 입니다. 처음인 분은 3분 프로필 설문을 마치면, 이미 설문을 낸 분은 휴대폰 번호 확인만으로 여기에 들어옵니다(한 사람이 소식 하나에 한 건). 행사 일자가 지난 소식은 공개 화면에서 「참여 종료」로 바뀌고 신청을 받지 않습니다. 버튼을 끄려면 소식 편집의 「참여하기 버튼 표시」를 해제하세요.</div>

      <div className={`${CARD} mb-[20px]`}>
        <div className="overflow-x-auto">
          <table className="border-collapse w-full">
            <thead><tr>{["소식(프로그램)", "행사 일자", "참여 상태", "신청", "참석 확정", "취소", ""].map((h) => <th key={h} className={TH}>{h}</th>)}</tr></thead>
            <tbody>
              {withApps.length === 0 && <EmptyRow colSpan={7}>발행된 소식이 없습니다. 소식 게시판에서 글을 발행하면 「참여하기」 버튼이 붙고 여기에 신청이 모입니다.</EmptyRow>}
              {withApps.map((e) => {
                const st = STATE_KO[e.state];
                const on = selected?.id === e.id;
                return (
                  <tr key={e.id} className={on ? "bg-[rgba(0,102,255,.05)]" : "hover:bg-[rgba(112,115,124,.05)]"}>
                    <td className={TD}><Link href={`/admin/events?post=${e.id}`} className={`font-bold ${on ? "text-primary" : "text-label hover:text-primary"}`}>{e.title}</Link>{!e.published && <span className="ml-[6px] text-[11px] text-[rgba(55,56,60,.61)]">(비공개)</span>}</td>
                    <td className={`${TD} text-[rgba(55,56,60,.61)]`}>{e.event_date ? e.event_date.slice(0, 10).replace(/-/g, ".") : "—"}</td>
                    <td className={TD}><Badge style={badgeStyle(st.tone)}>{st.label}</Badge></td>
                    <td className={TD}>{e.counts.applied}</td>
                    <td className={TD}>{e.counts.confirmed}</td>
                    <td className={`${TD} text-[rgba(55,56,60,.61)]`}>{e.counts.cancelled}</td>
                    <td className={`${TD} text-right`}>
                      <Link href={`/admin/events?post=${e.id}`} className="text-[13px] text-primary font-semibold mr-[12px]">신청자 보기</Link>
                      <Link href={`/news/${encodeURIComponent(e.slug)}`} target="_blank" className="text-[13px] text-[rgba(55,56,60,.61)] underline mr-[12px]">소식 보기 ↗</Link>
                      <Link href={`/admin/posts/${e.id}`} className="text-[13px] text-[rgba(55,56,60,.61)] underline">편집</Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {selected && (
        <div className={CARD}>
          <div className="flex items-start justify-between gap-[16px] flex-wrap px-[18px] pt-[16px] pb-[12px] border-b border-lineAlt">
            <div>
              <div className="text-[11px] tracking-[.02em] text-[rgba(55,56,60,.61)]">신청자 목록</div>
              <div className="text-[18px] font-semibold text-label">{selected.title} <span className="text-[13px] font-normal text-[rgba(55,56,60,.61)] ml-[6px]">{selected.event_date ? `행사일 ${selected.event_date.slice(0, 10).replace(/-/g, ".")} · ` : ""}{total}명</span></div>
            </div>
            <div className="flex items-center gap-[8px] flex-wrap">
              <EventsFilter postId={selected.id} status={filter.status} q={filter.q} />
              <a href={`/api/admin/events/export?post=${selected.id}`} className={`${BTN_SECONDARY} px-[14px]`}>CSV 내려받기</a>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="border-collapse w-full">
              <thead><tr>{["신청일", "이름", "성별 · 나이", "연락처", "거주지", "직업", "가입 상태", "상담 상태", "경로", "참석 상태", "메모"].map((h) => <th key={h} className={TH}>{h}</th>)}</tr></thead>
              <tbody>
                {rows.length === 0 && <EmptyRow colSpan={11}>{filtered ? "조건에 맞는 신청이 없습니다." : "아직 이 소식의 참여 신청이 없습니다."}</EmptyRow>}
                {rows.map((a) => {
                  const r = a.inquiry;
                  return (
                    <tr key={a.id} className="hover:bg-[rgba(112,115,124,.05)]">
                      <td className={`${TD} text-[rgba(55,56,60,.61)]`}>{fmtShortDate(a.created_at)}</td>
                      <td className={TD}>{r ? <Link href={`/admin/join/${r.id}`} className="font-bold text-primary">{r.name || "—"}</Link> : <span className="text-[rgba(55,56,60,.61)]">삭제된 신청</span>}</td>
                      <td className={TD}>{summary(r) || "—"}</td>
                      <td className={TD}>{r?.phone || "—"}</td>
                      <td className={`${TD} text-[rgba(55,56,60,.61)]`}>{[cell(r, "homeSido"), cell(r, "homeGugun")].filter(Boolean).join(" ") || "—"}</td>
                      <td className={`${TD} text-[rgba(55,56,60,.61)]`}>{[cell(r, "jobCategory"), cell(r, "jobDetail")].filter(Boolean).join(" · ") || "—"}</td>
                      <td className={TD}>{r ? <Badge style={badgeStyle(joinState(r) === "approved" ? "ok" : "mute")}>{JOIN_STATE_KO[joinState(r)]}</Badge> : "—"}</td>
                      <td className={TD}>{r ? <Badge style={inquiryBadge(r.status)}>{INQUIRY_STATUS[r.status] ?? r.status}</Badge> : "—"}</td>
                      <td className={`${TD} text-[rgba(55,56,60,.61)]`}>{APPLY_SOURCE_KO[a.source]}</td>
                      <td className={TD}>
                        <div className="flex items-center gap-[8px]">
                          <Badge style={badgeStyle(statusTone(a.status))}>{APPLY_STATUS_KO[a.status]}</Badge>
                          <EventStatusButtons id={a.id} status={a.status} memo={a.memo} />
                        </div>
                        {a.status_at && <div className="text-[11px] text-[rgba(55,56,60,.61)] mt-[3px]">{fmtDate(a.status_at)}</div>}
                      </td>
                      <td className={`${TD} max-w-[220px] whitespace-normal text-[13px] text-[rgba(55,56,60,.61)]`}>{a.memo || "—"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="mt-[20px] text-[12px] text-[rgba(55,56,60,.61)]">예약·결제형 프로그램(회차·정원·토스 결제)은 <Link href="/admin/programs" className="underline hover:text-primary">예전 프로그램 관리</Link>에 그대로 있습니다. 지금은 소식 게시판 + 참여 신청으로 운영하므로 메뉴에서는 뺐습니다.</div>
    </>
  );
}
