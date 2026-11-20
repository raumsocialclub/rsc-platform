/**
 * 프로필 진단 설문 (/match-check) — 1:1 매칭 DB 수집용 「한 화면에 한 질문」 퍼널 (2026-11-16).
 * 레퍼런스(결혼정보회사 웹 퍼널 캡처)와 우리 상담 전 설문(lib/apply/schema.ts)의 문항을 조합했다. 레퍼런스와 같을 필요는 없다는 요청에 따라
 * 선택지는 상담 신청(/fit-check)·상담 전 설문과 맞췄다(직업·학력·거주지역·혼인 상태·자녀·흡연·종교·만남 가능 지역·MBTI).
 *
 * 화면(components/match/MatchForm.tsx)과 서버(app/api/match/route.ts)가 이 정의를 함께 쓴다. 문항을 더하거나 빼려면 여기만 고치면 된다.
 * 값은 전부 문자열(복수 선택은 문자열 배열). 필수는 이름·성별·생년월일·혼인 상태·거주 시/도·휴대폰 뿐이고 나머지는 「이 질문 건너뛰기」로 넘어갈 수 있다.
 * 종교·건강(신체적 특이사항)은 개인정보 보호법 제23조 민감정보 — 그 화면의 별도 동의(선택)에 체크한 경우에만 서버가 저장한다.
 * 사진(최대 3장)은 비공개 버킷 match-photos 에 먼저 올리고 경로만 답과 함께 보낸다 (lib/match/photo.ts).
 * 2026-11-18 사용자 수정: 혼인 상태 미혼·돌싱·기혼(기혼은 진행 불가), 거주지 안내 문구 삭제, 「활동 가능한 지역」 + 시/군/구, 부모님 자산·중요 요소 상세 삭제,
 * 중요 항목 14개(설명 포함, 누른 순서 = 우선순위), 사진 3장, 마지막에 「상담 시 확인 서류 안내」 화면.
 */
import { EDUCATION_OPTIONS, JOB_OPTIONS, REGION_OPTIONS } from "@/lib/inquiries/profile";
import { MBTI, REGIONS } from "@/lib/apply/schema";

export type QType = "text" | "number" | "date" | "tel" | "textarea" | "single" | "multi" | "photo" | "info";

export type Question = {
  key: string;
  type: QType;
  /** 화면 제목. "{name}" 은 이름, "{picks}" 는 priorities 선택값으로 치환 */
  title: string;
  sub?: string;
  options?: string[];
  /** single · multi 의 배치: list(한 줄씩, 기본) · grid2 · grid4 · chips */
  layout?: "list" | "grid2" | "grid4" | "chips";
  required?: boolean;
  placeholder?: string;
  unit?: string;
  max?: number;              // 글자 수 제한 (기본 200, textarea 1000)
  /** multi: 정확히 n 개 골라야 함 */
  exact?: number;
  /** 민감정보 — 별도 동의에 체크해야 답을 보낼 수 있다 */
  sensitive?: boolean;
  /** single: 고르면 다음으로 넘어갈 수 없는 값(예: 혼인 상태 「기혼」). sub 가 빨갛게 바뀌며 안내한다 */
  blocked?: string[];
  /** 선택지 아래 작은 설명 (layout "list") */
  optionDesc?: Record<string, string>;
  /** info: 안내 본문과 표 (답을 받지 않는 안내 화면) */
  body?: string;
  table?: { head: [string, string]; rows: [string, string][] };
  /** 어드민 상세에 보일 짧은 이름 */
  label: string;
  /** 선택지 아래 덧붙는 짧은 입력칸 (예: 「알게 된 경로」 아래 초대코드). 답은 answers[extra.key] 에 따로 저장되고 어드민 상세에 label 로 보인다 (2026-11-20) */
  extra?: { key: string; label: string; title: string; placeholder?: string; max?: number; normalize?: (s: string) => string };
};

/** 초대코드 입력 정리: 대문자, 공백 제거, 영문·숫자·하이픈만 */
export const normalizeInviteCode = (s: string) => s.toUpperCase().replace(/\s+/g, "").replace(/[^A-Z0-9-]/g, "");
export const INVITE_CODE_EXTRA: NonNullable<Question["extra"]> = { key: "inviteCode", label: "초대코드", title: "초대코드가 있다면 입력해주세요.", placeholder: "예) RSC-AB12-CD34", max: 20, normalize: normalizeInviteCode };

