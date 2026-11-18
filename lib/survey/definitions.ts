/**
 * 회원 설문조사 (비밀 링크 /s/<토큰>, 2026-11-18) — 문항 정의.
 * 첫 설문은 「RSC 2027 프로그램 수요조사」: 문자로 회원에게 링크를 보내고, 받은 분은 로그인 없이 한 화면에 한 질문씩 답한다. 응답은 어드민 → 설문조사(/admin/surveys)에 모인다.
 * 기획 초안(RSC 2027 행사·프로그램 수요조사 설문 PDF)의 PART 1(기본 정보)은 이미 받은 정보라 빼고, 관심 프로그램 분야를 PART 1, 모임 방식을 PART 2 로 둔다(사용자 지시).
 *
 * 화면(components/survey/SurveyForm.tsx) · 서버 검증(app/api/survey/route.ts) · 어드민 집계(components/admin/SurveyResults.tsx) · CSV(lib/survey/export.ts)가 이 정의를 함께 쓴다.
 * 새 설문을 만들려면 여기 SURVEY_DEFS 에 정의를 하나 더 넣으면 된다(어드민에서 그 종류로 링크를 만든다). 값은 전부 문자열(순위·복수 선택은 문자열 배열, 순위는 배열 순서 = 순위).
 * 톤: 클럽 라이프스타일 중심. 만남·매칭 표현은 쓰지 않는다(초안 화면 원칙).
 */
export type SurveyOption = { value: string; desc?: string };
export type SurveyQType = "rank" | "single" | "multi";
export type SurveyQuestion = {
  key: string;
  type: SurveyQType;
  /** 화면 위 작은 글씨 "PART 1. 관심 프로그램 분야" */
  part: string;
  /** "Q1" */
  no: string;
  title: string;
  sub?: string;
  options: SurveyOption[];
  /** rank: 골라야 하는 순위 수(정확히 이만큼). 배열 순서가 순위 */
  ranks?: number;
  /** multi: 최대 선택 수 */
  max?: number;
  /** 「기타」를 고르면 직접 입력 칸(`${key}Other`, 100자)이 붙는다 */
  other?: boolean;
  /** multi: 이 값을 고르면 다른 선택이 풀리고, 다른 값을 고르면 이 값이 풀린다 (예: 상관없음) */
  exclusive?: string;
  /** 어드민·CSV 짧은 이름 */
  label: string;
};
export type SurveyDef = {
  kind: string;
  /** 어드민 표시 이름 */
  name: string;
  /** 첫 화면 */
  eyebrow: string;
  title: string;
  intro: string;
  notes: string[];
  minutes: number;
  /** 마지막 화면에 이름·휴대폰 뒤 4자리(선택) 입력 */
  identify: boolean;
  questions: SurveyQuestion[];
  thanksTitle: string;
  thanksBody: string;
  /** 문자 발송 문구 초안. {link} 자리에 설문 주소가 들어간다 */
  sms: string;
};
export type SurveyAnswers = Record<string, string | string[]>;

export const OTHER = "기타";
export const OTHER_MAX = 100;
export const otherKey = (key: string) => `${key}Other`;
export const isOther = (v: string) => v === OTHER || v.startsWith(`${OTHER} `) || v.startsWith(`${OTHER}(`);

const o = (value: string, desc?: string): SurveyOption => ({ value, desc });

