import { CHANNEL_KO, type CallLead, type CallStatus } from "./types";

/**
 * 인터뷰 니즈 분석 (M18-2). 시트 셀에 붙인 노트(노란 말풍선)와 「인터뷰 내용」 칸의 문장을
 * 주제별 키워드 규칙으로 태그한다. 규칙은 표시용일 뿐 원문은 그대로 보여주고, 어느 규칙에도 안 걸린 문장은 「분류 안 됨」으로 따로 보여준다.
 */
export type ThemeKey = "interest" | "activity" | "schedule" | "experience" | "budget" | "profile" | "followup";
export const THEMES: { key: ThemeKey; label: string; hint: string }[] = [
  { key: "interest", label: "원하는 것", hint: "1:1 · 커뮤니티 · 이성 만남 · 인맥" },
  { key: "activity", label: "관심 활동", hint: "와인 · 러닝 · 골프 · 여행 …" },
  { key: "schedule", label: "가능한 일정", hint: "평일 · 주말 · 저녁" },
  { key: "experience", label: "결정사 경험", hint: "이용 중 · 경험 없음" },
  { key: "budget", label: "금액 반응", hint: "무관 · 부담 · 할인" },
  { key: "profile", label: "프로필", hint: "나이대 · 성별 · 직업" },
  { key: "followup", label: "후속 요청", hint: "런칭 때 연락 · 문자 · 추후" },
];
export type Tag = { theme: ThemeKey; tag: string };

type Rule = { theme: ThemeKey; tag: string; re: RegExp };
const R = (theme: ThemeKey, tag: string, re: RegExp): Rule => ({ theme, tag, re });
const RULES: Rule[] = [
  R("interest", "1:1 매칭", /1\s*:\s*1|일대일|원온원|1\s*대\s*1/i),
  R("interest", "싱글 커뮤니티", /싱글\s*커뮤니티|커뮤니티|모임|소셜/),
  R("interest", "이성 만남", /이성|소개팅|연애|결혼\s*전제|결혼\s*상대|배우자|만남/),
  R("interest", "인맥·비즈니스", /인맥|네트워킹|비지니스|비즈니스|사업\s*(연결|관련)|협업/),
  R("interest", "취미·액티비티", /취미|액티비티|활동\s*위주|체험/),
  R("interest", "친구·또래", /친구|또래|동년배/),
  R("activity", "와인·미식", /와인|위스키|미식|맛집|다이닝|요리|칵테일/),
  R("activity", "러닝·운동", /러닝|달리기|마라톤|헬스|운동|크로스핏|필라테스|요가/),
  R("activity", "골프", /골프/),
  R("activity", "테니스·라켓", /테니스|배드민턴|스쿼시|피클볼/),
  R("activity", "등산·아웃도어", /등산|하이킹|트레킹|캠핑|아웃도어/),
  R("activity", "수상·스쿠버", /스쿠버|다이빙|서핑|수영|요트|세일링/),
  R("activity", "스키·보드", /스키|스노보드/),
  R("activity", "문화·예술", /전시|미술|공연|뮤지컬|음악|클래식|영화|독서|북클럽|사진/),
  R("activity", "여행", /여행|트립/),
  R("activity", "클라이밍", /클라이밍|볼더링/),
  R("activity", "춤·댄스", /살사|댄스|스윙/),
  R("schedule", "평일", /평일/),
  R("schedule", "주말", /주말|토요일|일요일|토·일|토일/),
  R("schedule", "저녁·퇴근 후", /저녁|퇴근|야간/),
  R("schedule", "낮·점심", /점심|오전|낮\s*시간/),
  R("schedule", "일정 조율 가능", /조율|유동|맞출\s*수|자유로/),
  // 결정사·타업체 경험: 「결정사 이용 중」「타업체 이용 경험 없음」「이용 경험 없음」(인터뷰 맥락상 결정사 얘기) 모두 잡는다
  R("experience", "결정사 이용 중·경험 있음", /(결정사|결혼정보|듀오|가연|노블레스|바로연|선우|타\s*업체|다른\s*업체|타사)(?![^\n]*(없|안\s*해|미이용|처음))/),
  R("experience", "결정사 경험 없음", /(결정사|결혼정보|듀오|가연|노블레스|바로연|선우|타\s*업체|다른\s*업체|타사)[^\n]*(없|안\s*해|미이용|처음)|(이용|가입)\s*경험\s*(없|전무)|경험\s*없음/),
  R("budget", "금액 무관·유연", /(금액|가격|비용|회비|예산)[^\n]*(무관|상관\s*없|괜찮|부담\s*없|융통|문제\s*없|컨텐츠|콘텐츠|퀄리티)/),
  R("budget", "금액 부담·민감", /(금액|가격|비용|회비|예산)[^\n]*(부담|비싸|고민|어렵|저렴|적은)|(부담|비싸|고민|적은|저렴한|싼)\s*(금액|가격|비용)/),
  R("budget", "할인 요청", /할인|프로모션|얼리버드/),
  R("profile", "여성", /여성|여자/),
  R("profile", "남성", /남성|남자/),
  R("profile", "전문직·사업가", /의사|변호사|회계사|교수|대표|사업가|CEO|임원|약사|한의사|창업/i),
  R("profile", "직장인", /직장인|회사원|회사\s|근무|재직/),
  R("profile", "해외·외국어", /해외|외국|영어|유학|교포/),
  R("followup", "런칭 때 연락", /런칭|오픈\s*(시|때|하면)|출시/),
  R("followup", "추후·재연락", /추후|나중|다시\s*연락|재연락|연락\s*(바람|요청|주|하시기로|드리기로)|일\s*연락/),
  R("followup", "문자·카톡 선호", /문자|카톡|카카오|메시지|디엠|dm/i),
  R("followup", "관심 없음·거절", /관심\s*없|거절|안\s*하|원치|필요\s*없/),
  R("followup", "본인이 연락", /본인이\s*연락|직접\s*연락|먼저\s*연락/),
];