export const EMPLOYMENT_OPTIONS = ["정규직", "계약직", "개인사업자 (대표)", "법인사업자 (대표)", "프리랜서", "가업승계", "위촉직", "기타"];
export const ASSET_OPTIONS = ["5천만원 미만", "5천만원 ~ 1억", "1억 ~ 3억", "3억 ~ 5억", "5억 ~ 10억", "10억 ~ 30억", "30억 이상", "답하고 싶지 않음"];
export const LOOK_OPTIONS = ["매우 매력적", "매력적", "약간 매력적", "호감형", "평범함", "약간 평균 이하"];
/** 싱글 멤버와의 만남에서 중요하게 생각하는 항목 (2026-11-18 사용자 확정 14개, 버튼 문구 → 설명) */
export const PRIORITY_DESC: Record<string, string> = {
  "첫인상과 스타일": "외모, 표정, 옷차림 등 처음 만났을 때 느끼는 인상",
  "키": "상대의 키가 내가 선호하는 범위에 있는지",
  "나이": "편하게 느끼는 연령대나 나이 차이",
  "대화 방식": "대화가 자연스럽게 이어지고 서로의 이야기를 잘 들어주는지",
  "성격과 태도": "약속을 지키는 모습, 배려, 의견이 다를 때의 태도",
  "취향과 관심사": "전시, 미식, 운동처럼 함께 즐기고 싶은 취향이 있는지",
  "생활 리듬": "퇴근 후나 주말을 보내는 방식이 서로 잘 맞는지",
  "생활권과 거리": "서로 오가기 편하고 꾸준히 만날 수 있는 거리인지",
  "직업과 일하는 방식": "상대의 직업이나 일에 대한 태도, 일과 생활의 균형",
  "학력": "상대의 학력이나 교육 배경이 만남을 고려할 때 중요한지",
  "경제적 여건": "상대의 소득, 자산, 주거 여건을 어느 정도 중요하게 보는지",
  "소비와 저축 습관": "평소 돈을 쓰고 모으는 방식에 공감할 수 있는지",
  "종교와 신앙": "종교가 같은지, 서로의 신앙과 생활 방식을 존중할 수 있는지",
  "관계에 대한 생각": "진지한 교제, 결혼 의향, 관계를 이어가는 속도에 대한 생각이 비슷한지",
};
export const PRIORITY_OPTIONS = Object.keys(PRIORITY_DESC);
/** 상담 시 확인 서류 안내 (마지막 안내 화면, 2026-11-18) */
export const DOCS_TABLE: { head: [string, string]; rows: [string, string][] } = { head: ["확인 항목", "요청 서류"], rows: [["싱글 여부 확인", "혼인관계증명서"], ["재직 여부 확인", "재직증명서"], ["소득 확인", "소득금액증명원"]] };
export const MATCH_PHOTO_COUNT = 3;
export const SOURCE_OPTIONS = ["인스타그램", "유튜브", "지인 소개", "검색", "광고", "라움아트센터 · 하우스오브더라움", "기타"];
export const MARITAL_OPTIONS = ["미혼", "돌싱", "기혼"];
export const MARITAL_HINT = "라움소셜클럽은 현재 배우자가 없는 싱글을 위한 서비스입니다. 기혼 또는 사실혼 관계에 있는 분은 가입이 제한됩니다.";

