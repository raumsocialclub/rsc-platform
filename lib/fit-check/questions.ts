/**
 * RSC 상담(Fit Check) 설문 데이터 — deploy/fit-check.html 의 QUESTIONS/AXES/PROFILES/REC 를 그대로 옮김.
 * 문구는 확정본이므로 수정하지 않는다.
 */

export type AxisKey = "li" | "pe" | "re";
export type Scores = Partial<Record<AxisKey, number>>;

export type Option = {
  t: string;
  d: string;
  s: Scores;
  /** 선택 시 진행을 막는 옵션 (싱글 아님) */
  block?: boolean;
  day?: string;
  insight?: { title: string; body: string };
};

export type Question = {
  key: string;
  label: string;
  summary: string;
  noInsight?: boolean;
  title: string;
  sub: string;
  options: Option[];
};

export const QUESTIONS: Question[] = [
  {
    key: "single", label: "SCREENING", summary: "현재 상태", noInsight: true,
    title: "현재 싱글이신가요?",
    sub: "RSC는 현재 싱글인 분들을 위한 라이프스타일 커뮤니티입니다.",
    options: [
      { t: "네, 싱글입니다", d: "새로운 관계에 열려 있습니다", s: {},
        insight: { title: "잘 찾아오셨습니다.", body: "RSC는 현재 싱글인 분들이 반복적으로 만나며 관계를 만들어가는 커뮤니티입니다." } },
      { t: "아니오", d: "", s: {}, block: true },
    ],
  },
  {
    key: "stage", label: "LIFE STAGE", summary: "삶의 단계",
    title: "지금 삶의 단계를 가장 잘 나타내는 것은 무엇인가요?",
    sub: "RSC의 기준은 나이보다 라이프 스테이지입니다.",
    options: [
      { t: "일과 삶이 자리를 잡았습니다", d: "이제는 관계와 경험에 시간을 쓰고 싶습니다", s: { li: 2, re: 1 },
        insight: { title: "지금이 딱 맞는 때입니다.", body: "일과 삶이 자리 잡았지만 새로운 사람을 만날 기회가 부족한 싱글. RSC의 핵심 회원이 바로 이 지점에 있습니다." } },
      { t: "커리어에 몰입하는 시기입니다", d: "그래도 좋은 사람과의 시간은 놓치고 싶지 않습니다", s: { li: 3 },
        insight: { title: "일상에 여백을 만드는 방법.", body: "바쁜 시기에도 짧고 밀도 있게 좋은 경험을 쌓을 수 있도록, RSC SOCIAL은 주 단위로 열립니다." } },
      { t: "삶의 방향을 다시 그리는 중입니다", d: "새로운 사람들과 새로운 챕터를 시작하고 싶습니다", s: { re: 3 },
        insight: { title: "새로운 챕터는 새로운 사람들과 함께 옵니다.", body: "라움은 억지로 연결하지 않지만, 반복해서 만날 기회는 촘촘하게 설계합니다." } },
      { t: "이미 좋은 삶을 살고 있습니다", d: "그 삶을 나눌 사람이 있으면 더 좋겠습니다", s: { li: 1, re: 2 },
        insight: { title: "이미 멋진 삶에, 나눌 사람을 더합니다.", body: "RSC는 부족함을 채우는 곳이 아니라, 이미 좋은 삶에 좋은 사람을 더하는 곳입니다." } },
    ],
  },
  {
    key: "category", label: "RSC SOCIAL", summary: "먼저 함께하고 싶은 프로그램",
    title: "RSC SOCIAL 중, 가장 먼저 함께하고 싶은 프로그램은 무엇인가요?",
    sub: "연애를 앞세우지 않는 취향 기반 프로그램입니다. 좋아하는 것을 함께 경험하다 보면 자연스럽게 사람을 알게 됩니다.",
    options: [
      { t: "RAUM ART WALK", d: "전시 → 큐레이터 토크 → 자유 소셜", s: { li: 2, pe: 1 }, day: "전시를 함께 걷고, 큐레이터의 이야기를 들은 뒤 와인 한 잔으로 대화를 이어갑니다.",
        insight: { title: "예술과 취향이 자연스럽게 연결되는 시간.", body: "전시를 감상하고 큐레이터 토크를 들은 뒤, 와인과 함께 자유 소셜로 이어집니다." } },
      { t: "SUNDAY RESET", d: "요가·바레·명상 → 브런치 → 커뮤니티 테이블", s: { li: 3 }, day: "일요일 아침, 요가와 러닝으로 몸을 깨우고 브런치 테이블에서 한 주를 나눕니다.",
        insight: { title: "일요일을 리셋하는 회복의 시간.", body: "요가, 바레, 명상 이후 브런치와 커뮤니티 테이블로 이어지는 주간 프로그램입니다." } },
      { t: "TASTE TABLE", d: "와인·위스키 테이스팅 → 취향별 테이블", s: { pe: 2, li: 1 }, day: "테이스팅 후 취향이 비슷한 테이블에 앉아 자유롭게 이야기합니다.",
        insight: { title: "한 잔의 취향이 만드는 자연스러운 대화.", body: "와인 또는 위스키 테이스팅 후, 취향별 테이블에서 Free Social로 이어집니다." } },
      { t: "ONE QUESTION SALON", d: "4~6명이 나누는 소규모 살롱", s: { pe: 3 }, day: "하나의 질문을 두고 몇 명의 회원들과 깊은 대화를 나눕니다.",
        insight: { title: "하나의 질문이 만드는 깊은 대화.", body: "커리어, 여행, 삶의 방식, 관계, 가치관. 4~6명의 회원이 서로의 생각을 나누는 소규모 살롱입니다." } },
      { t: "RAUM AFTER HOURS", d: "공연 → 뮤직 → 애프터 소셜", s: { pe: 2, re: 1 }, day: "공연을 함께 보고, 칵테일과 함께 애프터 소셜로 밤이 이어집니다.",
        insight: { title: "공연이 끝나도 저녁은 이어집니다.", body: "공연 관람 후 음악을 즐기면서 애프터 소셜로 자연스럽게 대화가 길어지는 밤입니다." } },
      { t: "RUN & BRUNCH", d: "러닝·트레이닝 → 브런치 → 소셜", s: { li: 2, pe: 1 }, day: "함께 달리고, 땀이 식기 전 브런치 테이블에서 대화를 이어갑니다.",
        insight: { title: "함께 움직인 사람은 빨리 편해집니다.", body: "러닝과 트레이닝 후 브런치를 나누며 자연스러운 소셜 타임을 갖습니다." } },
    ],
  },
  {
    key: "people", label: "PEOPLE", summary: "함께하고 싶은 사람",
    title: "어떤 사람과 시간을 쌓아가고 싶으신가요?",
    sub: "라움이 한 번 확인한 사람들과 시작하는 관계입니다.",
    options: [
      { t: "취향이 닮은 사람", d: "같은 것을 좋아하는 사람", s: { li: 3 },
        insight: { title: "취향이 먼저, 소개는 그다음입니다.", body: "같은 전시를 보고 같은 잔을 든 사람들 사이에는 소개가 따로 필요하지 않습니다." } },
      { t: "대화가 깊어지는 사람", d: "가벼운 이야기 너머를 나누는 사람", s: { pe: 3 },
        insight: { title: "취향을 보고, 대화하는 방식을 봅니다.", body: "여러 프로그램에서 반복적으로 만나며 서로의 결을 알아가는 것이 RSC의 방식입니다." } },
      { t: "삶에 대한 태도가 좋은 사람", d: "자신의 삶을 주도적으로 사는 사람", s: { li: 1, re: 2 },
        insight: { title: "조건이 아니라 태도로 확인합니다.", body: "가입과 멤버십이 첫 번째 기준이며, 실제 활동과 태도가 두 번째 기준이 됩니다." } },
      { t: "다시 만나고 싶은 사람", d: "반복해서 마주치고 싶어지는 사람", s: { re: 3 },
        insight: { title: "한 번의 만남보다, 반복되는 좋은 시간.", body: "멋진 관계는 한 번의 만남이 아니라 좋은 시간이 반복될 때 시작됩니다." } },
      { t: "끌리는 인상과 분위기의 사람", d: "외모에 자연스럽게 끌리는 사람", s: { pe: 2, li: 1 },
        insight: { title: "끌림은 관계가 시작되는 가장 솔직한 이유입니다.", body: "라움은 외모와 분위기에서 시작되는 호감 역시 중요한 취향으로 존중합니다." } },
    ],
  },
  {
    key: "openness", label: "OPENNESS", summary: "관계를 대하는 태도",
    title: "새로운 관계를 대하는 회원님의 태도는 어떤가요?",
    sub: "RSC는 매칭이 아니라 커뮤니티입니다. 결과보다 과정에 열려 있는 분과 잘 맞습니다.",
    options: [
      { t: "천천히, 여러 번 만나며 알아가고 싶다", d: "", s: { re: 3 },
        insight: { title: "RSC와 가장 잘 맞는 태도입니다.", body: "한 번의 소개팅으로 상대를 판단하지 않습니다. 반복되는 프로그램 안에서 자연스럽게 관계가 깊어집니다." } },
      { t: "일단 좋은 사람들 속에 있어보고 싶다", d: "", s: { li: 3 },
        insight: { title: "먼저 커뮤니티에, 그다음 관계가 옵니다.", body: "매칭은 목적이 아니라 잘 설계된 커뮤니티 안에서 자연스럽게 발생하는 결과입니다." } },
      { t: "결이 맞으면 적극적으로 다가가는 편이다", d: "", s: { pe: 3 },
        insight: { title: "적극적인 태도도 환영합니다.", body: "다만 RSC는 공개적인 경쟁이나 선택 구조 없이, 자연스러운 만남을 우선합니다." } },
    ],
  },
  {
    key: "value", label: "VALUE", summary: "가장 기대하는 것",
    title: "RSC에서 가장 기대하는 것은 무엇인가요?",
    sub: "회원이 구매하는 것은 매칭 횟수가 아니라, 1년 동안 이어지는 경험과 관계의 가능성입니다.",
    options: [
      { t: "더 매력적인 싱글 라이프", d: "혼자서는 쉽게 경험하지 않았던 순간들", s: { li: 3 },
        insight: { title: "BETTER LIFE.", body: "전시, 공연, 와인, 운동, 다이닝. 가입하는 순간부터 삶 자체가 더 풍성해집니다." } },
      { t: "검증된 사람들과의 연결", d: "불특정 다수가 아닌 사람들", s: { pe: 3 },
        insight: { title: "BETTER PEOPLE.", body: "라움이라는 브랜드와 멤버십을 선택하고, 실제로 활동하는 사람들을 만납니다." } },
      { t: "자연스럽게 깊어지는 관계", d: "반복되는 시간이 만드는 관계", s: { re: 3 },
        insight: { title: "BETTER RELATIONSHIP.", body: "RAUM SOLO처럼, 여러 경험을 함께하며 서로를 알아갈 충분한 시간이 주어집니다." } },
    ],
  },
];

