/**
 * 사이트 콘텐츠 스키마 (M9 CMS). 어드민 "사이트 관리"가 이 정의로 편집 폼을 만들고,
 * 공개 페이지는 같은 정의의 기본값 위에 DB(site_content)의 수정값을 덮어써서 렌더한다.
 *
 * 텍스트 줄바꿈 규칙: 값 안의 "\n" 은 줄바꿈. breaks="soft" 필드는 데스크톱에서만 줄바꿈(모바일은 이어짐),
 * breaks="hard" 필드는 항상 줄바꿈. (프로토타입의 <br class="lb"> / <br> 구분)
 */
import { SETTINGS_DOCS } from "@/lib/settings/schema";
import { SEO_DOCS } from "@/lib/seo/schema";

export type FieldType = "text" | "textarea" | "image" | "link" | "number" | "boolean" | "color" | "select";
export type Field = {
  key: string;
  label: string;
  type: FieldType;
  hint?: string;
  breaks?: "soft" | "hard";
  options?: { value: string; label: string }[];
};
export type ListDef = { key: string; label: string; itemLabel: string; fields: Field[]; min?: number; max?: number };
export type DocDef = {
  id: string;
  page: "global" | "home" | "social" | "matching" | "apply" | "news" | "partner" | "pricing" | "benefits" | "legal" | "settings" | "seo";
  label: string;
  description?: string;
  /** 「사이트에서 보기」가 이동할 섹션 앵커 (예: "#faq") */
  anchor?: string;
  /** 더 이상 화면에 쓰이지 않는 문서 — 어드민 목록에서 숨긴다 (저장된 값은 보존) */
  hidden?: boolean;
  fields: Field[];
  lists?: ListDef[];
  defaults: Record<string, unknown>;
};

const t = (key: string, label: string, breaks?: "soft" | "hard", hint?: string): Field => ({ key, label, type: "text", breaks, hint });
const ta = (key: string, label: string, breaks?: "soft" | "hard", hint?: string): Field => ({ key, label, type: "textarea", breaks, hint });
const img = (key: string, label: string, hint?: string): Field => ({ key, label, type: "image", hint });
const link = (key: string, label: string): Field => ({ key, label, type: "link", hint: "/로 시작하는 내부 주소 또는 https:// 주소" });
const bool = (key: string, label: string): Field => ({ key, label, type: "boolean" });
const color = (key: string, label: string, hint?: string): Field => ({ key, label, type: "color", hint });

