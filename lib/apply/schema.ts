/**
 * 상담 전 고객 정보 설문 (/apply) — 레퍼런스(결혼정보회사 웹 설문, 2026-10-06 녹화)의 문항을 그대로 옮긴 1차 초안.
 * docs/pre-consult-survey-draft.md 1절 표와 1:1 로 대응한다. 라움용 축약은 하지 않았다(요청).
 *
 * 화면(components/apply/ApplyForm.tsx)과 서버 검증(app/api/apply/route.ts)이 이 정의를 함께 쓴다.
 * 문항을 더하거나 빼려면 여기만 고치면 된다. 값은 전부 문자열(복수 선택은 문자열 배열)로 저장한다.
 */
export type FieldType = "text" | "number" | "email" | "tel" | "date" | "textarea" | "select" | "radio" | "checks" | "siblings";

export type Field = {
  key: string;
  label: string;
  type: FieldType;
  options?: string[];      // select · radio · checks
  other?: boolean;         // 「기타」 직접 입력 칸을 붙인다 (radio · checks · select)
  required?: boolean;
  placeholder?: string;
  hint?: string;           // 칸 아래 안내 (레퍼런스의 빨간 안내 포함)
  unit?: string;           // 숫자 칸 뒤 단위 (원 · cm · kg)
  max?: number;            // 글자 수 제한 (기본 200, textarea 2000)
  indent?: boolean;        // 상위 칸의 하위 입력(시/도 → 시/군/구 → 상세)
};

export type Step = { key: string; title: string; note?: string; fields: Field[] };

export const SIDO = ["서울특별시", "경기도", "인천광역시", "부산광역시", "대구광역시", "광주광역시", "대전광역시", "울산광역시", "세종특별자치시", "강원도", "충청북도", "충청남도", "전라북도", "전라남도", "경상북도", "경상남도", "제주특별자치도", "해외"];

const region = (prefix: string, label: string): Field[] => [
  { key: `${prefix}Sido`, label: `${label} · 시/도`, type: "select", options: SIDO },
  { key: `${prefix}Gugun`, label: `${label} · 시/군/구`, type: "text", placeholder: "예: 송파구", indent: true },
  { key: `${prefix}Detail`, label: `${label} · 상세입력`, type: "text", placeholder: `${label}을(를) 입력해 주세요`, indent: true },
];

const HEIGHT_HINT = "* 솔직한 키 작성을 부탁드립니다.";

export const JOB_CATEGORIES = ["대기업", "중견기업", "중소기업", "스타트업", "공기업", "공공기관", "외국계기업", "미용", "미디어", "예술", "레저/스포츠", "외식/식음료", "공인중개사", "문과전문직", "이과전문직", "간호사", "의료직", "유치원교사", "초등학교교사", "중,고등학교교사", "학원강사", "교육직", "공무원", "경찰", "소방관", "직업군인", "사업가", "자영업", "금융직", "프리랜서"];
export const EMPLOYMENT = ["정규직", "계약직", "프리랜서", "가업승계", "개인사업자", "법인사업자"];
export const IDEAL_JOBS = ["상관없음", "금융권", "사업", "공무원/공공기관(공무원 및 공공기관 직원)", "대기업", "중견기업", "중소기업", "자영업", "안전 관련 직종(경찰, 소방 및 안전관련 직종)", "교육 및 교직원(교사, 교수, 학교 직원 등)", "예술 및 창작 관련(예술가 및 디자이너 등)", "스포츠 및 게임(스포츠 선수, 프로게이머 등)", "전문직(변호사, 판사, 검사, 법무사, 의사 등)", "의료관련직(간호사, 간호조무사, 물리치료사 등)"];
export const IDEAL_EMPLOYMENT = ["상관없음", "프리랜서", "법인사업자", "개인사업자", "가업승계", "정규직", "위촉직", "계약직"];
export const INCOME = ["상관없음", "4천만원 미만", "4천만원 이상 6천만원 미만", "6천만원 이상 8천만원 미만", "8천만원 이상 1억원 미만", "1억원 이상 3억원 미만", "3억원 이상"];
export const ASSETS = ["상관없음", "0~5천만원", "5천~1억", "1억~3억", "3억~5억", "5억~10억", "10억~30억", "30억 이상"];
export const PARENT_ASSETS = ["상관없음", "1~5억 사이", "5~10억 사이", "10~30억 사이", "30~50억 사이", "50~100억 사이", "100억 이상"];
export const REGIONS = ["전국", "서울", "인천", "경기 남부", "경기 북부", "부산/경남", "대구/경북", "전라도", "세종/대전/충청", "강원", "제주"];
export const PRIORITIES = ["얼굴", "피지컬", "나이", "학력", "자산 및 집안", "직업 및 소득", "매력(성격)", "종교", "거리"];
export const MBTI = ["ISTJ", "ISFJ", "INFJ", "INTJ", "ISTP", "ISFP", "INFP", "INTP", "ESTP", "ESFP", "ENFP", "ENTP", "ESTJ", "ESFJ", "ENFJ", "ENTJ", "모름"];