export const QUESTIONS: Question[] = [
  { key: "name", type: "text", title: "이름을 알려주세요.", sub: "상담에서 부를 이름이에요.", placeholder: "예) 김라움", required: true, max: 50, label: "이름" },
  { key: "gender", type: "single", title: "성별을 알려주세요.", options: ["남성", "여성"], layout: "grid2", required: true, label: "성별" },
  { key: "birth", type: "date", title: "생일이 언제예요?", sub: "매칭 조건 확인에 사용돼요.", placeholder: "1989.01.01", required: true, label: "생년월일" },
  { key: "marital", type: "single", title: "현재 혼인 상태를 알려주세요.", sub: `* ${MARITAL_HINT}`, options: MARITAL_OPTIONS, required: true, blocked: ["기혼"], label: "혼인 상태" },
  { key: "children", type: "single", title: "자녀가 있으신가요?", options: ["없음", "있음"], layout: "grid2", label: "자녀 유무" },
  { key: "homeSido", type: "single", title: "지금 어디에 살고 계세요?", options: [...REGION_OPTIONS], layout: "grid2", required: true, label: "거주지역 · 시/도" },
  { key: "homeGugun", type: "text", title: "시/군/구까지 알려주시면 더 좋아요.", sub: "예) 강남구, 분당구", placeholder: "예) 강남구", max: 30, label: "거주지역 · 시/군/구" },
  { key: "idealRegions", type: "multi", title: "활동 가능한 지역을 선택해주세요.", sub: "여러 개 선택할 수 있어요.", options: REGIONS, layout: "chips", label: "활동 가능 지역" },
  { key: "idealGugun", type: "text", title: "시/군/구까지 알려주시면 더 좋아요.", sub: "주로 활동하는 곳을 적어주세요. 예) 강남구, 분당구", placeholder: "예) 강남구, 분당구", max: 60, label: "활동 가능 지역 · 시/군/구" },
  { key: "height", type: "number", title: "키가 어떻게 되세요?", sub: "숫자만 입력해주세요.", placeholder: "예) 165", unit: "cm", label: "키" },
  { key: "weight", type: "number", title: "몸무게가 어떻게 되세요?", sub: "숫자만 입력해주세요.", placeholder: "예) 60", unit: "kg", label: "체중" },
  { key: "education", type: "single", title: "최종 학력을 알려주세요.", options: [...EDUCATION_OPTIONS], label: "학력" },
  { key: "univName", type: "text", title: "대학교는 어딘가요?", sub: "예) 서울대학교", placeholder: "예) 서울대학교", max: 60, label: "대학명" },
  { key: "jobCategory", type: "single", title: "직업 분야를 선택해주세요.", options: [...JOB_OPTIONS], layout: "grid2", label: "직업" },
  { key: "jobDetail", type: "text", title: "직업이 어떻게 되시나요?", sub: "예) 간호사, 변호사, 마케터", placeholder: "예) 간호사", max: 60, label: "직업 상세" },
  { key: "employment", type: "single", title: "고용형태가 어떻게 되세요?", options: EMPLOYMENT_OPTIONS, label: "고용형태" },
  { key: "income", type: "number", title: "연 소득을 숫자로 적어주세요.", sub: "예) 5000 (단위 만원, 세전)", placeholder: "예) 5000", unit: "만원", label: "연 소득(만원)" },
  { key: "assets", type: "single", title: "본인이 보유한 총 자산 규모를 선택해주세요.", sub: "부채를 제외한 유동자산(현금·예금·주식) + 부동산·차량 등", options: ASSET_OPTIONS, label: "본인 자산" },
  { key: "look", type: "single", title: "본인이 생각하는 본인의 외모 점수를 알려주세요.", options: LOOK_OPTIONS, label: "외모 자기평가" },
  { key: "mbti", type: "single", title: "MBTI를 아신다면 알려주세요.", options: MBTI, layout: "grid4", label: "MBTI" },
  { key: "smoking", type: "single", title: "흡연을 하시나요?", options: ["비흡연", "흡연", "금연 중"], label: "흡연" },
  { key: "drinking", type: "single", title: "술은 어느 정도 드세요?", options: ["안 마셔요", "어쩔 수 없을 때만 마셔요", "가끔 마셔요", "어느 정도 즐겨요", "즐기는 편이에요"], label: "주량" },
  { key: "religion", type: "single", title: "종교가 있으신가요?", sub: "종교는 민감정보예요. 아래 별도 동의에 체크한 경우에만 저장돼요.", options: ["무교", "기독교", "천주교", "불교", "기타"], sensitive: true, label: "종교" },
  { key: "health", type: "textarea", title: "신체적 특이사항이 있으시면 알려주세요.", sub: "질병이나 장애 여부 등 · 건강 정보는 민감정보라 아래 별도 동의에 체크한 경우에만 저장돼요.", placeholder: "없으시면 건너뛰어도 돼요.", max: 500, sensitive: true, label: "신체적 특이사항" },
  { key: "priorities", type: "multi", title: "싱글 멤버와의 만남에서 중요하게 생각하는 항목 3가지를 선택해주세요.", sub: "우선순위를 선택해주세요. (정확히 3개 · 누른 순서가 우선순위예요)", options: PRIORITY_OPTIONS, optionDesc: PRIORITY_DESC, layout: "list", exact: 3, label: "중요하게 생각하는 항목 3가지" },
  { key: "source", type: "single", title: "라움소셜클럽을 알게 된 경로는?", options: SOURCE_OPTIONS, label: "알게 된 경로", extra: INVITE_CODE_EXTRA },
  { key: "photo", type: "photo", title: "{name} 님의 사진을 올려주세요.", sub: "얼굴이 잘 나온 사진 3장을 올려주세요. (마스크 X, 측면 X). 상담 시 추가 사진을 별도로 요청드릴 수 있습니다.", max: MATCH_PHOTO_COUNT, label: "사진" },
  { key: "docs", type: "info", title: "상담 시 확인 서류 안내", body: "라움소셜클럽은 멤버들이 서로를 신뢰하며 만날 수 있도록, 상담 과정에서 필요한 정보를 확인합니다. 확인이 필요한 항목에 따라 아래 서류의 제출을 요청드릴 수 있습니다.\n제출이 필요한 경우, 해당 서류와 제출 방법을 상담 시 개별적으로 안내드립니다.", table: DOCS_TABLE, label: "확인 서류 안내" },
  { key: "phone", type: "tel", title: "마지막으로, 연락받을 휴대폰 번호를 알려주세요.", sub: "담당 매니저가 이 번호로 연락드려요. 입력한 내용은 지금까지 전송되지 않았고, 아래 동의 후 제출할 때 한 번에 보내져요.", placeholder: "010-0000-0000", required: true, label: "휴대폰 번호" },
];