/** PART 1·2 (사용자 확정 문항, 2026-11-18) */
export const DEMAND_2027: SurveyDef = {
  kind: "demand2027",
  name: "2027 프로그램 수요조사",
  eyebrow: "RAUM SOCIAL CLUB",
  title: "2027 프로그램 수요조사",
  intro: "안녕하세요, RAUM SOCIAL CLUB입니다.\n아름다운 공간에서, 서로의 특별함을 발견하는 곳 — 2027년에도 라움의 공간에서 와인, 미식, 웰니스, 공연, 아트를 함께 즐기는 모임을 이어갑니다.\n모든 모임은 마지막에 함께 이야기 나누는 네트워킹 타임으로 마무리되고, 간단한 사전 확인을 거친 멤버들만 함께해요.\n어떤 모임이 가장 기대되는지 알려주세요.",
  notes: ["소요시간 약 1분 · 5문항", "모든 응답은 통계 목적으로만 사용되며, 개별 응답 내용은 다른 회원에게 공개되지 않습니다."],
  minutes: 1,
  identify: true,
  questions: [
    {
      key: "interest", type: "rank", part: "PART 1. 관심 프로그램 분야", no: "Q1",
      title: "2027년에 라움의 공간에서 가장 함께하고 싶은 프로그램 분야를 1순위·2순위로 선택해 주세요.",
      sub: "끌리는 순서대로 두 개를 눌러 주세요. 다시 누르면 선택이 풀려요.",
      ranks: 2, other: true, label: "관심 분야(1·2순위)",
      options: [
        o("TASTE TABLE", "와인과 미식을 즐기며, 취향이 닮은 사람들과 자연스럽게 대화를 나눕니다"),
        o("SOCIAL WELLNESS", "가든 요가·명상·사운드 배스 등 프로그램 후, 커뮤니티 테이블로 이어집니다"),
        o("ART WALK", "전시 관람 → 큐레이터 토크 → 자유 소셜로 이어지는 시간입니다"),
        o("ONE QUESTION SALON", "하나의 질문을 중심으로 4~6명이 서로의 생각을 나누는 소규모 살롱입니다"),
        o("AFTER HOURS", "공연을 보고, 음악과 함께 애프터 소셜로 밤이 이어집니다"),
        o("SOCIAL TIME", "가든 파티, 시즌 테마 파티 등 함께 시간을 나누며 네트워킹 시간을 갖습니다"),
        o(OTHER, "직접 입력"),
      ],
    },
    {
      key: "network", type: "multi", part: "PART 2. 모임 방식", no: "Q1",
      title: "모든 모임은 마지막에 함께 이야기 나누는 네트워킹 타임으로 이어집니다. 어떤 방식이 가장 편하신가요?",
      sub: "최대 2개까지 고를 수 있어요.", max: 2, exclusive: "상관없음", label: "네트워킹 방식",
      options: [o("라운지에서 자유롭게 대화하기"), o("진행자가 이끄는 테이블 토크 (자리를 바꿔가며 대화)"), o("가벼운 게임·미션으로 자연스럽게 어울리기"), o("프로그램을 함께하며 자연스럽게 (웰니스 프로그램·클래스 등)"), o("상관없음")],
    },
    {
      key: "size", type: "single", part: "PART 2. 모임 방식", no: "Q2",
      title: "선호하는 행사 규모는 어느 정도인가요?", label: "행사 규모",
      options: [o("소규모 (10명 내외)"), o("중규모 (20~40명)"), o("대규모 (60명 이상)"), o("프로그램에 따라 다름")],
    },
    {
      key: "fee", type: "single", part: "PART 2. 모임 방식", no: "Q3",
      title: "1회 참여비로 적정하다고 생각하는 금액대는?", label: "1회 참여비",
      options: [o("5~10만원"), o("10~15만원"), o("15~20만원"), o("상관없음")],
    },
    {
      key: "factors", type: "multi", part: "PART 2. 모임 방식", no: "Q4",
      title: "모임을 고를 때 가장 중요하게 보는 요소는 무엇인가요?", sub: "최대 3개까지 고를 수 있어요.", max: 3, other: true, label: "중요 요소",
      options: [o("프로그램 주제"), o("라움의 공간 분위기"), o("사전 확인을 거친 멤버 구성"), o("마무리 네트워킹 시간"), o("참여비"), o("일정(요일·시간)"), o("호스트·강사"), o("소규모의 프라이빗한 분위기"), o("사진·콘텐츠 제공"), o(OTHER, "직접 입력")],
    },
  ],
  thanksTitle: "응답해 주셔서 감사합니다",
  thanksBody: "남겨주신 의견은 2027년 프로그램을 준비하는 데 소중하게 쓰겠습니다.\n라움의 공간에서 곧 다시 뵙겠습니다.",
  sms: "(광고) [RAUM SOCIAL CLUB] 2027년, 어떤 모임을 열까요?\n\n▶ 소요시간: 1분 (5문항)\n▶ 참여링크: {link}\n\n*응답은 프로그램 기획 목적으로만 사용돼요.\n\n무료수신거부 080-000-0000",
};

export const SURVEY_DEFS: SurveyDef[] = [DEMAND_2027];
export const SURVEY_BY_KIND: Record<string, SurveyDef> = Object.fromEntries(SURVEY_DEFS.map((d) => [d.kind, d]));
export const DEFAULT_SURVEY_KIND = DEMAND_2027.kind;
export const surveyDef = (kind: string | null | undefined): SurveyDef | null => (kind && SURVEY_BY_KIND[kind]) || null;

const str = (v: unknown, max: number): string => (typeof v === "string" ? v.trim().slice(0, max) : "");
const uniqIn = (v: unknown, allowed: Set<string>): string[] => {
  if (!Array.isArray(v)) return [];
  const out: string[] = [];
  for (const x of v) if (typeof x === "string" && allowed.has(x) && !out.includes(x)) out.push(x);
  return out;
};

/**
 * 방문자가 보낸 답을 정의대로 정제한다: 모르는 키·선택지 밖의 값은 버리고, 순위는 정의된 개수까지, 복수 선택은 최대 수까지(배타 값이 섞이면 배타 값만), 기타 입력은 100자.
 * 「기타」를 고르지 않았으면 기타 입력도 버린다.
 */
