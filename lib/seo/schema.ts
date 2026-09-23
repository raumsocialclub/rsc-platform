import type { DocDef } from "@/lib/cms/schema";

/**
 * SEO · GEO 설정 (M11). site_content 에 'seo.*' 문서로 저장되고 /admin/seo 에서 편집한다.
 * - seo.global : 검색 노출 스위치(기본 꺼짐), 제목 뒤 브랜드명, 기본 설명, 대표 이미지(OG)
 * - seo.verify : 구글 서치콘솔 · 네이버 서치어드바이저 소유 확인 코드
 * - seo.ai     : AI 크롤러 허용(기본 켜짐), llms.txt 본문
 * - seo.org    : 구조화 데이터(조직 · 사업장) 정보
 * - seo.<page> : 페이지별 제목 · 설명 · 대표 이미지 · 검색 제외
 */
const t = (key: string, label: string, hint?: string): DocDef["fields"][number] => ({ key, label, type: "text", hint });
const ta = (key: string, label: string, hint?: string): DocDef["fields"][number] => ({ key, label, type: "textarea", hint });
const img = (key: string, label: string, hint?: string): DocDef["fields"][number] => ({ key, label, type: "image", hint });
const b = (key: string, label: string): DocDef["fields"][number] => ({ key, label, type: "boolean" });

export const DEFAULT_OG_IMAGE = "/images/hero.jpg";
export const DEFAULT_DESCRIPTION = "라움(RAUM)이 검증한 싱글 회원들이 라움아트센터의 공간에서 문화·미식·운동·회복 프로그램을 함께 경험하고 관계를 이어가는 프라이빗 소셜 커뮤니티. 상담 후 초대제로 가입합니다.";

export const AI_BOTS = ["GPTBot", "ChatGPT-User", "OAI-SearchBot", "ClaudeBot", "Claude-User", "Claude-SearchBot", "anthropic-ai", "PerplexityBot", "Perplexity-User", "Google-Extended", "Applebot-Extended", "CCBot"];

/** 공개 페이지 (검색·사이트맵·llms.txt 대상). key 는 seo.<key> 문서 id 와 같다. */
export const PUBLIC_PAGES: { key: string; path: string; label: string; priority: number; changeFrequency: "daily" | "weekly" | "monthly" | "yearly" }[] = [
  { key: "home", path: "/", label: "메인", priority: 1, changeFrequency: "weekly" },
  { key: "pricing", path: "/pricing", label: "멤버십 가격 안내", priority: 0.9, changeFrequency: "monthly" },
  { key: "benefits", path: "/benefits", label: "정회원 혜택 안내", priority: 0.8, changeFrequency: "monthly" },
  { key: "news", path: "/news", label: "소식", priority: 0.7, changeFrequency: "weekly" },
  { key: "fitcheck", path: "/fit-check", label: "RSC 상담 신청", priority: 0.6, changeFrequency: "yearly" },
  { key: "terms", path: "/terms", label: "이용약관", priority: 0.2, changeFrequency: "yearly" },
  { key: "privacy", path: "/privacy", label: "개인정보처리방침", priority: 0.2, changeFrequency: "yearly" },
  { key: "refund", path: "/refund", label: "환불규정", priority: 0.2, changeFrequency: "yearly" },
];