const q = (key: string, question: string, a: string, b: string): Field => ({ key, label: question, type: "radio", options: [a, b] });

export const STEPS: Step[] = [
  {
    key: "basic", title: "기본 정보",
    fields: [
      { key: "name", label: "이름", type: "text", required: true, placeholder: "이름을 입력해 주세요", max: 50 },
      { key: "gender", label: "성별", type: "radio", options: ["남성", "여성"], required: true },
      { key: "birth", label: "생년월일", type: "date", required: true },
      { key: "phone", label: "휴대폰 번호", type: "tel", required: true, placeholder: "010-0000-0000" },
      { key: "email", label: "이메일 주소", type: "email", placeholder: "이메일 주소를 입력해 주세요", max: 120 },
      { key: "refCode", label: "추천인 코드", type: "text", placeholder: "추천인 코드를 입력해 주세요", max: 40 },
      { key: "joinRoute", label: "가입 경로", type: "select", options: ["인터넷 검색", "지인 추천", "유튜브", "SNS 광고", "인스타그램", "기타"], other: true },
      { key: "mbti", label: "MBTI", type: "select", options: MBTI },
      { key: "height", label: "키", type: "number", unit: "cm", placeholder: "키를 입력해 주세요", hint: HEIGHT_HINT },
      { key: "weight", label: "체중", type: "number", unit: "kg", placeholder: "체중을 입력해 주세요" },
      { key: "marital", label: "결혼여부", type: "radio", options: ["미혼", "사실혼", "무출산 재혼", "출산 재혼"] },
      ...region("home", "거주지역"),
      ...region("origin", "본가"),
      { key: "drinking", label: "주량", type: "radio", options: ["안마셔요", "어쩔 수 없을 때만 마셔요", "가끔마셔요", "어느정도 즐겨요", "즐기는 편이에요"] },
    ],
  },
  {
    key: "education", title: "학력",
    fields: [
      { key: "education", label: "최종학력", type: "radio", options: ["고졸", "전문대 재학", "전문대 수료", "전문대 졸업", "대학 재학", "대학 중퇴", "대학 수료", "대학 졸업", "대학원 재학", "대학원졸업", "박사 과정", "박사 취득"] },
      { key: "univName", label: "대학명(학사)", type: "text", placeholder: "대학명(학사)을 입력해 주세요", hint: "* 캠퍼스의 경우 (캠퍼스)라고 작성해주세요." },
      { key: "univYear", label: "졸업년도(학사)", type: "number", placeholder: "예: 2015" },
      { key: "univMajor", label: "전공(학사)", type: "text", placeholder: "전공(학사)을 입력해 주세요" },
      { key: "gradName", label: "대학원명(석,박사)", type: "text", placeholder: "대학원명(석,박사)을 입력해 주세요" },
      { key: "gradYear", label: "졸업년도(석,박사)", type: "number", placeholder: "예: 2019" },
      { key: "gradMajor", label: "전공(석,박사)", type: "text", placeholder: "전공(석,박사)을 입력해 주세요" },
    ],
  },
  {
    key: "job", title: "직업",
    fields: [
      { key: "job", label: "직업", type: "text", placeholder: "직업을 입력해 주세요" },
      { key: "jobCategory", label: "직업 분류", type: "radio", options: JOB_CATEGORIES, other: true },
      { key: "jobOther", label: "기타직업", type: "text", placeholder: "기타직업을 입력해 주세요" },
      { key: "employment", label: "고용형태", type: "radio", options: EMPLOYMENT, other: true },
      { key: "workType", label: "근무형태", type: "radio", options: ["일반근무", "교대근무", "재택근무", "자율근무", "파트타임"] },
      { key: "salary", label: "연봉(세전)", type: "number", unit: "원", placeholder: "연봉(세전)을 입력해 주세요" },
      { key: "company", label: "직장명", type: "text", placeholder: "직장명을 입력해 주세요" },
      { key: "position", label: "직급", type: "text", placeholder: "직급을 입력해 주세요" },
      ...region("company", "회사소재지"),
    ],
  },
  {
    key: "assets", title: "자산정보",
    fields: [
      { key: "liquidAssets", label: "유동자산", type: "number", unit: "원", placeholder: "유동자산을 입력해 주세요" },
      { key: "fixedAssets", label: "비유동자산(부동산 포함)", type: "number", unit: "원", placeholder: "비유동자산(부동산 포함)을 입력해 주세요" },
      { key: "ownsRealEstate", label: "비유동자산(부동산 포함) 소유여부", type: "radio", options: ["없음", "있음"] },
      { key: "marriageSupport", label: "혼인 시 경제적 지원", type: "radio", options: ["없음", "있음"] },
      { key: "marriageSupportAmount", label: "혼인 시 경제적 지원 금액", type: "number", unit: "원", placeholder: "금액을 입력해 주세요", indent: true },
      { key: "car", label: "차량 유무", type: "radio", options: ["없음", "자차", "개인렌트/리스", "법인렌트/리스"] },
      { key: "carMaker", label: "차량 제조사", type: "text", placeholder: "차량 제조사를 입력해 주세요" },
      { key: "carModel", label: "차량 모델명", type: "text", placeholder: "차량 모델명을 입력해 주세요" },
    ],
  },
  {
    key: "family", title: "가족관계",
    fields: [
      { key: "familyType", label: "가족형태", type: "radio", options: ["일반가정", "재혼가정", "다문화가정", "장애인가정", "이혼가정"] },
      { key: "siblings", label: "형제관계", type: "siblings" },
      { key: "fatherJob", label: "아버지 직업", type: "text", placeholder: "아버지 직업을 입력해 주세요" },
      { key: "motherJob", label: "어머니 직업", type: "text", placeholder: "어머니 직업을 입력해 주세요" },
      { key: "parentsAssetKnown", label: "부모님 자산", type: "radio", options: ["알고있음", "모름"] },
      { key: "parentsAsset", label: "부모님 자산 금액", type: "number", unit: "원", placeholder: "부모님 자산을 입력해 주세요", indent: true },
      { key: "liveWithParents", label: "부모님과의 동거 여부", type: "radio", options: ["동거중", "동거안함"] },
      { key: "parentsCohabit", label: "부모님의 동거 여부", type: "radio", options: ["동거중", "동거안함"] },
      { key: "retirementReady", label: "노후 준비 여부", type: "radio", options: ["가능", "불가"], hint: "기준 : 결혼 후 부모님의 생활비를 정기적으로 드려야 한다면 노후 준비 여부 '불가'로 판단" },
      { key: "parentsDivorced", label: "부모님 이혼여부", type: "radio", options: ["해당함", "해당없음"] },
      { key: "parentsDeceased", label: "부모님 작고여부", type: "radio", options: ["양친생존", "편부모", "양친작고"] },
    ],
  },
  {
    key: "ideal", title: "이상형 우선 순위",
    fields: [
      { key: "minAge", label: "최소 나이(연나이 기준)", type: "number", placeholder: "최소 나이(연나이 기준)를 입력해 주세요" },
      { key: "maxAge", label: "최대 나이(연나이 기준)", type: "number", placeholder: "최대 나이(연나이 기준)를 입력해 주세요" },
      { key: "look", label: "외모", type: "radio", options: ["상관없음", "평범함", "호감형", "약간 매력적", "매력적", "매우 매력적"], other: true },
      { key: "minHeight", label: "최소 키", type: "number", unit: "cm", placeholder: "최소 키를 입력해 주세요" },
      { key: "maxHeight", label: "최대 키", type: "number", unit: "cm", placeholder: "최대 키를 입력해 주세요" },
      { key: "minEducation", label: "최소 학력", type: "radio", options: ["상관없음", "스카이", "인서울4년제", "지방국공립", "해외대학", "전문대"], other: true },
      { key: "idealJobs", label: "직업분류", type: "checks", options: IDEAL_JOBS, other: true },
      { key: "idealEmployment", label: "고용형태", type: "checks", options: IDEAL_EMPLOYMENT },
      { key: "idealIncome", label: "소득", type: "radio", options: INCOME },
      { key: "idealAssets", label: "본인자산", type: "radio", options: ASSETS },
      { key: "idealRealEstate", label: "부동산 자산유무", type: "radio", options: ["상관없음", "있음"], other: true },
      { key: "idealParentsAssets", label: "부모님 자산", type: "radio", options: PARENT_ASSETS },
      { key: "idealReligion", label: "종교", type: "radio", options: ["무교", "천주교", "불교", "기독교", "상관없음"], other: true },
      { key: "idealRegions", label: "만남 가능 지역", type: "checks", options: REGIONS },
      { key: "idealParents", label: "부모님 정보", type: "radio", options: ["상관없음", "일반가정", "이혼함", "재혼함", "편부모", "양친작고"] },
      { key: "idealCar", label: "차량유무", type: "radio", options: ["상관없음", "차량없음", "차량있음"], other: true },
      { key: "priority1", label: "우선순위 1순위", type: "select", options: PRIORITIES },
      { key: "priority2", label: "우선순위 2순위", type: "select", options: PRIORITIES },
      { key: "priority3", label: "우선순위 3순위", type: "select", options: PRIORITIES },
    ],
  },
  {
    key: "avoid", title: "이상형 기피사항",
    fields: [
      { key: "avoidJobs", label: "직업분류", type: "text", placeholder: "직업분류를 입력해 주세요" },
      { key: "avoidInterests", label: "관심사", type: "text", placeholder: "관심사를 입력해 주세요" },
      { key: "avoidEtc", label: "추가 기피사항", type: "textarea", placeholder: "추가 기피사항을 입력해 주세요." },
    ],
  },
  {
    key: "tendency", title: "연애성향 질문",
    note: "※ 본 설문은 회원 간 연애/결혼 성향 일치도를 참고하기 위한 부가항목으로, 필수 제출사항은 아닙니다. 실제 매칭은 성향 외에도 외모, 직업, 나이 등 다양한 조건과 상담 결과를 함께 고려하여 진행됩니다.",
    fields: [
      q("t1", "Q1. 연인(배우자)이 이성친구(여사친/남사친)와 지속적으로 연락하거나 만나는 것에 대해 어떻게 생각하나요?", "어느정도 허용 가능하다", "허용할 수 없다"),
      q("t2", "Q2. 나는 연인(배우자)과 자주 연락을 주고받아야 안정감을 느낀다.", "자주 연락 해야 한다", "상황에 따라 자주 못해도 괜찮다"),
      q("t3", "Q3. 연애를 해도 나만의 시간과 공간은 꼭 필요하다.", "꼭 필요하다", "없어도 괜찮다"),
      q("t4", "Q4. 연인(배우자)과의 관계에서 지출·소비 기준이 명확하고, 통장 관리 등에 대해 공유하고 싶다.", "명확히 나누고 투명하게 공유 하는 게 좋다", "각자 관리 하는 것이 편하다"),
      q("t5", "Q5. 연인(배우자)과의 갈등은 어떤식으로 해결하는 편인가요?", "바로 대화를 통해 푼다", "잠시 생각한 후 풀고 싶다"),
      q("t6", "Q6. 연인(배우자)과의 기념일이나 특별한 날은 기억하고 챙기는 것이 중요하다고 생각한다.", "기념일을 잘 챙기는 편이다", "굳이 챙기지 않아도 된다"),
      q("t7", "Q7. 연인(배우자)과 함께 취미를 즐기고 여가 시간을 공유하는 것이 관계에 있어 중요하다고 생각한다.", "함께하는 취미가 꼭 필요하다", "각자 다른 취미를 존중하는 편이다"),
      q("t8", "Q8. 평소 먹는 것에 대해서 어떻게 생각하나요?", "맛있는걸 찾아 먹고, 큰 즐거움 중 하나다", "큰 의미를 두지 않고, 뭘 먹어도 잘 먹는다"),
      q("t9", "Q9. 결혼 후에도 서로의 커리어/자기계발은 중요하다고 생각한다.", "서로의 성장을 응원해야 한다", "결혼 후에는 가족 중심의 삶이 더 중요하다"),
      q("t10", "Q10. 결혼후에 부모님을 뵙는 주기에 대해 어떻게 생각하나요?", "1년에 명절, 큰 행사(생일, 모임 등) 참여", "자주 찾아 뵙고 연락 드리는 게 좋다"),
      q("t11", "Q11. 나는 '맞춰 가기보단, 잘 맞는 사람'을 찾는 편이다.", "잘 맞는 사람을 찾는 게 중요하다", "적당히 맞추며 조율할 수 있다"),
      q("t12", "Q12. 친구/지인 모임 참석에 대해 어떻게 생각하나요?", "각자 참여 하는 게 좋다", "함께하는 것이 좋다"),
      q("t13", "Q13. 결혼 후 자녀 수에 대해 어떻게 생각하나요?", "한 명이어도 충분하다", "2명 이상이면 좋을 것 같다"),
    ],
  },
];