export const AXES: { k: AxisKey; label: string; note: string }[] = [
  { k: "li", label: "BETTER LIFE", note: "혼자서는 쉽게 경험하지 않았던 순간을 채우는 데서 만족을 얻는 유형입니다." },
  { k: "pe", label: "BETTER PEOPLE", note: "검증된 사람들과의 새로운 연결에서 만족을 얻는 유형입니다." },
  { k: "re", label: "BETTER RELATIONSHIP", note: "반복되는 만남 속에서 자연스럽게 깊어지는 관계를 기대하는 유형입니다." },
];

export type Profile = { en: string; ko: string; body: string };

export const PROFILES: Record<string, Profile> = {
  li_pe: { en: "THE EXPLORER", ko: "경험으로 시작하는 회원", body: "새로운 프로그램을 먼저 경험해보는 것을 선호하는 분입니다. RSC SOCIAL을 폭넓게 누리다 보면, 자연스럽게 반복해서 마주치는 얼굴이 생길 것입니다." },
  li_re: { en: "THE SETTLER", ko: "삶에 사람을 더하는 회원", body: "이미 자신의 삶에 만족하지만, 그 삶을 나눌 사람을 찾는 분입니다. 반복적인 프로그램 참여가 자연스러운 관계로 이어질 가능성이 높은 유형입니다." },
  pe_li: { en: "THE CONNECTOR", ko: "사람이 먼저인 회원", body: "무엇을 하는지보다 누구와 하는지가 중요한 분입니다. ONE QUESTION SALON처럼 소규모로 깊이 만나는 프로그램이 잘 맞습니다." },
  pe_re: { en: "THE COMPANION", ko: "관계에 마음이 열린 회원", body: "검증된 사람들 사이에서 편안함을 느낍니다. RAUM SOCIAL NIGHT와 같은 프로그램에서 새로운 관계의 시작을 기대할 수 있는 유형입니다." },
  re_li: { en: "THE SEEKER", ko: "다음 챕터를 찾는 회원", body: "삶의 방향을 새롭게 그리는 시기에 있는 분입니다. RSC SOCIAL로 시작해 RAUM SOLO까지, 자연스러운 여정이 준비되어 있습니다." },
  re_pe: { en: "THE READY ONE", ko: "관계에 가장 준비된 회원", body: "천천히, 반복해서 알아가는 방식을 가장 편안하게 느끼는 분입니다. RAUM SOLO의 6주 여정이 회원님에게 가장 잘 맞는 다음 단계입니다." },
};