export const QUESTION_BY_KEY: Record<string, Question> = Object.fromEntries(QUESTIONS.map((q) => [q.key, q]));
export const REQUIRED_KEYS = QUESTIONS.filter((q) => q.required).map((q) => q.key);
export const SENSITIVE_KEYS = QUESTIONS.filter((q) => q.sensitive).map((q) => q.key);
/** 이름·휴대폰·사진은 별도 컬럼/필드라 평탄화에서 뺀다 */
const SEPARATE = new Set(["name", "phone", "photo", "docs"]);

export type MatchAnswers = Record<string, string | string[]>;

/** "1989.01.01" / "19890101" / "1989-01-01" → "1989-01-01". 잘못된 날짜면 null */
export function parseBirth(raw: string): string | null {
  const d = raw.replace(/\D/g, "");
  if (d.length !== 8) return null;
  const y = Number(d.slice(0, 4)), m = Number(d.slice(4, 6)), day = Number(d.slice(6, 8));
  const dt = new Date(Date.UTC(y, m - 1, day));
  if (dt.getUTCFullYear() !== y || dt.getUTCMonth() !== m - 1 || dt.getUTCDate() !== day) return null;
  if (y < 1940 || dt.getTime() > Date.now()) return null;
  return `${d.slice(0, 4)}-${d.slice(4, 6)}-${d.slice(6, 8)}`;
}
/** 만 나이. 생일이 아직 안 지났으면 한 살 뺀다 */
export function ageOf(birth: string, now = new Date()): number | null {
  const iso = parseBirth(birth);
  if (!iso) return null;
  const [y, m, d] = iso.split("-").map(Number);
  let age = now.getFullYear() - y;
  if (now.getMonth() + 1 < m || (now.getMonth() + 1 === m && now.getDate() < d)) age -= 1;
  return age >= 0 && age < 120 ? age : null;
}
/** 입력 중 자동 서식: 숫자만 받아 YYYY.MM.DD */
export function formatBirthInput(raw: string): string {
  const d = raw.replace(/\D/g, "").slice(0, 8);
  if (d.length <= 4) return d;
  if (d.length <= 6) return `${d.slice(0, 4)}.${d.slice(4)}`;
  return `${d.slice(0, 4)}.${d.slice(4, 6)}.${d.slice(6)}`;
}