export const ALL_FIELDS: Field[] = STEPS.flatMap((s) => s.fields);
export const FIELD_BY_KEY: Record<string, Field> = Object.fromEntries(ALL_FIELDS.map((f) => [f.key, f]));

/** 응답 값: 복수 선택은 문자열 배열, 나머지는 문자열. 「기타」 직접 입력은 `${key}Other` 키에 따로 */
export type Answers = Record<string, string | string[]>;

const OTHER = "기타";
export const otherKey = (key: string) => `${key}Other`;

/** 한 칸의 표시용 답 (기타 입력·형제관계·단위 포함). 비어 있으면 "" */
export function displayAnswer(f: Field, answers: Answers): string {
  const v = answers[f.key];
  if (f.type === "siblings") {
    const s = String(v ?? "").trim();
    return s;
  }
  const other = String(answers[otherKey(f.key)] ?? "").trim();
  if (Array.isArray(v)) {
    const list = v.map((x) => (x === OTHER && other ? `기타(${other})` : x));
    return list.join(", ");
  }
  const s = String(v ?? "").trim();
  if (!s) return "";
  if (s === OTHER && other) return `기타(${other})`;
  return f.unit && f.type === "number" ? `${Number(s).toLocaleString("ko-KR")}${f.unit}` : s;
}