export const DOCS: DocDef[] = [
  /* ---------- 전역 ---------- */
  {
    id: "global.brand",
    page: "global",
    label: "브랜드 · 연락처",
    description: "GNB, 푸터, 메타 정보에 쓰이는 공통 값",
    fields: [
      t("siteName", "사이트 이름"),
      t("metaDescription", "검색 결과 설명(메타)"),
      img("logoEmblem", "로고 엠블럼", "투명 PNG 권장"),
      img("logoText", "로고 텍스트(가로형)", "투명 PNG 권장"),
      t("ctaLabel", "GNB 버튼 문구"),
      link("ctaHref", "GNB 버튼 링크"),
      t("footerHeadline", "푸터 헤드라인", "soft"),
      t("address", "주소", "soft"),
      t("phone", "전화"),
      t("email", "이메일"),
      t("instagramHandle", "인스타그램 계정 (@ 제외)"),
      link("instagramUrl", "인스타그램 링크"),
      t("partnerPhone", "제휴 담당 전화", undefined, "푸터 「제휴문의」 열과 /partner 페이지에 보입니다"),
      t("partnerEmail", "제휴 담당 이메일"),
      t("copyright", "저작권 표기"),
      t("bizName", "정식 상호", undefined, "사업자등록증의 상호. 비우면 푸터·약관의 사업자 정보가 표시되지 않습니다"),
      t("bizRep", "대표자"),
      t("bizNumber", "사업자등록번호", undefined, "예: 000-00-00000"),
      t("bizMailOrder", "통신판매업 신고번호", undefined, "신고 전이면 비워 두세요 (표시되지 않음)"),
      t("bizAddress", "사업장 주소", undefined, "비우면 위 '주소' 값을 씁니다"),
    ],
    defaults: {
      siteName: "RAUM SOCIAL CLUB",
      metaDescription: "라움이 검증한 멤버가 모이는 싱글 라이프스타일 커뮤니티",
      logoEmblem: "/images/logo-emblem.png",
      logoText: "/images/logo-text-nav.png",
      ctaLabel: "RSC 상담 신청",
      ctaHref: "/fit-check",
      footerHeadline: "아름다운 공간에서,\n서로의 특별함을 발견하는 곳.",
      address: "서울특별시 강남구 언주로 564, 비동 2층\n(역삼동, 라움)",
      phone: "02-6925-4786",
      email: "theraumai@gmail.com",
      instagramHandle: "raum_socialclub",
      instagramUrl: "https://www.instagram.com/raum_socialclub/",
      partnerPhone: "010-9272-7783",
      partnerEmail: "se.na@theraum.co.kr",
      copyright: "© 2026 RAUM SOCIAL CLUB",
      bizName: "주식회사 레벤스토리", bizRep: "김기태", bizNumber: "629-87-01795", bizMailOrder: "", bizAddress: "서울특별시 강남구 언주로 564, 비동 2층 (역삼동, 라움)",
    },
  },
  {
    id: "global.theme2",
    page: "global",
    label: "색상 테마",
    description: "공개 사이트 전체의 색. 저장하면 바로 반영됩니다(브라우저 캐시가 남아 있으면 강력 새로고침). 사진·로고는 바뀌지 않고, 어드민 화면은 항상 기본 파랑을 유지합니다. 기본값: 흰 배경 · 검정 글자 · 파란 포인트(#0066ff).",
    fields: [
      color("cream", "페이지 배경"),
      color("ink", "본문 글자 (제목 · 본문)"),
      color("brown", "포인트 색 (파란 버튼 · 링크 · 배지 · 작은 영문 제목 · 체크 아이콘)"),
      color("brownHover", "포인트 진하게 (버튼에 마우스를 올렸을 때)"),
      color("gold", "검은 상자 안 포인트 (하단 상담 띠 · 다크 카드의 링크 색)"),
      color("goldHover", "검은 상자 안 포인트 호버"),
      color("sand", "교차 섹션 배경 (연회색 띠 · 푸터)"),
      color("sandDeep", "표 헤더 배경"),
    ],
    defaults: { cream: "#ffffff", ink: "#171719", brown: "#0066ff", brownHover: "#005eeb", gold: "#3385ff", goldHover: "#66a3ff", sand: "#f7f7f8", sandDeep: "#f4f4f5" },
  },
  {
    id: "global.nav",
    page: "global",
    label: "메뉴 이름 (상단 메뉴 · 푸터)",
    description: "상단 메뉴(GNB)와 푸터에 보이는 메뉴 이름입니다. 푸터 3열은 「제휴문의」(연락처는 브랜드 · 연락처의 제휴 담당 전화·이메일). 링크 주소는 바뀌지 않고 이름만 바뀝니다. 「프로그램」「멤버십」「내 예약」「로그인」은 리드 모드에서는 보이지 않습니다.",
    fields: [
      t("navSocial", "메뉴: 소셜클럽"), t("navMatching", "메뉴: 1:1 매칭"), t("navAbout", "메뉴: 브랜드소개"), t("navPrograms", "메뉴: 프로그램"), t("navMembership", "메뉴: 멤버십"), t("navNews", "메뉴: 소식"), t("navFaq", "메뉴: FAQ"),
      t("navMy", "메뉴: 내 예약"), t("navLogin", "메뉴: 로그인"), t("navLogout", "메뉴: 로그아웃"),
      t("footerMenuTitle", "푸터 1열 제목"), t("footerFaq", "푸터: 자주 묻는 질문"), t("footerApply", "푸터: 상담 신청"), t("footerContactTitle", "푸터 2열 제목"), t("footerPartnerTitle", "푸터 3열 제목 (제휴문의)"), t("footerPartnerLink", "푸터: 제휴 안내 링크 문구"),
      t("legalTerms", "푸터: 이용약관"), t("legalPrivacy", "푸터: 개인정보처리방침"), t("legalRefund", "푸터: 환불규정"),
    ],
    defaults: {
      navSocial: "소셜클럽", navMatching: "1:1 매칭", navAbout: "브랜드소개", navPrograms: "프로그램", navMembership: "멤버십", navNews: "소식", navFaq: "FAQ",
      navMy: "내 예약", navLogin: "로그인", navLogout: "로그아웃",
      footerMenuTitle: "메뉴", footerFaq: "자주 묻는 질문", footerApply: "상담 신청", footerContactTitle: "문의", footerPartnerTitle: "제휴문의", footerPartnerLink: "제휴 안내 보기",
      legalTerms: "이용약관", legalPrivacy: "개인정보처리방침", legalRefund: "환불규정",
    },
  },

  /* ---------- 홈 ---------- */
  {
    id: "home.hero",
    page: "home",
    hidden: true, // 2026-11 두 갈래 홈(home.gate)으로 교체되어 화면에 쓰이지 않음
    label: "(사용 안 함) 옛 히어로",
    fields: [img("image", "배경 사진", "가로 1920px 이상 권장"), t("overline", "작은 제목"), ta("title", "큰 제목", "hard"), ta("body", "설명", "soft"), t("cta1Label", "버튼 1 문구"), link("cta1Href", "버튼 1 링크"), t("cta2Label", "버튼 2 문구"), link("cta2Href", "버튼 2 링크")],
    defaults: {
      image: "/images/hero.jpg",
      overline: "A CURATED LIFESTYLE COMMUNITY FOR SINGLES",
      title: "라움이 검증한 멤버가 모이는\n싱글 라이프스타일 커뮤니티",
      body: "아름다운 공간에서, 서로의 특별함을 발견하는 곳.\n문화와 취향을 함께하며 자연스럽게 서로를 발견합니다.",
      cta1Label: "RSC 상담 신청",
      cta1Href: "/fit-check",
      cta2Label: "프로그램 보기",
      cta2Href: "#social",
    },
  },
  {
    id: "home.about",
    page: "home",
    anchor: "#about",
    label: "01 소개 (NEW DEFINITION)",
    fields: [bool("visible", "표시"), t("label", "섹션 라벨"), t("title", "제목"), ta("p1", "본문 1", "hard"), ta("p2", "본문 2", "soft"), ta("quote", "인용문", "soft"), img("image", "사진")],
    defaults: {
      visible: true,
      label: "01  /  NEW DEFINITION",
      title: "라움소셜클럽이란",
      p1: "소개팅을 하기 위해 한 번 만나는 곳이 아니라, \n문화·예술·와인·웰니스·뮤직·스포츠 등 \n자신이 좋아하는 경험을 함께하며 \n결이 맞는 사람을 반복적으로 만나고 관계를 만들어가는 곳입니다.",
      p2: "라움은 누군가를 억지로 연결하지 않습니다.\n아름다운 공간에 멋진 싱글들을 모으고,\n함께 경험할 이유를 만들고, 다시 만날 기회를 설계합니다.",
      quote: "RSC는 소개팅 클럽이 아니라,\n싱글들의 라이프스타일을 가장 매력적으로 만드는 커뮤니티입니다.",
      image: "/images/about.jpg",
    },
  },
  {
    id: "home.why",
    page: "social",
    anchor: "#why",
    label: "02 포지셔닝 (MATCHING이 아니라 COMMUNITY)",
    fields: [bool("visible", "표시"), t("label", "섹션 라벨"), ta("title", "제목", "hard"), ta("lead", "설명", "soft"), ta("closing", "마무리 문장", "soft")],
    lists: [{ key: "items", label: "3단계 카드", itemLabel: "카드", fields: [t("label", "라벨"), ta("text", "내용", "soft")], min: 1, max: 6 }],
    defaults: {
      visible: true,
      label: "02  /  POSITIONING",
      title: "MATCHING이 아니라\nCOMMUNITY 입니다",
      lead: "매칭은 목적이 아니라, 잘 설계된 커뮤니티 안에서 자연스럽게 발생하는 결과입니다.",
      items: [
        { label: "01 EXPERIENCE", text: "아름다운 공간에서\n매력적인 경험을 합니다." },
        { label: "02 PEOPLE", text: "그 경험을 함께하는\n멋진 사람들을 발견합니다." },
        { label: "03 RELATIONSHIP", text: "반복적으로 만나면서\n자연스럽게 관계가 시작됩니다." },
      ],
      closing: "좋은 사람을 소개하는 것이 아니라,\n멋진 사람을 발견할 수 있는 환경을 만드는 것.",
    },
  },
  {
    id: "home.promise",
    page: "home",
    anchor: "#promise",
    label: "02 브랜드 약속",
    fields: [bool("visible", "표시"), t("label", "섹션 라벨"), ta("title", "제목", "hard")],
    lists: [{ key: "items", label: "가치 카드", itemLabel: "카드", fields: [t("label", "라벨"), t("title", "제목"), ta("body", "설명", "soft")], min: 1, max: 6 }],
    defaults: {
      visible: true,
      label: "03  /  RSC BRAND PROMISE",
      title: "RSC가 싱글 회원에게 제공하는\n세 가지 가치",
      items: [
        { label: "01 BETTER LIFE", title: "더 매력적인 싱글 라이프", body: "전시, 공연, 와인, 운동, 다이닝 등\n혼자서는 쉽게 경험하지 않았던 순간을 함께합니다. 가입하는 순간부터 삶 자체가 더 풍성해집니다." },
        { label: "02 BETTER PEOPLE", title: "검증된 사람들과의 새로운 연결", body: "불특정 다수가 아니라,\n라움이라는 브랜드와 멤버십을 선택하고\n실제로 커뮤니티에 참여하는 사람들을 만납니다." },
        { label: "03 BETTER RELATIONSHIP", title: "자연스럽게 깊어지는 관계", body: "한 번의 만남으로 상대를 판단하지 않습니다.\n여러 프로그램에서 반복적으로 만나며\n서로의 결을 알아갑니다." },
      ],
    },
  },
  {
    id: "home.social",
    page: "social",
    anchor: "#social",
    label: "03 TASTE SOCIAL 프로그램 카드",
    fields: [bool("visible", "표시"), t("label", "섹션 라벨"), ta("title", "제목", "hard"), ta("lead", "설명", "soft"), t("swipeHint", "모바일 스와이프 안내", undefined, "모바일에서 카드 위에 보이는 작은 안내 문구")],
    lists: [{ key: "items", label: "프로그램 카드", itemLabel: "카드", fields: [img("image", "사진"), t("cat", "카테고리"), t("title", "이름"), ta("desc", "설명", "soft"), t("filter", "사진 보정(CSS filter)", undefined, "예: brightness(0.97) saturate(0.94)")], min: 1, max: 12 }],
    defaults: {
      visible: true,
      label: "04  /  RSC TASTE SOCIAL — MONTHLY",
      swipeHint: "옆으로 밀어서 보기 →",
      title: "매달 한 번, RSC를 일상으로 만드는\n취향 프로그램",
      lead: "연애를 앞세우지 않습니다. 월 1회 열리는 TASTE SOCIAL 에서\n좋아하는 것을 함께 경험하다 보면 자연스럽게 사람을 알게 됩니다.",
      items: [
        { image: "/images/art-walk.jpg", cat: "ART & CULTURE", title: "RAUM ART WALK", desc: "전시 관람 → 큐레이터 토크 → 자유 소셜로\n이어지는 시간입니다.", filter: "brightness(0.97) saturate(0.94)" },
        { image: "/images/sunday-reset.jpg", cat: "SOCIAL WELLNESS", title: "SUNDAY RESET", desc: "요가·바레·명상으로 시작해, 브런치와 커뮤니티 테이블로 이어집니다.", filter: "brightness(1.12) saturate(0.94)" },
        { image: "/images/taste-table.jpg", cat: "WINE & SPIRITS", title: "TASTE TABLE", desc: "와인 또는 위스키 테이스팅 후,\n취향별 테이블에서 자유롭게 이야기합니다.", filter: "brightness(0.97) saturate(0.94)" },
        { image: "/images/talk-insight.jpg", cat: "TALK & INSIGHT", title: "ONE QUESTION SALON", desc: "하나의 질문을 중심으로 4~6명이 서로의 생각을 나누는\n소규모 살롱입니다.", filter: "brightness(0.97) saturate(0.94)" },
        { image: "/images/after-hours.jpg", cat: "MUSIC & PERFORMANCE", title: "RAUM AFTER HOURS", desc: "공연을 보고, 음악과 함께 애프터 소셜로 밤이 이어집니다.", filter: "brightness(1.1) saturate(0.94)" },
        { image: "/images/run-brunch.jpg", cat: "SPORTS & MOVEMENT", title: "RUN & BRUNCH", desc: "러닝과 트레이닝 후, 브런치를 나누며 소셜 타임을 갖습니다.", filter: "brightness(1.15) saturate(0.94)" },
      ],
    },
  },
  {
    id: "home.solo",
    page: "matching",
    anchor: "#members",
    label: "04 회원 전용 행사 (SOCIAL NIGHT · GRAND BALL · RAUM SOLO)",
    fields: [bool("visible", "표시"), t("label", "섹션 라벨"), ta("title", "제목", "hard"), ta("lead", "설명", "soft")],
    lists: [{ key: "cards", label: "카드", itemLabel: "카드", fields: [img("image", "사진"), t("label", "라벨"), t("title", "이름"), ta("body", "설명", "soft"), t("filter", "사진 보정(CSS filter)")], min: 1, max: 4 }],
    defaults: {
      visible: true,
      label: "MEMBERS ONLY",
      title: "1:1 매칭 회원만의\n특별한 시간",
      lead: "ACCESS · SIGNATURE 회원은 참여권 차감 없이 분기 테마 나이트와 연말 그랜드 볼에 참여합니다. SIGNATURE 회원은 기수제 로테이션 프로그램 RAUM SOLO 1기가 포함됩니다.",
      cards: [
        { image: "/images/social-night.jpg", label: "ACCESS · SIGNATURE · 3 · 6 · 9월 + 11월 GRAND BALL", title: "RAUM SOCIAL NIGHT", body: "3·6·9월에 열리는 테마 나이트(Masquerade · Garden · Summer White). 공연, 다이닝, 와인, 음악 안에서 자연스럽게 사람을 만납니다.\n11월에는 RSC GRAND SOCIAL BALL 로 한 해를 함께한 회원 전원이 모입니다. 참여권 차감이 없는 멤버십 회원 전용 행사입니다.", filter: "brightness(1.1) saturate(0.94)" },
        { image: "/images/raum-solo.jpg", label: "SIGNATURE · 6 COHORTS A YEAR", title: "RAUM SOLO", body: "한 번의 소개팅이 아닌, 함께 보내는 한 기수. 오리엔테이션 → 오프닝 나이트 → 와인 → 웰니스 → 살롱 → 애프터아워즈 → SOLO BALL 로 이어지는 기수제 로테이션 프로그램입니다.\n1·3·6·8·10·12월 연 6기로 운영하며, SIGNATURE 회원은 1기 참여가 포함됩니다.", filter: "grayscale(1) brightness(1.05) contrast(1.05)" },
      ],
    },
  },
  {
    id: "home.spaces",
    page: "social",
    anchor: "#spaces",
    label: "04 함께하는 시간 (MOMENTS)",
    description: "경험 중심 4장 카드. 네 장 모두 정사각형 사진 + 번호·제목·설명 구조(글 크기·배치 동일). 사진 초점은 '가로% 세로%'.",
    fields: [bool("visible", "표시"), t("label", "섹션 라벨"), t("title", "제목"), ta("lead", "설명", "hard"), t("swipeHint", "모바일 스와이프 안내"), t("ctaLabel", "버튼 문구", undefined, "비우면 버튼을 표시하지 않음"), link("ctaHref", "버튼 링크")],
    lists: [{ key: "items", label: "카드", itemLabel: "카드", fields: [img("image", "사진 (정사각형 1:1 권장)"), t("n", "번호"), t("title", "제목"), ta("desc", "설명", "soft"), t("alt", "사진 설명(대체 텍스트)", undefined, "화면 낭독기·검색엔진용. 사진이 보여주는 장면을 한 문장으로"), t("position", "사진 초점", undefined, "예: 50% 60% — 모바일에서 잘리는 부분을 조정"), t("note", "보조 정보(선택)", undefined, "예: 장소명. 사진과 장소의 관계가 확실할 때만")], min: 1, max: 6 }],
    defaults: {
      visible: true,
      label: "06  /  MOMENTS",
      swipeHint: "옆으로 밀어서 보기 →",
      title: "취향을 나누고, 서로를 알아가는 시간",
      lead: "문화와 웰니스, 함께하는 저녁까지.\n라움소셜클럽에서 싱글들의 새로운 일상이 시작됩니다.",
      ctaLabel: "프로그램 살펴보기",
      ctaHref: "/#social",
      items: [
        { image: "/images/moment-01-table.jpg", n: "01", title: "대화가 이어지는 시간", desc: "함께한 경험이 대화가 되고, 다음 만남의 이유가 됩니다.", alt: "꽃이 놓인 저녁 식탁에서 와인잔을 든 손과 대화하는 사람들", position: "50% 50%", note: "" },
        { image: "/images/moment-02-concert.jpg", n: "02", title: "취향을 나누는 시간", desc: "음악과 이야기, 새로운 시선을 함께 나누며 서로의 취향을 알아갑니다.", alt: "벽돌 아치 홀에서 관객이 둘러앉아 피아노 연주를 감상하는 모습", position: "50% 60%", note: "" },
        { image: "/images/moment-03-garden.jpg", n: "03", title: "함께 움직이는 시간", desc: "함께 움직이고 쉬어가는 사이, 첫 만남의 긴장도 자연스럽게 풀립니다.", alt: "정원 잔디 위 매트에 앉아 팔을 뻗어 스트레칭하는 사람들의 뒷모습", position: "50% 65%", note: "" },
        { image: "/images/moment-04-evening.jpg", n: "04", title: "조금 더 가까워지는 저녁", desc: "와인 한 잔과 편안한 대화로 서로를 조금 더 알아가는 저녁.", alt: "전구 조명이 걸린 저녁 정원에서 잔을 들고 이야기 나누는 사람들", position: "50% 55%", note: "" },
      ],
    },
  },
  {
    id: "home.membership",
    page: "home",
    hidden: true, // 2026-11 두 갈래 홈에서 제외됨 (멤버십 구성은 social.membership · matching.plans)
    label: "(사용 안 함) 옛 멤버십 섹션",
    fields: [bool("visible", "표시"), t("label", "섹션 라벨"), img("image", "사진"), ta("title", "제목", "hard"), ta("body", "설명", "soft"), t("link1Label", "카드 링크 1 문구"), link("link1Href", "카드 링크 1"), t("link2Label", "카드 링크 2 문구"), link("link2Href", "카드 링크 2"), t("cta1Label", "버튼 1 문구"), link("cta1Href", "버튼 1 링크"), t("cta2Label", "버튼 2 문구"), link("cta2Href", "버튼 2 링크")],
    lists: [{ key: "values", label: "가치 5칸", itemLabel: "칸", fields: [t("label", "라벨"), ta("text", "내용", "hard")], min: 1, max: 8 }],
    defaults: {
      visible: true,
      label: "07  /  MEMBERSHIP",
      image: "/images/membership.jpg",
      title: "검증된 멤버들이 모이는\n싱글 라이프스타일 커뮤니티",
      body: "문화와 취향을 함께하며 자연스럽게 서로를 발견하는 곳.\n회원이 구매하는 것은 매칭 횟수가 아니라,\n1년 동안 이어지는 경험과 관계의 가능성입니다.",
      link1Label: "멤버십 가격 안내", link1Href: "/pricing", link2Label: "혜택 확인", link2Href: "/benefits",
      cta1Label: "RSC 상담 신청하기", cta1Href: "/fit-check", cta2Label: "인스타그램", cta2Href: "https://www.instagram.com/raum_socialclub/",
      values: [
        { label: "SPACE", text: "아름다운 라움의 프라이빗 공간." },
        { label: "PEOPLE", text: "선별되고, 활동을 통해 다시 확인되는 회원." },
        { label: "EXPERIENCE", text: "1년 동안 이어지는 문화와\n취향의 경험." },
        { label: "COMMUNITY", text: "같은 공간에서 반복적으로 마주치는 소속감." },
        { label: "OPPORTUNITY", text: "자연스럽게 새로운 관계가 시작될 가능성." },
      ],
    },
  },

  {
    id: "home.faq",
    page: "home",
    anchor: "#faq",
    label: "03 자주 묻는 질문 (FAQ · 소셜클럽 페이지에도 표시)",
    description: "메인과 소셜클럽 페이지에 함께 나오는 FAQ 입니다. 1:1 매칭 페이지의 FAQ 는 「1:1 매칭」 탭에 따로 있습니다. 금액(원)이 들어간 질문·답변은 화면에서 자동으로 빠집니다. 검색엔진·AI 검색이 '가입 조건·회비·환불' 같은 질문에 답할 때 인용하는 섹션입니다. 질문은 방문자가 실제로 검색할 문장으로 쓰는 것이 좋습니다.",
    fields: [bool("visible", "표시"), t("label", "섹션 라벨"), ta("title", "제목", "hard"), ta("lead", "설명", "soft")],
    lists: [{ key: "items", label: "질문", itemLabel: "질문", fields: [t("q", "질문"), ta("a", "답변", "hard")], min: 1, max: 20 }],
    defaults: {
      visible: true,
      label: "08  /  FAQ",
      title: "자주 묻는 질문",
      lead: "가입 조건부터 프로그램, 오시는 길까지.\n더 궁금한 점은 상담 신청으로 남겨 주세요.",
      items: [
        { q: "라움소셜클럽은 어떤 곳인가요? 소개팅·매칭 서비스인가요?", a: "두 가지 방식이 있습니다. 소셜클럽은 특정 상대를 소개하지 않는 커뮤니티 멤버십으로, 라움이 검증한 싱글 회원들이 월 1회 TASTE SOCIAL(아트·와인·웰니스·러닝·토크·다이닝)에서 반복해 만나며 자연스럽게 가까워집니다. 1:1 매칭(ACCESS · SIGNATURE)은 여기에 전담 컨시어지의 1:1 소개가 더해진 결혼중개 멤버십으로, 만남은 라움의 공간에서 이루어지고 실제로 만난 경우에만 횟수가 차감됩니다." },
        { q: "가입 조건이 어떻게 되나요?", a: "만 25~45세, 법률상 배우자가 없는 싱글(미혼·이혼·사별)이면 상담을 신청할 수 있습니다. 상담 후 신분증·혼인관계증명서·재직 증빙으로 가입 심사를 거치고, 프로필·취향 인터뷰와 커뮤니티 매너 서약을 마친 분만 회원이 됩니다." },
        { q: "초대제라는 게 무슨 뜻인가요? 바로 가입할 수는 없나요?", a: "네, 상담 없이 바로 가입할 수는 없습니다. 사이트의 'RSC 상담 신청'에서 이름과 연락처를 남기시면 운영팀이 연락드려 상담을 진행하고, 상담 후 초대코드를 보내드립니다. 그 코드로 가입 화면에 들어올 수 있습니다." },
        { q: "회비는 얼마인가요?", a: "가입비와 연회비는 공개하지 않고, 대면 상담에서 직접 안내해 드립니다. 소셜클럽은 가입비 하나로 1년 회원 자격과 행사 6회 참여권, 지인 초대권 2매를 받고, 1:1 매칭(ACCESS · SIGNATURE)은 연회비를 더해 1:1 만남권(5회 · 10회)과 회원 전용 행사를 받습니다. 자동 갱신은 없으며 성혼사례금도 없습니다. Founding Member 선착순 100명은 가입비가 면제됩니다." },
        { q: "PREVIEW는 무엇이고, 가입하면 비용은 어떻게 되나요?", a: "PREVIEW는 가입을 결정하기 전에 RSC의 공간·회원·프로그램을 실제 행사 1회로 먼저 경험하는 상품입니다(생애 최초 1회). 행사 1회, 호스트 온보딩과 공간 안내, 행사 후 멤버십 상담, 행사 당일 주차 3시간이 포함됩니다. 행사 후 7일 이내에 가입하시면 PREVIEW 비용이 가입비에 전액 충당됩니다. 참가비는 상담에서 안내해 드립니다." },
        { q: "어떤 프로그램이 있나요?", a: "모든 회원이 참여하는 월 1회 RSC TASTE SOCIAL — RAUM ART WALK(전시), SUNDAY RESET(웰니스), TASTE TABLE(와인·위스키), ONE QUESTION SALON(토크), RAUM AFTER HOURS(공연·음악), RUN & BRUNCH(러닝) — 이 기본입니다. 1:1 매칭(ACCESS · SIGNATURE) 회원은 3·6·9월 RAUM SOCIAL NIGHT 와 11월 RSC GRAND SOCIAL BALL 에 참여하고, SIGNATURE 회원은 연 6기 기수제 로테이션 프로그램 RAUM SOLO 1기가 포함됩니다. 결혼 목적의 플래그십 RAUM MERRY 는 별도 심사로 진행합니다." },
        { q: "위치는 어디이고 주차는 가능한가요?", a: "서울특별시 강남구 언주로 564 라움아트센터(역삼동 680-1)입니다. 정회원은 평일 1일 1회, 3시간까지 무료로 주차할 수 있고 PREVIEW 참가자는 행사 당일 3시간 주차가 제공됩니다. 행사 전후에는 RSC 라운지를 자유롭게 이용하실 수 있습니다." },
        { q: "상담은 어떻게 신청하나요?", a: "사이트 상단의 'RSC 상담 신청' 버튼을 눌러 이름·연락처·상담 가능 시간만 남겨 주세요. 담당자가 직접 연락드립니다. 인스타그램 @raum_socialclub 프로필의 링크나 DM으로도 상담을 신청하실 수 있습니다." },
      ],
    },
  },

  /* ---------- 홈 게이트 (소셜클럽 / 1:1 매칭 두 갈래) — 문구는 RSC 사업전략(2026.11.03) 기준 ---------- */
  {
    id: "home.gate",
    page: "home",
    anchor: "#gate-hero",
    label: "00 대문 (메인 큰 사진 위 문구 · 소셜클럽/1:1 매칭 탭)",
    description: "메인 맨 위 큰 사진 위에 보이는 문구입니다. 왼쪽 위 탭을 누르면 사진·문구·버튼이 바뀌고, 흰 버튼은 각 페이지(/social, /matching)로, 파란 버튼은 상담 신청으로 이어집니다. 큰 제목의 줄바꿈은 그대로 적용됩니다.",
    fields: [
      t("tabSocial", "왼쪽 위 탭 1 이름"), t("tabSocialSub", "탭 1 한 줄 설명", undefined, "소셜클럽·1:1 매칭 페이지 상단 전환 바에서 이름 아래에 표시"), t("tabMatching", "왼쪽 위 탭 2 이름"), t("tabMatchingSub", "탭 2 한 줄 설명"),
      { key: "defaultTrack", label: "처음 보여줄 탭", type: "select", options: [{ value: "social", label: "소셜클럽" }, { value: "matching", label: "1:1 매칭" }] },
      img("socialImage", "[소셜클럽 탭] 배경 사진", "가로 1920px 이상 권장"), t("socialOverline", "[소셜클럽 탭] 사진 위 작은 영문 (예: RAUM SOCIAL CLUB)"), ta("socialTitle", "[소셜클럽 탭] 큰 제목", "hard"), ta("socialBody", "[소셜클럽 탭] 제목 아래 설명", "soft"), t("socialCta", "[소셜클럽 탭] 흰 버튼 문구"),
      img("matchingImage", "[1:1 매칭 탭] 배경 사진", "가로 1920px 이상 권장"), t("matchingOverline", "[1:1 매칭 탭] 사진 위 작은 영문 (예: RAUM 1:1 MATCHING)"), ta("matchingTitle", "[1:1 매칭 탭] 큰 제목", "hard"), ta("matchingBody", "[1:1 매칭 탭] 제목 아래 설명", "soft"), t("matchingCta", "[1:1 매칭 탭] 흰 버튼 문구"),
      t("applyCta", "파란 「상담 신청」 버튼 문구 (두 탭 공통)"),
    ],
    defaults: {
      tabSocial: "소셜클럽", tabSocialSub: "함께 경험하며 가까워지는", tabMatching: "1:1 매칭", tabMatchingSub: "한 사람을 깊이 알고 만나는", defaultTrack: "social",
      socialImage: "/images/hero.jpg", socialOverline: "RAUM SOCIAL CLUB", socialTitle: "취향으로 만나,\n함께하는 일상이 넓어지는 곳.", socialBody: "싱글을 위한 라이프스타일 커뮤니티.\n좋아하는 것을 함께하며, 서로를 알아갑니다.", socialCta: "소셜클럽 자세히 보기",
      matchingImage: "/images/after-hours.jpg", matchingOverline: "RAUM 1:1 MATCHING", matchingTitle: "한 사람을,\n깊이 알고 만나는 곳.", matchingBody: "검증된 멤버를 위한 프라이빗 1:1 소개.\n전담 컨시어지가 직접 소개하고, 만남은 라움에서 이루어집니다.", matchingCta: "1:1 매칭 자세히 보기",
      applyCta: "상담 신청",
    },
  },
  {
    id: "home.tracks",
    page: "home",
    anchor: "#tracks",
    label: "00-1 두 가지 방식 비교 카드",
    fields: [t("label", "작은 제목"), ta("title", "제목", "hard"), ta("lead", "설명", "soft"), t("detailCta", "「자세히 보기」 버튼 문구"), t("applyCta", "「상담 신청」 버튼 문구"), t("socialEyebrow", "소셜클럽 카드 작은 제목"), t("socialTitle", "소셜클럽 카드 제목"), ta("socialDesc", "소셜클럽 카드 설명", "soft"), ta("socialPoints", "소셜클럽 특징 (줄마다 '항목: 내용')"), t("matchingEyebrow", "1:1 매칭 카드 작은 제목"), t("matchingTitle", "1:1 매칭 카드 제목"), ta("matchingDesc", "1:1 매칭 카드 설명", "soft"), ta("matchingPoints", "1:1 매칭 특징 (줄마다 '항목: 내용')"), ta("note", "하단 안내", "soft"), bool("visible", "표시")],
    defaults: {
      label: "TWO WAYS TO MEET",
      detailCta: "자세히 보기", applyCta: "상담 신청",
      socialEyebrow: "01 · SOCIAL CLUB", matchingEyebrow: "02 · 1:1 MATCHING",
      title: "나에게 맞는 방식을\n먼저 골라 보세요",
      lead: "같은 공간, 같은 가입 심사를 거친 사람들. 만나는 방식만 다릅니다. 둘 다 상담은 무료이며, 상담에서 함께 정해도 됩니다.",
      socialTitle: "소셜클럽",
      socialDesc: "취향과 사람을 넓게, 자연스럽게 만나고 싶은 분",
      socialPoints: "대상: 새로운 취향과 사람을 넓게 만나고 싶은 25~45세 싱글\n방식: 월 1회 RSC TASTE SOCIAL (아트·와인·웰니스·러닝·토크·다이닝)\n구성: 1년 회원 자격 + 행사 6회 참여권 + 지인 초대권 2매\n관계: 결혼중개가 아닌 커뮤니티. 원하면 연회비만 더해 1:1 매칭으로 전환",
      matchingTitle: "1:1 매칭",
      matchingDesc: "한 사람을 진지하게, 깊이 알고 만나고 싶은 분",
      matchingPoints: "대상: 진지한 교제·결혼을 염두에 둔 25~45세 싱글\n방식: 상담·인터뷰 후 전담 컨시어지가 직접 소개, 만남은 라움에서\n구성: 소셜클럽 포함 + 1:1 만남 ACCESS 5회 · SIGNATURE 10회(+ RAUM SOLO 1기)\n관계: 실제로 만난 경우에만 차감, 거절 무제한, 성혼사례금 없음",
      note: "두 멤버십 모두 가입 심사(신분증·혼인관계증명서·재직 증빙)를 거칩니다. 소셜클럽으로 시작해 연회비만 더해 1:1 매칭(ACCESS·SIGNATURE)으로 전환할 수 있으며, 가입비·연회비는 대면 상담에서 안내해 드립니다.",
      visible: true,
    },
  },

  {
    id: "home.cta",
    page: "home",
    label: "04 하단 상담 띠 (검은 박스)",
    description: "메인 맨 아래 검은 띠. 버튼 두 개는 각각 소셜클럽·1:1 매칭 상담 신청으로 갑니다.",
    fields: [t("title", "제목"), ta("body", "설명", "soft"), t("socialLabel", "소셜클럽 버튼 문구"), t("matchingLabel", "1:1 매칭 버튼 문구")],
    defaults: { title: "상담으로 시작해 보세요", body: "이름과 연락처만 남기면 담당자가 직접 연락드립니다. 가입이 아닌 상담 신청이며, 비용은 없습니다.", socialLabel: "소셜클럽 상담 신청", matchingLabel: "1:1 매칭 상담 신청" },
  },

  /* ---------- 소셜클럽 ---------- */
  {
    id: "social.hero",
    page: "social",
    label: "00 상단 소개",
    fields: [img("image", "사진"), t("overline", "작은 제목"), ta("title", "큰 제목", "hard"), ta("body", "설명", "soft"), t("cta1Label", "버튼 1 문구"), link("cta1Href", "버튼 1 링크"), t("cta2Label", "버튼 2 문구"), link("cta2Href", "버튼 2 링크")],
    defaults: {
      image: "/images/moment-04-evening.jpg",
      overline: "A CURATED LIFESTYLE COMMUNITY FOR SINGLES",
      title: "좋아하는 것을 함께하며,\n서로를 알아갑니다.",
      body: "라움소셜클럽은 라움이 검증한 멤버가 모이는 싱글 라이프스타일 커뮤니티입니다.\n각자의 취향과 삶을 존중하는 사람들이 라움의 공간에서 문화와 여가를 함께 즐깁니다.\n함께하는 시간이 쌓일수록 대화는 깊어지고, 새로운 관계가 시작됩니다.",
      cta1Label: "소셜클럽 상담 신청", cta1Href: "/fit-check?track=social",
      cta2Label: "프로그램 보기", cta2Href: "#social",
    },
  },
  {
    id: "social.membership",
    page: "social",
    anchor: "#membership",
    label: "01 소셜클럽 멤버십 구성",
    description: "가입비로 받는 것(사업전략 PRICING). 금액은 비공개 — 대면 상담에서 안내하므로 문구에 숫자를 넣지 않습니다.",
    fields: [t("label", "작은 제목"), ta("title", "제목", "hard"), ta("lead", "설명", "soft"), ta("note", "하단 안내", "soft"), bool("visible", "표시")],
    lists: [{ key: "items", label: "구성 항목", itemLabel: "항목", fields: [t("label", "라벨"), t("title", "제목"), ta("body", "설명", "soft")], min: 1, max: 6 }],
    defaults: {
      label: "SOCIAL CLUB MEMBERSHIP", title: "소셜클럽 멤버십,\n1년 동안 받는 것", lead: "가입비 하나로 1년 회원 자격과 행사 참여권, 초대권을 받습니다. 결혼중개가 아니므로 특정 상대를 소개하지 않으며, 원할 때 연회비만 더해 1:1 매칭으로 전환합니다.",
      visible: true,
      items: [
        { label: "01 MEMBERSHIP", title: "RSC 회원 자격 1년", body: "가입 심사를 통과한 검증된 싱글 멤버. 라움아트센터 라운지와 회원 전용 프로그램 안내를 받습니다." },
        { label: "02 EVENTS", title: "RSC TASTE SOCIAL 6회 참여권", body: "월 1회 열리는 아트·와인·웰니스·러닝·토크·다이닝 행사 중 6회. 실제 참석 시에만 차감되고, 7회차부터는 회당 실비로 참여합니다." },
        { label: "03 INVITATION", title: "지인 초대권 2매", body: "좋은 사람을 라움으로 초대할 수 있는 초대권 2매. 함께 온 지인도 같은 기준의 가입 심사를 거쳐 회원이 될 수 있습니다." },
        { label: "04 UPGRADE", title: "1:1 매칭으로 전환", body: "소셜클럽으로 시작한 뒤, 연회비만 추가하면 ACCESS(1:1 만남 5회) 또는 SIGNATURE(10회 + RAUM SOLO)로 전환됩니다." },
      ],
      note: "가입 자격은 만 25~45세, 법률상 배우자가 없는 싱글입니다. 가입비는 대면 상담에서 안내해 드리며, 가입 후 14일 이내 전액 환불, 이후에는 계약서의 월별 환불표를 따릅니다.",
    },
  },

  /* ---------- 1:1 매칭 ---------- */
  {
    id: "social.verify",
    page: "social",
    anchor: "#verify",
    label: "05 가입 심사 (아무나, 들어올 수 없습니다)",
    description: "소셜클럽 페이지의 가입 심사 섹션. 1:1 매칭 페이지의 같은 섹션은 「1:1 매칭」 탭 → 01 가입 심사에서 따로 수정합니다. 카드는 아이콘 · 제목 · 설명으로 이루어지며 최대 6개입니다.",
    fields: [t("label", "작은 제목"), ta("title", "제목", "hard"), ta("lead", "설명", "soft"), bool("visible", "표시")],
    lists: [{ key: "items", label: "확인 항목", itemLabel: "항목", fields: [{ key: "icon", label: "아이콘", type: "select", options: [{ value: "shield", label: "방패(신원)" }, { value: "briefcase", label: "서류가방(직업)" }, { value: "chat", label: "말풍선(인터뷰)" }, { value: "people", label: "사람들(커뮤니티)" }] }, t("title", "제목"), ta("body", "설명", "soft")], min: 1, max: 6 }],
    defaults: {
      label: "VERIFIED MEMBERS", title: "아무나,\n들어올 수 없습니다", lead: "가입 전 모든 회원의 신원·혼인 관계·직업·진정성을 확인합니다. 기준을 통과한 검증된 분들끼리만, 철저히 프라이빗하게 소개합니다.", visible: true,
      items: [
        { icon: "shield", title: "본인 · 혼인 관계 확인", body: "신분증과 혼인관계증명서로 실명·본인 명의, 법률상 배우자가 없음을 확인합니다." },
        { icon: "briefcase", title: "직업 확인", body: "재직 증명서, 사업자 등록 등 직업·사업 서류를 확인합니다." },
        { icon: "chat", title: "프로필 · 취향 인터뷰", body: "라움에서의 대면 인터뷰로 생활 방식, 취향, 바라는 관계를 듣고 커뮤니티 매너 서약을 받습니다." },
        { icon: "people", title: "활동으로 2차 검증", body: "서류로 끝나지 않습니다. 라움의 공간과 프로그램에 실제로 참여해 온 회원 중에서만 소개합니다." },
      ],
    },
  },
  {
    id: "social.cta",
    page: "social",
    label: "06 하단 상담 띠 (검은 박스)",
    fields: [t("title", "제목"), ta("body", "설명", "soft"), t("ctaLabel", "버튼 문구")],
    defaults: { title: "소셜클럽, 상담으로 시작해 보세요", body: "이름과 연락처만 남기면 담당자가 직접 연락드립니다. 가입이 아닌 상담 신청이며, 비용은 없습니다.", ctaLabel: "소셜클럽 상담 신청" },
  },

  /* ---------- 1:1 매칭 ---------- */
  {
    id: "matching.hero",
    page: "matching",
    label: "00 상단 소개",
    fields: [img("image", "사진"), t("overline", "작은 제목"), ta("title", "큰 제목", "hard"), ta("body", "설명", "soft"), t("cta1Label", "버튼 1 문구"), link("cta1Href", "버튼 1 링크"), t("cta2Label", "버튼 2 문구"), link("cta2Href", "버튼 2 링크")],
    defaults: {
      image: "/images/after-hours.jpg",
      overline: "A PRIVATE 1:1 INTRODUCTION BY RAUM",
      title: "서두르지 않고,\n한 사람을 제대로 만납니다.",
      body: "라움이 검증한 회원 중 한 분을 전담 컨시어지가 직접 소개합니다.\n만남은 라움의 라운지·다이닝·공연 공간에서 이루어지며, 실제로 만난 경우에만 1회로 셉니다.",
      cta1Label: "1:1 매칭 상담 신청", cta1Href: "/fit-check?track=matching",
      cta2Label: "진행 방식 보기", cta2Href: "#how",
    },
  },
  {
    id: "matching.verify",
    page: "matching",
    anchor: "#verify",
    label: "01 가입 심사 (아무나, 들어올 수 없습니다)",
    description: "1:1 매칭 페이지의 가입 심사 섹션. 소셜클럽 페이지의 같은 섹션은 「소셜클럽」 탭 → 05 가입 심사에서 따로 수정합니다.",
    fields: [t("label", "작은 제목"), ta("title", "제목", "hard"), ta("lead", "설명", "soft"), bool("visible", "표시")],
    lists: [{ key: "items", label: "확인 항목", itemLabel: "항목", fields: [{ key: "icon", label: "아이콘", type: "select", options: [{ value: "shield", label: "방패(신원)" }, { value: "briefcase", label: "서류가방(직업)" }, { value: "chat", label: "말풍선(인터뷰)" }, { value: "people", label: "사람들(커뮤니티)" }] }, t("title", "제목"), ta("body", "설명", "soft")], min: 1, max: 6 }],
    defaults: {
      label: "VERIFIED MEMBERS", title: "아무나,\n들어올 수 없습니다", lead: "가입 전 모든 회원의 신원·혼인 관계·직업·진정성을 확인합니다. 기준을 통과한 검증된 분들끼리만, 철저히 프라이빗하게 소개합니다.", visible: true,
      items: [
        { icon: "shield", title: "본인 · 혼인 관계 확인", body: "신분증과 혼인관계증명서로 실명·본인 명의, 법률상 배우자가 없음을 확인합니다." },
        { icon: "briefcase", title: "직업 확인", body: "재직 증명서, 사업자 등록 등 직업·사업 서류를 확인합니다." },
        { icon: "chat", title: "프로필 · 취향 인터뷰", body: "라움에서의 대면 인터뷰로 생활 방식, 취향, 바라는 관계를 듣고 커뮤니티 매너 서약을 받습니다." },
        { icon: "people", title: "활동으로 2차 검증", body: "서류로 끝나지 않습니다. 라움의 공간과 프로그램에 실제로 참여해 온 회원 중에서만 소개합니다." },
      ],
    },
  },
  {
    id: "matching.how",
    page: "matching",
    anchor: "#how",
    label: "02 진행 방식",
    fields: [t("label", "작은 제목"), ta("title", "제목", "hard"), ta("lead", "설명", "soft"), bool("visible", "표시")],
    lists: [{ key: "steps", label: "단계", itemLabel: "단계", fields: [t("title", "제목"), ta("body", "설명", "soft")], min: 2, max: 6 }],
    defaults: {
      label: "HOW IT WORKS", title: "상담에서 만남까지,\n네 단계로 진행됩니다", lead: "모든 단계는 전담 Relationship Concierge 가 함께합니다. 가입 승인 30일 안에 첫 제안, 3개월 안에 첫 만남을 주선합니다.", visible: true,
      steps: [
        { title: "상담 · 가입 심사", body: "라움에서 1시간 안팎의 대면 인터뷰. 가치관, 생활 방식, 바라는 관계와 필수 희망 조건을 깊이 듣고 가입 심사를 거칩니다." },
        { title: "제안", body: "검증된 회원 중 컨시어지가 직접 한 분을 이유와 함께 제안합니다. 프로필 열람과 거절은 횟수에 들어가지 않고, 거절은 제한이 없습니다." },
        { title: "라움에서의 만남", body: "라움의 라운지·다이닝·공연 공간에서 만납니다. 일정 조율은 컨시어지가 맡고, 실제로 만난 경우에만 1회로 셉니다. 두 번째 만남에는 Second Date Benefit 이 있습니다." },
        { title: "피드백 · 다음", body: "만남 후 양쪽의 이야기를 듣고 다음 제안에 반영합니다. 교제가 시작되면 멤버십을 최대 90일 홀딩할 수 있고, 이어지지 않아도 커뮤니티와 다음 제안으로 돌아옵니다." },
      ],
    },
  },
  {
    id: "matching.plans",
    page: "matching",
    anchor: "#plans",
    label: "03 멤버십 구성 (ACCESS · SIGNATURE · MERRY)",
    description: "결혼중개 멤버십 2종과 플래그십. 가입비·연회비는 비공개(대면 상담 안내)이므로 문구에 금액을 넣지 않습니다. 금액이 들어간 줄은 화면에서 자동으로 빠집니다.",
    fields: [t("label", "작은 제목"), ta("title", "제목", "hard"), ta("lead", "설명", "soft"), t("swipeHint", "모바일 스와이프 안내"), t("ctaSuffix", "카드 버튼 문구 뒷말", undefined, "멤버십 이름 뒤에 붙습니다. 예: 'ACCESS 상담 신청'"), t("merryCta", "MERRY 카드 버튼 문구"), t("extrasTitle", "확장 옵션 칸 제목"), ta("extras", "확장 옵션 (줄마다 하나)"), ta("note", "하단 안내", "soft"), bool("visible", "표시")],
    lists: [{ key: "items", label: "멤버십", itemLabel: "멤버십", fields: [t("name", "이름"), t("tag", "한 줄 태그"), ta("features", "포함 항목 (줄마다 하나)"), t("badge", "배지", undefined, "예: 주력"), bool("dark", "강조(다크 카드)")], min: 1, max: 4 }],
    defaults: {
      label: "MEMBERSHIP", swipeHint: "옆으로 밀어서 비교하기 →", ctaSuffix: "상담 신청", merryCta: "별도 상담 신청", extrasTitle: "필요한 만큼 추가", title: "깊이에 따라 고르는\n두 가지 멤버십", lead: "두 멤버십 모두 소셜클럽(회원 자격 · 행사 6회 · 초대권 2매)을 포함하고, 1:1 만남은 실제로 만난 경우에만 차감됩니다. 결혼을 목적으로 하는 분께는 RAUM MERRY 를 별도 심사로 안내합니다.", visible: true,
      items: [
        { name: "ACCESS", tag: "소셜클럽 + 1:1 만남 5회", features: "1:1 만남 5회 (실제 대면 시에만 차감)\n소셜클럽 전체 포함 (행사 6회 · 초대권 2매)\n분기 RAUM SOCIAL NIGHT · 연말 GRAND SOCIAL BALL\n라움 라운지·다이닝·공연 공간에서의 만남", badge: "", dark: false },
        { name: "SIGNATURE", tag: "소셜클럽 + 1:1 만남 10회 + RAUM SOLO", features: "1:1 만남 10회 (실제 대면 시에만 차감)\nRAUM SOLO 1기 포함 (기수제 로테이션, 연 6기)\n전담 Relationship Concierge\n소셜클럽 전체 + SOCIAL NIGHT · GRAND SOCIAL BALL\n60일 안에 ACCESS 에서 전환 시 차액만 납부", badge: "주력", dark: true },
        { name: "RAUM MERRY", tag: "결혼 목적 플래그십 · 별도 심사", features: "결혼을 목적으로 하는 전담 1:1\nRelationship Director 전담\n별도 신청·심사·계약\nRAUM ORIGIN · RAUM WEDDING 혜택 연결", badge: "", dark: false },
      ],
      extras: "추가 만남 (만남권 소진 후, 실제 대면 1회 단위)\nRAUM SOLO 추가 기수 (SIGNATURE 전용, 연 6기)\nPRIVATE CONNECTION 1:1 큐레이션 (별도 서면 약정)",
      note: "가입비와 연회비는 공개하지 않고 대면 상담에서 안내해 드립니다. 자동 갱신은 없으며 성사비·성혼사례금·정액 위약벌이 없고, 환불은 공정거래위원회 소비자분쟁해결기준을 그대로 따릅니다. Founding Member(선착순 100명)는 가입비가 면제됩니다.",
    },
  },
  {
    id: "matching.diff",
    page: "matching",
    anchor: "#why",
    label: "05 다른 점 (WHY RSC)",
    fields: [t("label", "작은 제목"), ta("title", "제목", "hard"), bool("visible", "표시")],
    lists: [{ key: "items", label: "카드", itemLabel: "카드", fields: [t("label", "라벨"), t("title", "제목"), ta("body", "설명", "soft")], min: 1, max: 6 }],
    defaults: {
      label: "WHY RSC", title: "결혼정보회사와도,\n데이팅 앱과도 다릅니다", visible: true,
      items: [
        { label: "01 VERIFIED PEOPLE", title: "서류와 활동으로 두 번 검증된 사람", body: "가입 심사(신분·혼인 관계·재직)를 거친 뒤, 라움의 커뮤니티에 실제로 참여해 온 회원 중에서만 소개합니다." },
        { label: "02 BEAUTIFUL SPACE", title: "만남 자체가 라움에서", body: "동네 카페가 아니라 라움아트센터의 라운지·다이닝·공연 공간에서 만납니다. 두 번째 만남에는 Second Date Benefit 이 따릅니다." },
        { label: "03 FAIR CONTRACT", title: "분쟁 없는 계약", body: "프로필만 받아도 횟수가 줄어드는 구조가 아닙니다. 실제로 만난 경우에만 차감, 거절 무제한, 성혼사례금 없음, 공정위 기준 환불." },
        { label: "04 NEVER ALONE", title: "관계가 안 돼도 끝나지 않습니다", body: "만남이 이어지지 않아도 커뮤니티와 다음 제안으로 돌아옵니다. 매칭의 실패가 회원 경험의 실패가 되지 않습니다." },
      ],
    },
  },
  {
    id: "matching.who",
    page: "matching",
    anchor: "#who",
    label: "06 이런 분께",
    fields: [t("label", "작은 제목"), ta("title", "제목", "hard"), ta("points", "항목 (줄마다 하나)"), t("ctaLabel", "버튼 문구"), img("image", "사진"), bool("visible", "표시")],
    defaults: {
      label: "WHO IT'S FOR", title: "이런 분께 맞습니다", ctaLabel: "1:1 매칭 상담 신청", visible: true,
      image: "/images/about.jpg",
      points: "결혼이나 진지한 교제를 염두에 두고 있는 25~45세 싱글\n결혼정보회사에서 '만남 몇 회'를 사 봤지만 관계로 이어지지 않았던 분\n앱의 불특정 다수보다 검증된 커뮤니티 안의 만남을 원하는 분\n바쁜 일상 속에서 소개와 일정 조율을 맡기고, 좋은 공간에서 만나고 싶은 분",
    },
  },
  {
    id: "matching.faq",
    page: "matching",
    anchor: "#faq",
    label: "07 자주 묻는 질문",
    fields: [t("label", "작은 제목"), ta("title", "제목", "hard"), ta("lead", "설명", "soft"), bool("visible", "표시")],
    lists: [{ key: "items", label: "질문", itemLabel: "질문", fields: [t("q", "질문"), ta("a", "답변", "hard")], min: 1, max: 20 }],
    defaults: {
      label: "FAQ", title: "1:1 매칭, 자주 묻는 질문", lead: "더 궁금한 점은 상담에서 편하게 물어보세요.", visible: true,
      items: [
        { q: "소셜클럽과 1:1 매칭은 어떻게 다른가요?", a: "소셜클럽은 특정 상대를 소개하지 않는 커뮤니티 멤버십(회원 자격 · 행사 6회 · 초대권 2매)입니다. 1:1 매칭은 여기에 전담 컨시어지의 1:1 소개(ACCESS 5회 · SIGNATURE 10회)와 SOCIAL NIGHT · GRAND SOCIAL BALL, SIGNATURE 는 RAUM SOLO 1기가 더해진 결혼중개 멤버십입니다. 소셜클럽으로 시작한 뒤 연회비만 더해 전환할 수 있습니다." },
        { q: "만남 횟수는 언제 차감되나요?", a: "실제로 만난 경우에만 1회로 셉니다. 프로필 제안을 받거나 거절한 것은 횟수에 들어가지 않고 거절 횟수에도 제한이 없습니다. 상대의 노쇼나 회사 사정으로 취소된 만남도 차감되지 않습니다." },
        { q: "첫 만남까지 얼마나 걸리나요?", a: "가입 승인 후 30일 안에 첫 제안을 드리고, 3개월 안에 첫 만남을 주선합니다. 지키지 못하면 회사 책임으로 해지와 배상이 이루어집니다." },
        { q: "교제가 시작되면 멤버십은 어떻게 되나요?", a: "최대 90일(30일씩 3회)까지 홀딩해 멤버십을 멈춰 둘 수 있고, 원하면 해지할 수도 있습니다. 성사비나 성혼사례금은 없습니다." },
        { q: "환불은 어떻게 되나요?", a: "공정거래위원회 소비자분쟁해결기준을 그대로 적용합니다. 프로필 제안 전, 만남 일자 확정 후, 1회 이상 만남 후 등 시점별 환불 비율이 계약서에 표로 적혀 있고, 정액 위약벌은 없습니다." },
        { q: "결혼을 전제로 해야 하나요?", a: "아니요. 진지한 교제를 바라는 분이면 충분합니다. 결혼을 목적으로 하는 분께는 별도 신청과 심사로 진행하는 플래그십 RAUM MERRY 를 안내드립니다." },
      ],
    },
  },

  {
    id: "matching.cta",
    page: "matching",
    label: "08 하단 상담 띠 (검은 박스)",
    fields: [t("title", "제목"), ta("body", "설명", "soft"), t("ctaLabel", "버튼 문구")],
    defaults: { title: "1:1 매칭, 상담으로 시작해 보세요", body: "이름과 연락처만 남기면 담당자가 직접 연락드립니다. 가입이 아닌 상담 신청이며, 비용은 없습니다.", ctaLabel: "1:1 매칭 상담 신청" },
  },

  /* ---------- 상담 신청 (/fit-check) ---------- */
  {
    id: "apply.form",
    page: "apply",
    label: "상담 신청 양식",
    description: "간단 상담 신청 화면(/fit-check)의 모든 문구. 「관심 있는 방식」 칩의 이름을 바꿔도 어드민 상담 목록에는 소셜클럽 · 1:1 매칭 · 상담 후 결정으로 저장됩니다. 개인정보 동의 문구는 개인정보처리방침과 내용이 맞아야 합니다.",
    fields: [
      t("titleDefault", "제목 (기본)"), t("titleSocial", "제목 (소셜클럽에서 들어왔을 때)"), t("titleMatching", "제목 (1:1 매칭에서 들어왔을 때)"), ta("note", "제목 아래 안내", "soft"),
      t("trackLegend", "관심 방식 항목 이름"), t("chipSocial", "칩 1: 소셜클럽"), t("chipMatching", "칩 2: 1:1 매칭"), t("chipUndecided", "칩 3: 상담 후 결정"),
      t("helpSocial", "칩 1 선택 시 한 줄 설명"), t("helpMatching", "칩 2 선택 시 한 줄 설명"), t("helpUndecided", "칩 3 선택 시 한 줄 설명"),
      t("nameLabel", "이름 항목 이름"), t("namePlaceholder", "이름 입력 안내"), t("phoneLabel", "휴대폰 항목 이름"), t("phoneHelp", "휴대폰 입력 아래 안내"),
      t("consentTitle", "동의 체크 문구"), t("consentCollect", "동의: 수집 항목"), t("consentPurpose", "동의: 이용 목적"), t("consentRetention", "동의: 보관 기간"), t("consentRefuse", "동의: 거부 시"),
      ta("consentMore", "동의 아래 안내", undefined, "{privacy} 자리에 개인정보처리방침 링크, {terms} 자리에 이용약관 링크가 들어갑니다"),
      t("submitLabel", "신청 버튼 문구"), t("submittingLabel", "신청 중 버튼 문구"), ta("submitNote", "버튼 아래 안내", "soft"),
      t("doneTitle", "접수 완료 제목"), ta("doneBody", "접수 완료 안내", "soft"), t("doneHome", "접수 완료 버튼 문구"), t("closeLabel", "오른쪽 위 닫기 문구"),
    ],
    defaults: {
      titleDefault: "RSC 상담 신청", titleSocial: "소셜클럽 상담 신청", titleMatching: "1:1 매칭 상담 신청", note: "남겨주신 연락처로 담당자가 직접 연락드립니다.",
      trackLegend: "관심 있는 방식", chipSocial: "소셜클럽", chipMatching: "1:1 매칭", chipUndecided: "상담 후 결정",
      helpSocial: "함께 경험하며 자연스럽게 가까워지는 커뮤니티.", helpMatching: "전담 컨시어지가 검증된 회원 중 한 분을 직접 소개합니다.", helpUndecided: "어느 쪽이 맞을지 모르겠다면 상담에서 함께 정해 드립니다.",
      nameLabel: "이름", namePlaceholder: "이름을 입력해 주세요.", phoneLabel: "휴대폰 번호", phoneHelp: "숫자만 입력하면 하이픈이 자동으로 붙습니다.",
      consentTitle: "개인정보 수집·이용 동의", consentCollect: "이름, 휴대폰 번호(필수) · 광고 링크로 들어온 경우 광고 유입 정보(utm 값)", consentPurpose: "신청하신 가입 상담의 진행과 일정 조율, 문의 응대", consentRetention: "접수일로부터 최대 180일, 이후 자동 삭제 (요청 시 그 전에도 삭제)", consentRefuse: "필수 항목 동의를 거부하면 상담 신청이 접수되지 않습니다.",
      consentMore: "자세한 내용은 {privacy}에서 확인하실 수 있습니다. 사이트 이용 조건은 {terms}을 참고해 주세요.",
      submitLabel: "상담 신청하기", submittingLabel: "접수 중…", submitNote: "신청은 회원 가입이 아니며, 담당자가 연락드린 뒤 상담이 진행됩니다.",
      doneTitle: "신청이 접수되었습니다", doneBody: "담당자가 남겨주신 연락처로 순차적으로 연락드립니다. 신청 취소나 문의는 전화(02-6925-4786) 또는 이메일로 알려 주세요.", doneHome: "홈으로 돌아가기", closeLabel: "닫기 ✕",
    },
  },

  /* ---------- 소식 (/news) ---------- */
  {
    id: "news.page",
    page: "news",
    label: "소식 목록 · 상세 문구",
    description: "소식 페이지의 제목과 설명은 「SEO」 → 페이지별 설정(소식)에서, 글은 「소식 게시판」에서 관리합니다. 여기서는 그 밖의 고정 문구만 바꿉니다.",
    fields: [t("eyebrow", "제목 위 작은 영문"), ta("emptyText", "글이 없는 달 안내", undefined, "{y} 자리에 연도, {m} 자리에 월이 들어갑니다"), t("backLabel", "상세 글 하단 「목록으로」 문구"), t("ctaLabel", "상세 글 하단 상담 버튼 문구")],
    defaults: { eyebrow: "NEWS", emptyText: "{y}년 {m}월에 올라온 소식이 없습니다. 다른 달을 선택해 보세요.", backLabel: "← 소식 목록", ctaLabel: "RSC 상담 신청하기" },
  },

  /* ---------- 제휴문의 (/partner) ---------- */
  {
    id: "partner.page",
    page: "partner",
    label: "제휴문의 페이지",
    description: "푸터 「제휴문의」 열에서 들어오는 /partner 페이지의 문구입니다. 담당 전화·이메일은 「브랜드 · 연락처」의 제휴 담당 전화·이메일을 씁니다. 페이지 제목·검색 설명은 「SEO」 → 페이지별 설정(제휴문의).",
    fields: [
      t("eyebrow", "제목 위 작은 영문"),
      t("title", "제목", "soft"),
      ta("body", "소개 문단", "soft"),
      t("tracksTitle", "협업 분야 제목"),
      t("contactTitle", "연락처 제목"),
      t("partnerCardTitle", "제휴 담당 카드 제목"),
      ta("partnerCardBody", "제휴 담당 카드 설명", "soft"),
      t("partnerCtaLabel", "제휴 담당 카드 버튼 (이메일 작성)"),
      t("mailSubject", "제안 메일 제목 자동 입력", undefined, "버튼을 누르면 메일 제목에 미리 들어가는 문구"),
      t("generalCardTitle", "일반 문의 카드 제목"),
      ta("generalCardBody", "일반 문의 카드 설명", "soft"),
      t("generalCtaLabel", "일반 문의 카드 버튼 (상담 신청)"),
      t("guideTitle", "제안서 안내 제목"),
      ta("guideItems", "제안서에 담을 내용", "hard", "줄마다 하나"),
      ta("guideNote", "제안서 안내 맺음말", "soft"),
    ],
    lists: [
      {
        key: "tracks", label: "협업 분야", itemLabel: "분야", min: 1, max: 6,
        fields: [t("title", "분야 이름"), ta("body", "설명", "soft"), t("examples", "예시 (가운뎃점으로 구분)")],
      },
    ],
    defaults: {
      eyebrow: "PARTNERSHIP",
      title: "라움소셜클럽과 함께할\n파트너를 찾습니다",
      body: "라움소셜클럽은 라움이 검증한 싱글 멤버가 라움아트센터의 공간에서 문화·미식·운동·회복을 함께 경험하는 커뮤니티입니다.\n멤버의 일상을 더 특별하게 만들어 줄 브랜드·기업·공간과의 협업을 환영합니다.",
      tracksTitle: "이런 협업을 기다립니다",
      contactTitle: "제휴 담당에게 연락하기",
      partnerCardTitle: "제휴 · 협업 제안",
      partnerCardBody: "브랜드 협업, 기업 제휴, 공간·행사 협업 제안은 제휴 담당에게 직접 보내 주세요.\n검토 후 담당자가 연락드립니다.",
      partnerCtaLabel: "이메일로 제안하기",
      mailSubject: "[제휴 제안] 라움소셜클럽 협업 문의",
      generalCardTitle: "멤버십 · 일반 문의",
      generalCardBody: "소셜클럽과 1:1 매칭 가입이 궁금하시면 상담을 신청해 주세요.\n이름과 연락처만 남기시면 담당자가 직접 연락드립니다.",
      generalCtaLabel: "RSC 상담 신청",
      guideTitle: "제안서에 이런 내용을 담아 주세요",
      guideItems: "회사 · 브랜드 소개와 공식 채널\n제안하는 협업 내용과 기대하는 효과\n희망 시기 · 규모 · 예산 범위\n담당자 이름과 연락처",
      guideNote: "첨부 파일은 이메일로 함께 보내 주시면 됩니다. 제안 내용은 검토 목적으로만 쓰고 외부에 공개하지 않습니다.",
      tracks: [
        { title: "브랜드 · 콘텐츠 협업", body: "월 1회 열리는 RSC TASTE SOCIAL 프로그램(아트, 와인, 웰니스, 러닝, 토크, 다이닝)에 브랜드의 제품과 경험을 더합니다. 검증된 멤버에게 브랜드를 자연스럽게 소개할 수 있습니다.", examples: "와인·F&B 페어링 · 웰니스·뷰티 체험 · 아트·공연 초청 · 멤버 전용 혜택" },
        { title: "기업 · 단체 제휴", body: "임직원 복지로 소셜클럽 멤버십과 1:1 매칭 상담을 제공합니다. 기업 맞춤 소셜 프로그램과 단체 행사도 함께 기획합니다.", examples: "임직원 복지 멤버십 · 기업 전용 소셜 행사 · 사내 상담 데이" },
        { title: "공간 · 행사 협업", body: "라움아트센터와 라움의 공간에서 열리는 행사를 함께 만들거나, 파트너의 공간에서 RSC 행사를 엽니다. 서로의 공간과 멤버를 잇는 협업입니다.", examples: "공동 행사 기획 · 공간 교류 · 팝업·전시" },
      ],
    },
  },

  /* ---------- 가격 ---------- */
  {
    id: "pricing.hero",
    page: "pricing",
    label: "상단 소개",
    fields: [t("label", "작은 제목"), ta("title", "제목", "hard"), ta("body", "설명", "hard")],
    defaults: { label: "MEMBERSHIP & PRICING", title: "소셜클럽에서 시작해\n1:1 매칭으로 이어지는 멤버십", body: "가입비 하나로 소셜클럽 회원이 되고, 연회비를 더하면 1:1 만남권이 포함된 ACCESS · SIGNATURE 로 전환됩니다. \n모든 금액은 VAT 포함 총액이며 자동 갱신은 없습니다." },
  },
  {
    id: "pricing.plans",
    page: "pricing",
    label: "01 멤버십 카드",
    fields: [t("label", "섹션 라벨")],
    lists: [{ key: "items", label: "멤버십", itemLabel: "멤버십", fields: [t("name", "이름"), { key: "price", label: "가격(원)", type: "number" }, t("unit", "기간·환산 문구"), ta("desc", "설명", "hard"), ta("features", "포함 항목 (줄마다 하나)"), ta("note", "하단 안내", "hard"), bool("dark", "강조(다크 카드)"), t("badge", "배지 문구", undefined, "예: RECOMMENDED")], min: 1, max: 4 }],
    defaults: {
      label: "01 · MEMBERSHIP",
      items: [
        { name: "RSC PREVIEW", price: 165000, unit: "1회 · 생애 최초 1회 한정", desc: "가입 전, RSC의 공간·회원·프로그램을 \n실제 행사로 먼저 경험합니다.", features: "RSC TASTE SOCIAL 1회\n호스트 온보딩 · 공간 안내\n행사 후 멤버십 상담\n행사 당일 주차 3시간", note: "7일 이내 가입 시\n가입비에 165,000원 전액 충당", dark: false, badge: "" },
        { name: "SOCIAL CLUB", price: 1000000, unit: "가입비 · 1년", desc: "라움이 검증한 싱글 커뮤니티. 특정 상대를 소개하지 않는 \n멤버십으로, 월 1회 TASTE SOCIAL 에서 반복해 만납니다.", features: "RSC 회원 자격 1년\nRSC TASTE SOCIAL 6회 참여권 (7회차부터 회당 110,000원)\n지인 초대권 2매\n연회비만 더해 ACCESS · SIGNATURE 전환", note: "결혼중개 아님 · 14일 이내 전액 환불\nFounding Member 100명 가입비 면제", dark: false, badge: "" },
        { name: "RSC ACCESS", price: 3300000, unit: "연회비 · 가입비 1,000,000원 별도 (첫해 4,300,000원)", desc: "소셜클럽에 1:1 만남 5회를 더한 \n결혼중개 멤버십입니다.", features: "1:1 만남 5회 (실제 대면 시에만 차감)\n소셜클럽 전체 포함 (행사 6회 · 초대권 2매)\n3·6·9월 RAUM SOCIAL NIGHT · 11월 GRAND SOCIAL BALL\n라움 라운지·다이닝·공연 공간에서의 만남\n60일 내 SIGNATURE 전환 시 차액 5,500,000원", note: "Founding Member 100명 가입비 면제", dark: false, badge: "" },
        { name: "RSC SIGNATURE", price: 8800000, unit: "연회비 · 가입비 1,000,000원 별도 (첫해 9,800,000원)", desc: "소셜클럽 + 1:1 만남 10회 + RAUM SOLO 1기 + 전담 컨시어지. 결정사 노블 등급 가격대에 공간·커뮤니티·반복 만남까지.", features: "1:1 만남 10회 (실제 대면 시에만 차감)\nRAUM SOLO 1기 포함 · 추가 기수 660,000원\n전담 Relationship Concierge\n소셜클럽 전체 + SOCIAL NIGHT · GRAND SOCIAL BALL\n거절 무제한 · 성혼사례금 없음", note: "Founding Member 100명 가입비 면제", dark: true, badge: "RECOMMENDED" },
      ],
    },
  },
  {
    id: "pricing.programs",
    page: "pricing",
    label: "02 관계 프로그램",
    fields: [t("label", "섹션 라벨"), t("title", "제목"), ta("lead", "설명")],
    lists: [{ key: "rows", label: "프로그램 표", itemLabel: "행", fields: [t("name", "프로그램"), t("sub", "부제"), t("price", "가격"), ta("priceSub", "가격 보조", "hard"), t("unit", "단위"), ta("desc", "내용")], min: 1, max: 12 }],
    defaults: {
      label: "02 · RELATIONSHIP PROGRAMS",
      title: "관계 확장 프로그램",
      lead: "멤버십에 필요한 만큼 더하는 프로그램입니다. 1:1 만남은 실제 대면이 이루어진 경우에만 1회 차감되며(프로필 열람·거절은 차감하지 않음), 교제·성혼을 보장하지 않고 성사비·성혼사례금은 없습니다.",
      rows: [
        { name: "추가 만남", sub: "ACCESS · SIGNATURE 만남권 소진 후", price: "550,000원", priceSub: "", unit: "실제 대면 1회", desc: "전담 컨시어지의 추가 1:1 소개. 라움의 공간에서 만나고, 실제 대면 시에만 차감" },
        { name: "RAUM SOLO 추가 기수", sub: "SIGNATURE 전용 · 연 6기 (1·3·6·8·10·12월)", price: "660,000원", priceSub: "SIGNATURE 첫 기수 포함", unit: "1기 · 6회", desc: "오리엔테이션 → 오프닝 나이트 → 와인 → 웰니스 → 살롱 → 애프터아워즈 → SOLO BALL (Private Choice)" },
        { name: "PRIVATE CONNECTION", sub: "1:1 큐레이션 · 별도 서면 약정", price: "550,000~2,200,000원", priceSub: "", unit: "실제 대면 1회", desc: "심층 인터뷰와 우선 큐레이션, 고난도 조건 설계, 전담 피드백까지 깊이에 따라 설계" },
        { name: "RAUM MERRY", sub: "결혼 목적 플래그십", price: "33,000,000원부터", priceSub: "", unit: "12개월 · 별도 심사", desc: "Relationship Director 전담. 별도 신청·심사·계약, 탐색 난이도에 따른 맞춤 견적. RAUM ORIGIN · RAUM WEDDING 혜택 연결" },
      ],
    },
  },
  {
    id: "pricing.path",
    page: "pricing",
    label: "03 YOUR PATH",
    fields: [t("label", "섹션 라벨"), t("title", "제목")],
    lists: [
      { key: "steps", label: "3단계", itemLabel: "단계", fields: [t("s", "단계 라벨"), t("t", "이름"), t("d", "설명")], min: 1, max: 5 },
      { key: "rows", label: "선택안 표", itemLabel: "행", fields: [t("a", "선택안"), t("b", "결제액"), t("c", "포함 구성"), t("d", "적합 고객"), bool("highlight", "강조")], min: 1, max: 10 },
    ],
    defaults: {
      label: "03 · YOUR PATH",
      title: "어디서 시작하든, 다음 단계가 있습니다",
      steps: [
        { s: "STEP 1 · 경험", t: "PREVIEW", d: "가입 전 행사 1회로 RSC를 확인합니다. 7일 내 가입 시 가입비에 충당." },
        { s: "STEP 2 · 커뮤니티", t: "SOCIAL CLUB", d: "가입비로 1년 회원이 되어 월 1회 TASTE SOCIAL 에서 반복해 마주칩니다." },
        { s: "STEP 3 · 관계", t: "ACCESS · SIGNATURE", d: "연회비만 더해 1:1 만남권(5회 · 10회)과 RAUM SOLO 로 확장합니다." },
      ],
      rows: [
        { a: "SOCIAL CLUB", b: "1,000,000원", c: "회원 자격 1년 + 행사 6회 + 초대권 2매", d: "커뮤니티 중심", highlight: false },
        { a: "ACCESS", b: "첫해 4,300,000원", c: "소셜클럽 + 1:1 만남 5회 + SOCIAL NIGHT · GRAND BALL", d: "관계 탐색 시작", highlight: false },
        { a: "SIGNATURE", b: "첫해 9,800,000원", c: "소셜클럽 + 1:1 만남 10회 + RAUM SOLO 1기 + 전담 컨시어지", d: "대표 선택", highlight: true },
        { a: "RAUM MERRY", b: "33,000,000원부터", c: "결혼 목적 전담 1:1 · 별도 심사", d: "결혼을 목적으로", highlight: false },
      ],
    },
  },
  {
    id: "pricing.policy",
    page: "pricing",
    label: "04 전환 · 운영 기준",
    fields: [t("label", "섹션 라벨"), t("title", "제목"), t("leftTitle", "왼쪽 표 제목"), t("rightTitle", "오른쪽 표 제목"), ta("note", "하단 안내")],
    lists: [
      { key: "conversions", label: "전환 시 차감 기준", itemLabel: "행", fields: [t("k", "항목"), t("v", "내용")], min: 0, max: 12 },
      { key: "rules", label: "운영 원칙", itemLabel: "행", fields: [t("k", "항목"), t("v", "내용")], min: 0, max: 12 },
    ],
    defaults: {
      label: "04 · UPGRADE & POLICY",
      title: "전환 · 운영 기준",
      leftTitle: "전환 시 차감 기준",
      rightTitle: "운영 원칙",
      conversions: [
        { k: "PREVIEW → ACCESS·SIGNATURE", v: "7일 이내 165,000원 전액 차감" },
        { k: "ACCESS → SIGNATURE", v: "60일 이내 전액 차감 · 이후 잔여기간 비례 차감" },
        { k: "SOLO → SIGNATURE", v: "시즌 시작 14일 이내 SOLO 결제액 차감" },
        { k: "CONNECTION → SIGNATURE", v: "30일 이내 미사용 SELECT 결제액 전액 차감" },
        { k: "SIGNATURE → MERRY", v: "잔여 횟수·기간을 MERRY 계약에 반영" },
      ],
      rules: [
        { k: "가격 표시", v: "VAT 포함 총액 · 공개 할인 미운영 (Founding Member 100명 한정 혜택가 제외)" },
        { k: "분납", v: "ACCESS 최대 2회 · SIGNATURE 최대 3회 · MERRY 별도 협의" },
        { k: "갱신", v: "자동 갱신 없음 · 만료 30일 전 안내 후 재결제" },
        { k: "홀드", v: "계약기간 중 1회 · 30~90일 · 객관적 사유 시" },
        { k: "양도·재판매", v: "불가" },
        { k: "가입 자격", v: "만 19세 이상 · 법률상 배우자 없음 · 상담·적합성 심사" },
      ],
      note: "환불은 상품별 산정 기준에 따르며, 관계 법령과 소비자분쟁해결기준 중 회원에게 유리한 기준을 우선 적용합니다. 상세 환불·노쇼·홀드 기준은 상담 시 안내드립니다.",
    },
  },
  {
    id: "pricing.cta",
    page: "pricing",
    label: "하단 CTA",
    fields: [t("label", "작은 제목"), t("title", "제목"), ta("body", "설명", "hard"), t("cta1Label", "버튼 1 문구"), link("cta1Href", "버튼 1 링크"), t("cta2Label", "버튼 2 문구"), link("cta2Href", "버튼 2 링크")],
    defaults: { label: "START WITH A CONVERSATION", title: "어떤 멤버십이 맞을지, 함께 찾아드립니다", body: "상담 후 PREVIEW 행사로 먼저 경험해보세요. \n가입을 결정하시면 PREVIEW 비용은 전액 차감됩니다.", cta1Label: "RSC 상담 신청하기", cta1Href: "/fit-check", cta2Label: "인스타그램", cta2Href: "https://www.instagram.com/raum_socialclub/" },
  },

  /* ---------- 혜택 ---------- */
  {
    id: "benefits.hero",
    page: "benefits",
    label: "상단 소개",
    fields: [t("label", "작은 제목"), t("title", "제목"), ta("body", "설명", "hard"), t("tableTitle", "표 제목"), t("leadNote", "리드 모드 하단 문구", undefined, "리드 모드에서 가격 안내 버튼 대신 보이는 문구")],
    defaults: { label: "RSC MEMBER BENEFITS", title: "정회원 혜택 안내", body: "“아름다운 공간에서, 서로의 특별함을 발견하는 곳”\n라움이 검증한 멤버가 모이는, 싱글 라이프스타일 커뮤니티", tableTitle: "회원 혜택 구성", leadNote: "멤버십 혜택은 상담에서 자세히 안내해 드립니다" },
  },
  {
    id: "benefits.rows",
    page: "benefits",
    label: "혜택 목록",
    description: "같은 '구분' 값끼리 한 묶음으로 표시됩니다. 순서대로 번호가 붙습니다.",
    fields: [],
    lists: [{ key: "items", label: "혜택", itemLabel: "혜택", fields: [t("group", "구분"), t("title", "혜택 이름"), t("badge", "배지"), ta("lines", "설명 (줄마다 하나)"), ta("right", "오른쪽 요약", "hard"), t("rightStrong", "오른쪽 강조 금액", undefined, "예: 160,000원 (없으면 비움)")], min: 1, max: 30 }],
    defaults: {
      items: [
        { group: "이벤트 · 커뮤니티", title: "카테고리 행사 우선참여", badge: "무료 · 우선권", lines: "· ART WALK, TASTE TABLE 등 6개 카테고리 행사 참가비 무료\n· 비회원보다 먼저 예약 가능", right: "회당 평균\n{{strong}} 상당 절감", rightStrong: "160,000원" },
        { group: "이벤트 · 커뮤니티", title: "지인 초대권", badge: "연 8회", lines: "· 분기당 2매, 연 8매 제공\n· 초대받은 지인도 참가비 없이 동행", right: "연 8매\n분기당 2매 제공", rightStrong: "" },
        { group: "스페이스", title: "전용 미팅룸 · 세미나룸", badge: "회원 전용 예약", lines: "· 프라이빗 미팅룸 2개, 세미나룸 2개\n· 사용한 시간만큼만 별도 결제", right: "미팅룸 5만원/h\n세미나룸 10만원/h", rightStrong: "" },
        { group: "스페이스", title: "RSC 라운지", badge: "무료 제공", lines: "· 행사 전후, 미팅 사이 자유롭게 이용\n· 물 · 티 · 커피 무료 제공", right: "상시\n무료 이용", rightStrong: "" },
        { group: "스페이스", title: "평일 무료주차", badge: "평일 1일 1회", lines: "· 평일 1일 1회, 3시간까지 주차료 무료", right: "1일 최대\n{{strong}} 상당 절감", rightStrong: "54,000원" },
        { group: "스페이스", title: "라움 아트센터 대관", badge: "회원 우선", lines: "· 브리제홀, 마제스틱볼룸 등 7개 공간 협의\n· 개인 행사부터 소셜 파티까지 폭넓게 활용", right: "대관료\n별도 문의", rightStrong: "" },
        { group: "파트너 혜택", title: "브런치카페 할인", badge: "할인 제공", lines: "· 지하 1층 브런치 베이커리 카페", right: "회원 할인가\n적용", rightStrong: "" },
        { group: "파트너 혜택", title: "라움 제휴 브랜드 이용", badge: "등록 할인", lines: "· 호텔, 병원, 웰니스센터 등 제휴 브랜드 혜택 이용", right: "이용 시\n할인 제공", rightStrong: "" },
      ],
    },
  },
  {
    id: "benefits.cta",
    page: "benefits",
    label: "하단 CTA",
    fields: [t("label", "작은 제목"), t("title", "제목"), t("cta1Label", "버튼 1 문구"), link("cta1Href", "버튼 1 링크"), t("cta2Label", "버튼 2 문구"), link("cta2Href", "버튼 2 링크")],
    defaults: { label: "RAUM SOCIAL CLUB", title: "멤버십 가격과 혜택을 함께 확인해보세요", cta1Label: "멤버십 가격 안내", cta1Href: "/pricing", cta2Label: "RSC 상담 신청하기", cta2Href: "/fit-check" },
  },

  /* ---------- 약관 (본문은 lib/legal/content.ts 기본값) ---------- */
  ...(["terms", "privacy", "refund"] as const).map((k) => ({
    id: `legal.${k}`,
    page: "legal" as const,
    label: { terms: "이용약관", privacy: "개인정보처리방침", refund: "환불규정" }[k],
    description: "자리 문구 배너는 '자리 문구' 스위치를 끄면 사라집니다.",
    fields: [t("title", "제목"), t("updated", "시행일"), bool("placeholder", "자리 문구 배너 표시")],
    lists: [{ key: "sections", label: "조항", itemLabel: "조", fields: [t("title", "조 제목"), ta("body", "내용 (줄마다 한 항)")], min: 1, max: 40 }],
    defaults: { title: { terms: "RAUM SOCIAL CLUB 이용약관", privacy: "개인정보처리방침", refund: "취소 · 환불 규정" }[k], updated: "2026년 10월 1일", placeholder: k === "refund", sections: [] },
  })),
];

DOCS.push(...SETTINGS_DOCS, ...SEO_DOCS);
export const DOC_BY_ID = new Map(DOCS.map((d) => [d.id, d]));
export const PAGES: { key: DocDef["page"]; label: string; preview: string }[] = [
  { key: "global", label: "브랜드 · 메뉴 · 테마", preview: "/" },
  { key: "home", label: "메인 페이지", preview: "/" },
  { key: "social", label: "소셜클럽", preview: "/social" },
  { key: "matching", label: "1:1 매칭", preview: "/matching" },
  { key: "apply", label: "상담 신청", preview: "/fit-check" },
  { key: "news", label: "소식", preview: "/news" },
  { key: "partner", label: "제휴문의", preview: "/partner" },
  { key: "pricing", label: "가격 안내 (리드 모드에선 숨김)", preview: "/pricing" },
  { key: "benefits", label: "혜택 안내", preview: "/benefits" },
  { key: "legal", label: "약관", preview: "/terms" },
];