/** 제목의 {name} 치환 */
export function questionTitle(q: Question, answers: MatchAnswers): string {
  const name = String(answers.name ?? "").trim();
  return q.title.replace("{name}", name || "회원");
}
/** 고르면 진행이 막히는 값인지 (혼인 상태 「기혼」) */
export const isBlockedAnswer = (q: Question, v: unknown): boolean => typeof v === "string" && !!q.blocked?.includes(v);

/** 한 문항의 표시용 답. 비어 있으면 "" */
export function displayMatchAnswer(q: Question, answers: MatchAnswers): string {
  const v = answers[q.key];
  if (Array.isArray(v)) return v.join(", ");
  const s = String(v ?? "").trim();
  if (!s) return "";
  if (q.type === "date") { const age = ageOf(s); return age == null ? s : `${s} (만 ${age}세)`; }
  if (q.type === "number" && q.unit) return `${Number(s).toLocaleString("ko-KR")}${q.unit}`;
  return s;
}

/** 어드민 「상담 신청」 상세가 그대로 읽는 모양 ({label, question, answer}[]) — 답이 있는 문항만, 순서대로 */
export function flattenMatchAnswers(answers: MatchAnswers): { key: string; label: string; question: string; answer: string }[] {
  const out: { key: string; label: string; question: string; answer: string }[] = [];
  for (const q of QUESTIONS) {
    if (SEPARATE.has(q.key)) continue;
    const answer = displayMatchAnswer(q, answers);
    if (answer) out.push({ key: q.key, label: q.label, question: q.title, answer });
    const ex = q.extra ? String(answers[q.extra.key] ?? "").trim() : "";
    if (q.extra && ex) out.push({ key: q.extra.key, label: q.extra.label, question: q.extra.title, answer: ex });
  }
  return out;
}

/** 서버 검증: 모르는 키 제거, 길이 제한, 선택지 밖의 값 제거, 날짜·숫자 형식. 반환값만 저장한다 */
export function sanitizeMatchAnswers(input: unknown): MatchAnswers {
  const out: MatchAnswers = {};
  if (!input || typeof input !== "object") return out;
  const src = input as Record<string, unknown>;
  for (const q of QUESTIONS) {
    if (q.type === "photo" || q.type === "info") continue; // 사진은 answers 가 아니라 photos 경로로 따로 받고, 안내 화면은 답이 없다
    if (q.extra && typeof src[q.extra.key] === "string") {
      const ex = (q.extra.normalize ?? ((x: string) => x.trim()))(src[q.extra.key] as string).slice(0, q.extra.max ?? 40);
      if (ex) out[q.extra.key] = ex;
    }
    const raw = src[q.key];
    const max = q.max ?? (q.type === "textarea" ? 1000 : 200);
    if (q.type === "multi") {
      if (Array.isArray(raw)) {
        const allowed = new Set(q.options ?? []);
        const list = raw.filter((x): x is string => typeof x === "string" && allowed.has(x)).slice(0, 20);
        if (q.exact && list.length !== q.exact) continue;
        if (list.length) out[q.key] = list;
      }
      continue;
    }
    if (typeof raw !== "string") continue;
    let s = raw.trim().slice(0, max);
    if (q.type === "single" && !(q.options ?? []).includes(s)) s = "";
    if (q.type === "number" && s && !/^\d{1,9}(\.\d{1,2})?$/.test(s)) s = "";
    if (q.type === "date" && s) s = parseBirth(s) ?? "";
    if (s) out[q.key] = s;
  }
  return out;
}

/** 필수 문항 중 비어 있는 첫 문항 */
export function missingMatchRequired(answers: MatchAnswers): Question | null {
  for (const key of REQUIRED_KEYS) {
    const v = answers[key];
    if (Array.isArray(v) ? v.length === 0 : !String(v ?? "").trim()) return QUESTION_BY_KEY[key];
    if (isBlockedAnswer(QUESTION_BY_KEY[key], v)) return QUESTION_BY_KEY[key];
  }
  return null;
}