export const REC_CATEGORY: Record<string, string> = {
  "RAUM ART WALK": "전시와 와인이 있는 저녁부터 시작해 보세요. 큐레이터 토크가 끝나면 자연스럽게 대화가 이어집니다.",
  "SUNDAY RESET": "일요일 아침의 요가와 브런치로 가볍게 시작해 보세요. 매주 같은 얼굴을 마주치게 됩니다.",
  "TASTE TABLE": "테이스팅 후 취향별 테이블에 앉는 것부터 시작해 보세요. 취향이 대화를 대신 열어줍니다.",
  "ONE QUESTION SALON": "소규모 살롱에서 깊은 대화로 시작해 보세요. 4~6명이라 서로를 빨리 알게 됩니다.",
  "RAUM AFTER HOURS": "공연이 있는 밤부터 시작해 보세요. 애프터 소셜에서 대화가 자연스럽게 길어집니다.",
  "RUN & BRUNCH": "함께 달리는 것부터 시작해 보세요. 땀을 흘린 사람들 사이엔 어색함이 빨리 사라집니다.",
};

export const SLOTS = ["오전 10–12시", "오후 2–4시", "오후 4–6시", "저녁 6–8시"];

export const ROUTES: { value: string; label: string }[] = [
  { value: "회원 추천", label: "기존 회원의 추천" },
  { value: "공연·전시 참석", label: "라움의 공연·전시 참석" },
  { value: "인스타그램", label: "인스타그램" },
  { value: "지인 소개", label: "지인 소개" },
  { value: "처음 알게 됨", label: "오늘 처음 알게 됐습니다" },
];

