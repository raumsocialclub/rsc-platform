"use client";

import Link from "next/link";
import { useState } from "react";
import { QUESTIONS, SLOTS, ROUTES, evaluate } from "@/lib/fit-check/questions";

type View = "intro" | "q" | "result" | "form" | "done";

export type FitCheckSubmission = {
  name: string;
  phone: string;
  route: string;
  slot: string;
  picks: Record<string, number>;
  answers: { key: string; label: string; question: string; answer: string }[];
  resultType: string;
};

type Props = {
  /** 제출 처리. 기본값은 POST /api/inquiries 호출. 테스트나 다른 저장 방식이 필요할 때 바꿔 끼운다. */
  onSubmit?: (data: FitCheckSubmission) => Promise<void>;
};

/** 기본 제출: 서버 Route Handler 에 저장한다. (FLOWS.md 1-1) */
async function submitToApi(data: FitCheckSubmission) {
  const res = await fetch("/api/inquiries", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  const json = (await res.json().catch(() => null)) as { ok?: boolean; message?: string } | null;
  if (!res.ok || !json?.ok) {
    throw new Error(json?.message ?? "신청을 저장하지 못했습니다. 잠시 후 다시 시도해 주세요.");
  }
}

const OVERLINE = "text-[11px] tracking-[.34em] text-[rgba(33,30,25,.5)]";
const BACK_BTN = "border-0 bg-transparent cursor-pointer text-[13px] tracking-[.14em] text-[rgba(33,30,25,.5)] px-0 py-[8px]";
const NEXT_BTN = "border-0 cursor-pointer px-[42px] py-[16px] bg-brown text-cream text-[13.5px] tracking-[.06em]";
const FOOT = "flex items-center justify-between gap-[24px] pt-[26px] border-t border-[rgba(33,30,25,.14)]";
const UNDERLINE_INPUT = "w-full border-0 border-b border-[rgba(33,30,25,.28)] bg-transparent px-0 py-[12px] text-[16px] text-ink outline-none rounded-none";

export function FitCheck({ onSubmit }: Props) {
  const [view, setView] = useState<View>("intro");
  const [i, setI] = useState(0);
  const [picks, setPicks] = useState<Record<string, number>>({});
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [route, setRoute] = useState("");
  const [slot, setSlot] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const q = QUESTIONS[i];
  const idx = picks[q.key];
  const opt = idx != null ? q.options[idx] : null;
  const blocked = !!opt?.block;
  const showInsight = view === "q" && idx != null && !blocked;
  const ev = evaluate(picks);
  const canSubmit = name.trim() !== "" && phone.trim() !== "" && agreed;

  const next = () => {
    if (view === "result") return setView("form");
    if (i < QUESTIONS.length - 1) return setI(i + 1);
    setView("result");
  };
  const back = () => {
    if (view === "form") return setView("result");
    if (view === "result") { setView("q"); setI(QUESTIONS.length - 1); return; }
    if (i === 0) return setView("intro");
    setI(i - 1);
  };

  const submit = async () => {
    if (!canSubmit || submitting) return;
    setError(null);
    setSubmitting(true);
    try {
      await (onSubmit ?? submitToApi)({
        name: name.trim(),
        phone: phone.trim(),
        route,
        slot,
        picks,
        answers: QUESTIONS.filter((qq) => picks[qq.key] != null).map((qq) => ({
          key: qq.key, label: qq.summary, question: qq.title, answer: qq.options[picks[qq.key]].t,
        })),
        resultType: ev.profile.en,
      });
      setView("done");
    } catch (e) {
      setError(e instanceof Error ? e.message : "신청을 저장하지 못했습니다. 잠시 후 다시 시도해주세요.");
    } finally {
      setSubmitting(false);
    }
  };

  const card = (active: boolean) =>
    `cursor-pointer text-left px-[24px] py-[26px] border text-ink transition-all duration-200 ${active ? "bg-sandActive border-brown" : "bg-transparent border-[rgba(33,30,25,.18)]"}`;
  const chip = (active: boolean) =>
    `cursor-pointer px-[26px] py-[15px] text-[14.5px] border text-ink transition-all duration-200 ${active ? "bg-sandActive border-brown" : "bg-transparent border-[rgba(33,30,25,.22)]"}`;

  return (
    <div className="w-full max-w-[1000px] mx-auto">
      {view === "intro" && (
        <div className="py-[32px]">
          <div className="text-[11px] tracking-[.3em] text-[rgba(33,30,25,.5)] mb-[40px]">A PRIVATE COMMUNITY FOR REMARKABLE SINGLES</div>
          <h1 className="font-medium text-[clamp(32px,4.2vw,58px)] leading-[1.36] mb-[34px] text-pretty">아름다운 공간에서,<br />서로의 특별함을 발견하는 곳</h1>
          <p className="mb-[30px] text-[16.5px] leading-[1.9] text-[rgba(33,30,25,.7)] max-w-[600px] text-pretty">몇 가지 질문에 답하시면, <br />회원님의 라이프스타일에 맞는 RSC 프로그램과 커뮤니티 적합성을 안내드립니다.</p>
          <p className="mb-[52px] text-[15.5px] leading-[1.9] text-[rgba(33,30,25,.55)] max-w-[560px] text-pretty">RSC는 소개팅 서비스가 아닙니다. <br />취향과 태도가 맞는 사람을 반복적으로 만날 수 있는 커뮤니티인지, 먼저 확인해 보세요.</p>
          <button type="button" onClick={() => { setView("q"); setI(0); }} className="border-0 cursor-pointer px-[44px] py-[18px] bg-brown text-cream text-[14px] tracking-[.06em]">시작하기</button>
          <div className="mt-[34px] text-[13px] text-[rgba(33,30,25,.45)]">약 2분 · 가입 상담은 커뮤니티 적합성 확인 후 진행됩니다</div>
        </div>
      )}

      {view === "q" && (
        <div>
          <div className="flex items-baseline justify-between gap-[24px] mb-[34px]">
            <div className={OVERLINE}>{q.label}</div>
            <div className="text-[12px] tracking-[.18em] text-[rgba(33,30,25,.4)]">{i + 1} / {QUESTIONS.length}</div>
          </div>
          <h2 className="font-medium text-[clamp(27px,3.4vw,46px)] leading-[1.36] mb-[20px] text-pretty">{q.title}</h2>
          <p className="mb-[46px] text-[14.5px] leading-[1.8] text-[rgba(33,30,25,.5)] max-w-[660px] text-pretty">{q.sub}</p>

          <div className="grid grid-cols-[repeat(auto-fit,minmax(258px,1fr))] gap-[14px]">
            {q.options.map((o, n) => (
              <button key={o.t} type="button" onClick={() => setPicks({ ...picks, [q.key]: n })} className={card(idx === n)}>
                <div className="text-[15.5px] font-medium mb-[8px]">{o.t}</div>
                <div className="text-[13.5px] leading-[1.7] text-[rgba(33,30,25,.55)]">{o.d}</div>
              </button>
            ))}
          </div>

          {showInsight && opt?.insight && (
            <div className="mt-[52px] border-l-2 border-brown pl-[26px] py-[4px]">
              <div className="text-[clamp(20px,2.2vw,27px)] leading-[1.5] mb-[14px] text-pretty">{opt.insight.title}</div>
              <div className="text-[14.5px] leading-[1.85] text-[rgba(33,30,25,.62)] max-w-[780px] text-pretty">{opt.insight.body}</div>
            </div>
          )}

          {view === "q" && blocked && (
            <div className="mt-[52px] px-[26px] py-[28px] border border-[rgba(33,30,25,.18)]">
              <div className="text-[15px] font-medium mb-[10px]">RSC는 현재 솔로인 분들을 위한 커뮤니티입니다</div>
              <div className="text-[14px] leading-[1.75] text-[rgba(33,30,25,.6)] text-pretty">지금은 가입 대상이 아니지만, 라움의 공연·전시·다이닝은 누구나 즐기실 수 있습니다.</div>
            </div>
          )}

          <div className={`${FOOT} mt-[60px]`}>
            <button type="button" onClick={back} className={BACK_BTN}>이 전</button>
            {showInsight && (
              <button type="button" onClick={next} className={NEXT_BTN}>다음</button>
            )}
          </div>
        </div>
      )}

      {view === "result" && (
        <div>
          <div className={`${OVERLINE} mb-[34px]`}>YOUR RSC PROFILE</div>
          <h2 className="font-medium text-[clamp(28px,3.6vw,48px)] leading-[1.34] mb-[44px] text-pretty">회원님께 어울리는<br />RSC의 시작입니다</h2>

          <div className="border border-[rgba(33,30,25,.18)] px-[44px] py-[48px] mb-[52px]">
            <div className="text-[clamp(23px,2.9vw,35px)] tracking-[.1em] mb-[18px]">{ev.profile.en}</div>
            <div className="text-[15px] font-medium text-brown mb-[22px]">{ev.profile.ko}</div>
            <div className="text-[15.5px] leading-[1.9] text-[rgba(33,30,25,.68)] max-w-[720px] text-pretty">{ev.profile.body}</div>
          </div>

          <div className="flex flex-col gap-[22px] mb-[60px]">
            {ev.axes.map((ax) => (
              <div key={ax.k}>
                <div className="flex items-baseline justify-between mb-[10px]">
                  <span className="text-[11.5px] tracking-[.24em] text-[rgba(33,30,25,.55)]">{ax.label}</span>
                  <span className="text-[12px] tracking-[.14em] text-[rgba(33,30,25,.5)]">{ax.pct}%</span>
                </div>
                <div className="h-px bg-[rgba(33,30,25,.16)] relative">
                  <div className="absolute left-0 top-0 h-px bg-brown" style={{ width: `${Math.max(ax.pct, 4)}%` }} />
                </div>
                <div className="mt-[10px] text-[13px] leading-[1.7] text-[rgba(33,30,25,.5)] text-pretty">{ax.note}</div>
              </div>
            ))}
          </div>

          <div className="text-[15px] font-medium mb-[24px]">추천하는 첫 프로그램</div>
          <div className="border-l-2 border-brown pl-[26px] py-[16px] mb-[56px]">
            <div className="text-[20px] mb-[10px]">{ev.recProgram}</div>
            <div className="text-[14.5px] leading-[1.8] text-[rgba(33,30,25,.62)] text-pretty">{ev.recBody}</div>
          </div>

          <div className="text-[15px] font-medium mb-[20px]">먼저 안내드리고 싶은 것</div>
          <div className="grid grid-cols-[repeat(auto-fit,minmax(240px,1fr))] gap-px bg-[rgba(33,30,25,.14)] border border-[rgba(33,30,25,.14)] mb-[52px]">
            {ev.picksSummary.map((p) => (
              <div key={p.label} className="bg-cream px-[24px] py-[26px]">
                <div className="text-[10.5px] tracking-[.26em] text-brown mb-[14px]">{p.label}</div>
                <div className="text-[14.5px] leading-[1.75] text-[rgba(33,30,25,.74)] text-pretty">{p.value}</div>
              </div>
            ))}
          </div>

          <p className="mb-[48px] text-[14px] leading-[1.85] text-[rgba(33,30,25,.5)] max-w-[780px] text-pretty">RSC 멤버십은 프로필과 취향, 라이프스타일 확인을 거쳐 승인됩니다. 가입 상담에서 커뮤니티 적합성을 함께 확인해 드립니다.</p>

          <div className={FOOT}>
            <button type="button" onClick={back} className={BACK_BTN}>이 전</button>
            <button type="button" onClick={next} className={NEXT_BTN}>가입 상담 신청</button>
          </div>
        </div>
      )}

      {view === "form" && (
        <div>
          <div className={`${OVERLINE} mb-[34px]`}>MEMBERSHIP REVIEW</div>
          <h2 className="font-medium text-[clamp(28px,3.4vw,44px)] leading-[1.36] mb-[26px] text-pretty">가입 상담 담당자가<br />직접 연락드립니다</h2>
          <p className="mb-[56px] text-[15.5px] leading-[1.85] text-[rgba(33,30,25,.62)] max-w-[680px] text-pretty">남겨주신 프로필을 바탕으로 커뮤니티 적합성을 확인하고, 어울리는 프로그램과 멤버십을 안내드립니다.</p>

          <div className="flex flex-col gap-[44px] max-w-[760px]">
            <div>
              <div className="text-[13.5px] font-medium mb-[16px]">성함 <span className="text-brown font-medium">*</span></div>
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="성함을 입력해 주세요" className={UNDERLINE_INPUT} autoComplete="name" />
            </div>
            <div>
              <div className="text-[13.5px] font-medium mb-[16px]">연락처 <span className="text-brown font-medium">*</span></div>
              <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="연락처를 입력해 주세요" className={UNDERLINE_INPUT} inputMode="tel" autoComplete="tel" />
            </div>
            <div>
              <div className="text-[13.5px] font-medium mb-[16px]">라움과의 인연 <span className="text-[rgba(33,30,25,.4)] font-medium">선택</span></div>
              <select value={route} onChange={(e) => setRoute(e.target.value)} className={UNDERLINE_INPUT}>
                <option value="">선택해 주세요</option>
                {ROUTES.map((r) => (
                  <option key={r.value} value={r.value}>{r.label}</option>
                ))}
              </select>
            </div>
            <div>
              <div className="text-[13.5px] font-medium mb-[16px]">통화 희망 시간 <span className="text-[rgba(33,30,25,.4)] font-medium">선택</span></div>
              <div className="flex flex-wrap gap-[12px]">
                {SLOTS.map((t) => (
                  <button key={t} type="button" onClick={() => setSlot(slot === t ? "" : t)} className={chip(slot === t)}>{t}</button>
                ))}
              </div>
            </div>
            <label className="flex items-start gap-[14px] cursor-pointer">
              <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} className="w-[17px] h-[17px] mt-[2px] accent-brown cursor-pointer" />
              <span className="text-[14px] leading-[1.7] text-[rgba(33,30,25,.68)] text-pretty">개인정보 수집 및 이용에 동의합니다. 가입 상담 목적으로만 사용되며, 요청하시면 즉시 파기합니다.</span>
            </label>
          </div>

          {error && <p className="mt-[24px] text-[13px] text-error">{error}</p>}

          <div className={`${FOOT} mt-[64px]`}>
            <button type="button" onClick={back} className={BACK_BTN}>이 전</button>
            <button
              type="button"
              onClick={submit}
              disabled={!canSubmit || submitting}
              className={`border-0 px-[42px] py-[16px] text-[13.5px] tracking-[.06em] text-cream ${canSubmit ? "bg-ink cursor-pointer" : "bg-[rgba(33,30,25,.25)] cursor-not-allowed"} ${submitting ? "opacity-60" : ""}`}
            >
              {submitting ? "신청 중…" : "상담 신청하기"}
            </button>
          </div>
        </div>
      )}

      {view === "done" && (
        <div className="py-[60px]">
          <div className="text-[11px] tracking-[.34em] text-brown mb-[36px]">THANK YOU</div>
          <h2 className="font-medium text-[clamp(30px,3.6vw,48px)] leading-[1.36] mb-[28px] text-pretty">신청이 접수되었습니다</h2>
          <p className="mb-[52px] text-[16px] leading-[1.9] text-[rgba(33,30,25,.66)] max-w-[560px] text-pretty">영업일 기준 2일 이내에 가입 상담 담당자가 연락드립니다. 그 사이 궁금한 점이 있으시면 언제든 문의해 주세요.</p>
          <div className="flex gap-[12px] flex-wrap">
            <Link href="/" className="inline-flex items-center px-[34px] py-[16px] bg-brown text-cream text-[13.5px] hover:text-cream">홈으로 돌아가기</Link>
            <a href="mailto:support@theraum.co.kr" className="inline-flex items-center px-[34px] py-[16px] border border-[rgba(33,30,25,.3)] text-[13.5px] hover:border-brown hover:text-brown">support@theraum.co.kr</a>
          </div>
        </div>
      )}
    </div>
  );
}