/** 어드민 「상담 신청」 상세가 그대로 읽는 모양 ({label, question, answer}[]) — 답이 있는 칸만, 단계 순서대로 */
export function flattenAnswers(answers: Answers): { key: string; label: string; question: string; answer: string }[] {
  const out: { key: string; label: string; question: string; answer: string }[] = [];
  for (const s of STEPS) {
    for (const f of s.fields) {
      if (f.key === "name" || f.key === "phone" || f.key === "email") continue; // 별도 컬럼에 저장
      const answer = displayAnswer(f, answers);
      if (!answer) continue;
      out.push({ key: f.key, label: `${s.title} · ${f.label}`, question: f.label, answer });
    }
  }
  return out;
}

/** 단계 안에서 필수 칸이 비었는지. 비어 있으면 첫 칸의 key */
export function missingRequired(step: Step, answers: Answers): Field | null {
  for (const f of step.fields) {
    if (!f.required) continue;
    const v = answers[f.key];
    if (Array.isArray(v) ? v.length === 0 : !String(v ?? "").trim()) return f;
  }
  return null;
}

/** 서버 검증: 모르는 키 제거, 길이 제한, 선택지 밖의 값 제거. 반환값만 저장한다 */
export function sanitizeAnswers(input: unknown): Answers {
  const out: Answers = {};
  if (!input || typeof input !== "object") return out;
  const src = input as Record<string, unknown>;
  for (const f of ALL_FIELDS) {
    const raw = src[f.key];
    const max = f.max ?? (f.type === "textarea" ? 2000 : 200);
    if (f.type === "checks") {
      if (Array.isArray(raw)) {
        const allowed = new Set([...(f.options ?? []), ...(f.other ? [OTHER] : [])]);
        out[f.key] = raw.filter((x): x is string => typeof x === "string" && allowed.has(x)).slice(0, 50);
      }
    } else if (typeof raw === "string") {
      let s = raw.trim().slice(0, max);
      if ((f.type === "radio" || f.type === "select") && f.options) {
        const allowed = new Set([...f.options, ...(f.other ? [OTHER] : [])]);
        if (!allowed.has(s)) s = "";
      }
      if (f.type === "number" && s && !/^\d{1,15}(\.\d{1,2})?$/.test(s)) s = "";
      if (f.type === "date" && s && !/^\d{4}-\d{2}-\d{2}$/.test(s)) s = "";
      if (s) out[f.key] = s;
    }
    if (f.other) {
      const o = src[otherKey(f.key)];
      if (typeof o === "string" && o.trim()) out[otherKey(f.key)] = o.trim().slice(0, 200);
    }
  }
  return out;
}
