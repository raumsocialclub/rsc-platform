/**
 * 상담 신청(/fit-check) 추가 수집 항목 (2026-11-12): 직업 · 학력 · 거주지역(시/도 + 시/군/구).
 * 양식(LeadForm)·저장 API(/api/inquiries)·어드민 상세·CSV(lib/admin/leads.ts)가 같은 목록을 쓴다. 값은 inquiries.answers 에 job · education · region · district 로 저장.
 * 선택지 문구를 바꾸면 이미 저장된 값은 그대로 남으므로(표시도 저장값 그대로) 항목을 지우기보다 뒤에 추가한다.
 */
export const JOB_OPTIONS = ["대기업", "중견기업", "중소기업", "공무원 · 공기업", "사업가 · 경영 2세", "전문직", "자영업", "프리랜서", "기타"] as const;
export const EDUCATION_OPTIONS = ["대학(2, 3년제) 재학", "대학(2, 3년제) 졸업", "대학(4년제) 재학", "대학(4년제) 졸업", "대학원(석사) 재학", "대학원(석사) 졸업", "대학원(박사) 재학", "대학원(박사) 졸업", "고등학교 졸업", "기타"] as const;
export const REGION_OPTIONS = ["서울특별시", "경기도", "인천광역시", "부산광역시", "대구광역시", "광주광역시", "대전광역시", "울산광역시", "세종특별자치시", "강원도", "충청도", "전라도", "경상도", "제주특별자치도", "해외"] as const;
export const DISTRICT_MAX = 30;

export type Job = (typeof JOB_OPTIONS)[number];
export type Education = (typeof EDUCATION_OPTIONS)[number];
export type Region = (typeof REGION_OPTIONS)[number];

export type ProfileAnswers = { job?: string; education?: string; region?: string; district?: string };

/** 어드민 상세·CSV 용 거주지 한 줄: "서울특별시 송파구" (시/군/구 없으면 시/도만) */
export const residenceLabel = (a: ProfileAnswers | null | undefined): string => [a?.region, a?.district].filter((v): v is string => !!v && v.trim() !== "").join(" ");

/** 어드민 상세의 「직업 · 학력 · 거주지」 행. 값이 있는 것만 */
export function profileRows(a: ProfileAnswers | null | undefined): { q: string; a: string }[] {
  return [
    ...(a?.job ? [{ q: "직업", a: a.job }] : []),
    ...(a?.education ? [{ q: "학력", a: a.education }] : []),
    ...(residenceLabel(a) ? [{ q: "거주지", a: residenceLabel(a) }] : []),
  ];
}