const PAGE_DEFAULTS: Record<string, { title: string; description: string }> = {
  home: { title: "라움소셜클럽 | 검증된 싱글 라이프스타일 커뮤니티", description: DEFAULT_DESCRIPTION },
  pricing: { title: "멤버십 가격 안내", description: "RSC PREVIEW 165,000원(1회) · ACCESS 연 3,300,000원 · SIGNATURE 연 8,800,000원. 모든 금액 VAT 포함, 자동 갱신 없음. 상담 후 PREVIEW 행사로 먼저 경험해 보세요." },
  benefits: { title: "정회원 혜택 안내", description: "6개 카테고리 행사 우선참여, 지인 초대권 연 8매, RSC 라운지·미팅룸, 평일 무료주차, 라움아트센터 대관 우선, 제휴 브랜드 할인까지 라움소셜클럽 정회원 혜택." },
  news: { title: "소식", description: "라움소셜클럽의 새로운 프로그램, 행사 후기, 공지사항을 전합니다." },
  fitcheck: { title: "RSC 상담 신청", description: "간단한 설문을 남기시면 운영팀이 연락드립니다. 상담 후 초대코드로 가입할 수 있습니다." },
  terms: { title: "이용약관", description: "라움소셜클럽 이용약관" },
  privacy: { title: "개인정보처리방침", description: "라움소셜클럽 개인정보처리방침" },
  refund: { title: "환불규정", description: "라움소셜클럽 취소 · 환불 규정" },
};

const DEFAULT_LLMS = `# 라움소셜클럽 (RAUM SOCIAL CLUB, RSC)

> 라움(RAUM)이 검증한 싱글 회원들이 서울 강남 라움아트센터의 공간에서 문화·미식·운동·회복 프로그램을 함께 경험하고 관계를 이어가는 프라이빗 소셜 커뮤니티입니다. 매칭 서비스가 아니라 커뮤니티이며, 상담 후 초대제로 가입합니다.

## 핵심 사실
- 운영: 라움(RAUM) · 서울특별시 강남구 언주로 564 라움아트센터 (역삼동 680-1)
- 가입: 만 19세 이상, 법률상 배우자가 없는 싱글. 사이트에서 상담(Fit Check)을 신청하고 상담 후 초대코드로 가입
- 멤버십: RSC PREVIEW 165,000원(가입 전 행사 1회, 생애 1회) · RSC ACCESS 연 3,300,000원 · RSC SIGNATURE 연 8,800,000원 (VAT 포함, 자동 갱신 없음)
- 프로그램: ART WALK, SUNDAY RESET, TASTE TABLE, ONE QUESTION SALON, AFTER HOURS, RUN & BRUNCH 등 6개 카테고리 행사 · 매월 RAUM SOCIAL NIGHT · 6주 시즌 RAUM SOLO · 관계 프로그램 CONNECTION / RAUM MERRY
- 문의: 02-538-3366 · support@theraum.co.kr · 인스타그램 @raum_socialclub
`;