/** 선택 결과로 축 점수·프로필·추천을 계산한다. (설문 화면과 M2 API에서 공용) */
export function evaluate(picks: Record<string, number>) {
  const totals: Record<AxisKey, number> = { li: 0, pe: 0, re: 0 };
  const picked = (q: Question) => (picks[q.key] == null ? null : q.options[picks[q.key]]);
  QUESTIONS.forEach((q) => {
    const o = picked(q);
    if (!o) return;
    (Object.keys(o.s) as AxisKey[]).forEach((k) => { totals[k] += o.s[k] ?? 0; });
  });
  const order = (["li", "pe", "re"] as AxisKey[]).sort((a, b) => totals[b] - totals[a]);
  const profileKey = order[0] + "_" + order[1];
  const profile = PROFILES[profileKey] ?? PROFILES.li_pe;
  const max = Math.max(totals.li, totals.pe, totals.re, 1);

  const catQ = QUESTIONS.find((x) => x.key === "category")!;
  const catOpt = picked(catQ);
  const recProgram = catOpt ? catOpt.t : "RAUM ART WALK";
  const recBody = REC_CATEGORY[recProgram] ?? "";

  const picksSummary = ["stage", "people", "value"]
    .map((k) => {
      const q = QUESTIONS.find((x) => x.key === k)!;
      const o = picked(q);
      return o ? { label: q.summary, value: o.t + (o.d ? " — " + o.d : "") } : null;
    })
    .filter((x): x is { label: string; value: string } => x !== null);

  const axes = AXES.map((a) => ({ ...a, pct: Math.round((totals[a.k] / max) * 100) }));

  return { totals, profileKey, profile, recProgram, recBody, picksSummary, axes };
}