export function sanitizeSurveyAnswers(def: SurveyDef, raw: Record<string, unknown>): SurveyAnswers {
  const out: SurveyAnswers = {};
  for (const q of def.questions) {
    const allowed = new Set(q.options.map((x) => x.value));
    const v = raw[q.key];
    if (q.type === "single") {
      const s = str(v, 200);
      if (allowed.has(s)) out[q.key] = s;
    } else {
      let list = uniqIn(v, allowed);
      if (q.type === "rank") list = list.slice(0, q.ranks ?? 1);
      else {
        if (q.exclusive && list.includes(q.exclusive)) list = [q.exclusive];
        list = list.slice(0, q.max ?? list.length);
      }
      if (list.length) out[q.key] = list;
    }
    if (q.other) {
      const picked = out[q.key];
      const hasOther = Array.isArray(picked) ? picked.includes(OTHER) : picked === OTHER;
      const text = str(raw[otherKey(q.key)], OTHER_MAX);
      if (hasOther && text) out[otherKey(q.key)] = text;
    }
  }
  return out;
}

/** 답이 모자란 첫 문항. 순위는 정확히 ranks 개, 단일·복수는 1개 이상. 없으면 null */
export function missingSurveyAnswer(def: SurveyDef, a: SurveyAnswers): SurveyQuestion | null {
  for (const q of def.questions) {
    const v = a[q.key];
    if (q.type === "rank") { if (!Array.isArray(v) || v.length !== (q.ranks ?? 1)) return q; }
    else if (q.type === "multi") { if (!Array.isArray(v) || v.length === 0) return q; }
    else if (typeof v !== "string" || !v) return q;
  }
  return null;
}

/** 선택값 표시: 「기타」는 입력한 내용을 괄호로 붙인다 */
export function displayOption(q: SurveyQuestion, value: string, a: SurveyAnswers): string {
  if (q.other && value === OTHER) {
    const t = a[otherKey(q.key)];
    return typeof t === "string" && t ? `${OTHER}(${t})` : OTHER;
  }
  return value;
}

/** 어드민·CSV 표시용 한 줄. 순위는 "1순위 TASTE TABLE · 2순위 ART WALK" */
export function displaySurveyAnswer(q: SurveyQuestion, a: SurveyAnswers): string {
  const v = a[q.key];
  if (q.type === "rank") return Array.isArray(v) ? v.map((x, i) => `${i + 1}순위 ${displayOption(q, x, a)}`).join(" · ") : "";
  if (q.type === "multi") return Array.isArray(v) ? v.map((x) => displayOption(q, x, a)).join(", ") : "";
  return typeof v === "string" ? displayOption(q, v, a) : "";
}

/** 1순위 = ranks 점, 2순위 = ranks-1 점 … (2순위까지면 2·1점). 분야별 합산으로 연간 비중을 정한다(초안 4절) */
export const rankPoints = (q: SurveyQuestion, index: number): number => Math.max(0, (q.ranks ?? 1) - index);

export type OptionStat = { value: string; count: number; byRank: number[]; score: number };
export type QuestionStat = { q: SurveyQuestion; options: OptionStat[]; others: string[]; answered: number };

/** 응답 묶음 집계: 선택지별 응답 수(순위형은 순위별 수 + 점수), 기타 입력 목록, 그 문항에 답한 수 */
export function summarizeSurvey(def: SurveyDef, rows: SurveyAnswers[]): QuestionStat[] {
  return def.questions.map((q) => {
    const stat = new Map<string, OptionStat>(q.options.map((x) => [x.value, { value: x.value, count: 0, byRank: Array.from({ length: q.ranks ?? 0 }, () => 0), score: 0 }]));
    const others: string[] = [];
    let answered = 0;
    for (const a of rows) {
      const v = a[q.key];
      const list = Array.isArray(v) ? v : typeof v === "string" && v ? [v] : [];
      if (!list.length) continue;
      answered++;
      list.forEach((x, i) => {
        const s = stat.get(x);
        if (!s) return;
        s.count++;
        if (q.type === "rank") { s.byRank[i] = (s.byRank[i] ?? 0) + 1; s.score += rankPoints(q, i); }
      });
      const t = a[otherKey(q.key)];
      if (q.other && list.includes(OTHER) && typeof t === "string" && t) others.push(t);
    }
    const options = [...stat.values()];
    if (q.type === "rank") options.sort((x, y) => y.score - x.score || y.byRank[0] - x.byRank[0]);
    else options.sort((x, y) => y.count - x.count);
    return { q, options, others, answered };
  });
}

/** 휴대폰 뒤 4자리(선택): 숫자 4자리만 받는다 */
export const PHONE4_RE = /^\d{4}$/;