/** 노트 한 덩어리 → 문장들. 줄마다 앞의 "- · •" 를 떼고, 줄바꿈이 없으면 " - " 로 나눈다 */
export function splitLines(text: string): string[] {
  const strip = (s: string) => s.replace(/^[\s\-–—•·*▪▶]+/, "").replace(/\s+/g, " ").trim();
  let parts = text.split(/\r?\n/);
  if (parts.length === 1 && /\s-\s/.test(text)) parts = text.split(/\s+-\s+/);
  return parts.map(strip).filter(Boolean);
}

/** 문장 하나에 붙는 태그들 (나이대는 규칙표 밖에서 숫자로 계산) */
export function tagLine(line: string): Tag[] {
  const out: Tag[] = [];
  for (const r of RULES) if (r.re.test(line)) out.push({ theme: r.theme, tag: r.tag });
  const age = line.match(/(\d{2})\s*(세|살)\b/) ?? line.match(/(\d{2})\s*(세|살)/);
  const born = line.match(/(\d{2})\s*년생/); // 79년생 → 만 나이 대략 → 40대
  const decade = line.match(/([2-6]0)\s*대/);
  if (age) out.push({ theme: "profile", tag: `${Math.floor(Number(age[1]) / 10) * 10}대` });
  else if (born) { const y = Number(born[1]); const full = y >= 30 ? 1900 + y : 2000 + y; const a = new Date().getFullYear() - full; if (a >= 18 && a < 80) out.push({ theme: "profile", tag: `${Math.floor(a / 10) * 10}대` }); }
  else if (decade) out.push({ theme: "profile", tag: `${decade[1]}대` });
  return out;
}

export type LeadInsight = { key: string; name: string; tab: string; status: CallStatus; memo: string; lines: string[]; tags: Tag[]; untagged: string[] };
export type ThemeReport = { theme: ThemeKey; label: string; hint: string; total: number; tags: { tag: string; count: number; samples: string[] }[] };
export type InsightReport = { interviewed: number; lineCount: number; themes: ThemeReport[]; customers: LeadInsight[]; untagged: { name: string; line: string }[] };

const sameTag = (a: Tag, b: Tag) => a.theme === b.theme && a.tag === b.tag;

/** 노트·인터뷰 내용이 있는 고객만 모아 주제별로 집계. 태그 건수는 고객 단위(한 사람이 같은 말을 두 번 해도 1) */
export function analyzeInsights(leads: CallLead[]): InsightReport {
  const customers: LeadInsight[] = [];
  const untagged: { name: string; line: string }[] = [];
  const counts = new Map<string, { tag: Tag; count: number; samples: string[] }>();
  let lineCount = 0;
  for (const l of leads) {
    const lines = [...splitLines(l.note), ...splitLines(l.memo)];
    if (lines.length === 0) continue;
    lineCount += lines.length;
    const tags: Tag[] = [];
    const un: string[] = [];
    for (const line of lines) {
      const t = tagLine(line);
      if (t.length === 0) { un.push(line); untagged.push({ name: l.name, line }); }
      for (const tag of t) {
        if (!tags.some((x) => sameTag(x, tag))) tags.push(tag);
        const k = `${tag.theme}|${tag.tag}`;
        const c = counts.get(k) ?? { tag, count: 0, samples: [] };
        if (!c.samples.includes(line) && c.samples.length < 3) c.samples.push(line);
        counts.set(k, c);
      }
    }
    for (const tag of tags) counts.get(`${tag.theme}|${tag.tag}`)!.count++;
    const where = [l.channel ? CHANNEL_KO[l.channel] : l.tab, l.channels.length > 1 ? "채널 중복" : "", l.subs.length > 1 ? `재신청 ${l.subs.length}회` : ""].filter(Boolean).join(" · ");
    customers.push({ key: l.key, name: l.name, tab: where, status: l.status, memo: l.memo, lines: splitLines(l.note), tags, untagged: un });
  }
  const themes: ThemeReport[] = THEMES.map((t) => {
    const tags = Array.from(counts.values()).filter((c) => c.tag.theme === t.key).sort((a, b) => b.count - a.count || a.tag.tag.localeCompare(b.tag.tag)).map((c) => ({ tag: c.tag.tag, count: c.count, samples: c.samples }));
    return { theme: t.key, label: t.label, hint: t.hint, total: tags.reduce((s, x) => s + x.count, 0), tags };
  });
  return { interviewed: customers.length, lineCount, themes, customers, untagged };
}