export const SEO_DOCS: DocDef[] = [
  {
    id: "seo.global",
    page: "seo",
    label: "검색 노출 · 공유 기본값",
    description: "검색 노출을 끄면 모든 페이지에 '검색 제외' 표시가 붙고 robots.txt 가 검색엔진을 막습니다. 오픈할 때 켜 주세요. (AI 크롤러 허용은 아래 'AI 검색' 에서 따로 정합니다)",
    fields: [
      b("indexing", "검색 노출 켜기 (구글 · 네이버 등 검색엔진)"),
      t("titleSuffix", "페이지 제목 뒤에 붙는 브랜드명", "예: 라움소셜클럽 → '멤버십 가격 안내 · 라움소셜클럽'"),
      ta("defaultDescription", "기본 설명", "페이지별 설명이 비어 있을 때 쓰입니다. 80~160자 권장"),
      t("keywords", "검색 키워드", "쉼표로 구분. 네이버가 참고합니다"),
      img("ogImage", "대표 이미지 (카카오톡 · 인스타 공유 미리보기)", "가로 1200 × 세로 630px 권장. 비우면 메인 히어로 사진"),
    ],
    defaults: { indexing: false, titleSuffix: "라움소셜클럽", defaultDescription: DEFAULT_DESCRIPTION, keywords: "라움소셜클럽, RAUM SOCIAL CLUB, 싱글 커뮤니티, 소셜클럽, 강남 소셜클럽, 라움아트센터, 싱글 모임, 프라이빗 멤버십", ogImage: DEFAULT_OG_IMAGE },
  },
  {
    id: "seo.verify",
    page: "seo",
    label: "검색엔진 소유 확인",
    description: "실도메인을 연결한 뒤 구글 서치콘솔 · 네이버 서치어드바이저에서 받은 'HTML 태그' 의 content 값만 붙여 넣습니다. 저장하면 모든 페이지에 확인 태그가 들어갑니다.",
    fields: [t("google", "구글 서치콘솔 확인 코드", "<meta name=\"google-site-verification\" content=\"여기값\"> 의 여기값"), t("naver", "네이버 서치어드바이저 확인 코드", "<meta name=\"naver-site-verification\" content=\"여기값\"> 의 여기값")],
    defaults: { google: "", naver: "" },
  },
  {
    id: "seo.ai",
    page: "seo",
    label: "AI 검색 (GEO)",
    description: "챗GPT · 클로드 · 퍼플렉시티 · 구글 AI 가 사이트를 읽고 인용할 수 있게 합니다. llms.txt 는 AI 가 사이트를 요약할 때 먼저 읽는 소개 파일입니다(/llms.txt).",
    fields: [b("aiCrawlers", "AI 크롤러 허용 (GPTBot · ClaudeBot · PerplexityBot · Google-Extended 등)"), ta("llmsText", "llms.txt 본문", "마크다운. 아래에 공개 페이지 목록과 최근 소식이 자동으로 붙습니다")],
    defaults: { aiCrawlers: true, llmsText: DEFAULT_LLMS },
  },
  {
    id: "seo.org",
    page: "seo",
    label: "조직 · 사업장 정보 (구조화 데이터)",
    description: "구글이 '라움소셜클럽' 검색 결과에 정보 패널을 만들고, AI 가 상호·주소·전화를 정확히 인용하는 데 쓰는 값입니다. 전화 · 이메일 · 인스타그램은 사이트 관리 → 브랜드 · 연락처 값을 함께 씁니다.",
    fields: [
      t("name", "상호(한글)"),
      t("alternateName", "상호(영문)"),
      t("legalName", "법인명 · 사업자명", "예: 주식회사 라움"),
      ta("description", "한 줄 소개"),
      t("streetAddress", "도로명 주소", "예: 언주로 564"),
      t("addressLocality", "구", "예: 강남구"),
      t("addressRegion", "시 · 도", "예: 서울특별시"),
      t("postalCode", "우편번호"),
      t("openingHours", "운영 시간", "예: Mo-Fr 10:00-19:00 (schema.org 형식)"),
      t("priceRange", "가격대", "예: ₩₩₩₩"),
      ta("sameAs", "공식 채널 링크", "줄마다 하나. 인스타그램은 자동 포함"),
      img("logo", "로고 (정사각형 · 배경 있는 PNG 권장)", "비우면 엠블럼"),
    ],
    defaults: { name: "라움소셜클럽", alternateName: "RAUM SOCIAL CLUB", legalName: "", description: "라움이 검증한 멤버가 모이는 싱글 라이프스타일 커뮤니티", streetAddress: "언주로 564", addressLocality: "강남구", addressRegion: "서울특별시", postalCode: "", openingHours: "", priceRange: "₩₩₩₩", sameAs: "", logo: "" },
  },
  ...PUBLIC_PAGES.map<DocDef>((p) => ({
    id: `seo.${p.key}`,
    page: "seo",
    label: `페이지 · ${p.label} (${p.path})`,
    description: p.key === "home" ? "메인 페이지 제목은 브랜드명을 붙이지 않고 그대로 씁니다." : undefined,
    fields: [t("title", "검색 결과 제목", "30자 안팎 권장"), ta("description", "검색 결과 설명", "80~160자 권장. 비우면 기본 설명"), img("ogImage", "이 페이지 대표 이미지", "비우면 기본 대표 이미지"), b("noindex", "이 페이지만 검색 제외")],
    defaults: { title: PAGE_DEFAULTS[p.key].title, description: PAGE_DEFAULTS[p.key].description, ogImage: "", noindex: false },
  })),
];
