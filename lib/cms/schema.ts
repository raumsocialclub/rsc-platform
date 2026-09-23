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
  page: "global" | "home" | "pricing" | "benefits" | "legal" | "settings" | "seo";
  label: string;
  description?: string;
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
      t("copyright", "저작권 표기"),
    ],
    defaults: {
      siteName: "RAUM SOCIAL CLUB",
      metaDescription: "라움이 검증한 멤버가 모이는 싱글 라이프스타일 커뮤니티",
      logoEmblem: "/images/logo-emblem.png",
      logoText: "/images/logo-text-nav.png",
      ctaLabel: "RSC 상담 신청",
      ctaHref: "/fit-check",
      footerHeadline: "아름다운 공간에서,\n서로의 특별함을 발견하는 곳.",
      address: "서울특별시 강남구 언주로 564\n(역삼동 680-1)",
      phone: "02-538-3366",
      email: "support@theraum.co.kr",
      instagramHandle: "raum_socialclub",
      instagramUrl: "https://www.instagram.com/raum_socialclub/",
      copyright: "© 2026 RAUM SOCIAL CLUB",
    },
  },
  {
    id: "global.theme",
    page: "global",
    label: "색상 테마",
    description: "Design.md 토큰. 바꾸면 사이트 전체에 즉시 반영됩니다.",
    fields: [
      color("cream", "배경 (cream)"),
      color("ink", "본문 글자 (ink)"),
      color("brown", "브랜드 브라운 (버튼)"),
      color("brownHover", "브라운 호버 · 강조"),
      color("gold", "골드 (다크 섹션 강조)"),
      color("goldHover", "골드 호버"),
      color("sand", "교차 섹션 배경 (sand)"),
      color("sandDeep", "표 헤더 배경"),
    ],
    defaults: { cream: "#f7f3ec", ink: "#211e19", brown: "#5a3d24", brownHover: "#9c6b3e", gold: "#e2b478", goldHover: "#f0c98e", sand: "#efe9de", sandDeep: "#e9e3d6" },
  },

  /* ---------- 홈 ---------- */
  {
    id: "home.hero",
    page: "home",
    label: "히어로",
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
    page: "home",
    label: "02 포지셔닝",
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
    label: "03 브랜드 약속",
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
    page: "home",
    label: "04 RSC SOCIAL 프로그램",
    fields: [bool("visible", "표시"), t("label", "섹션 라벨"), ta("title", "제목", "hard"), ta("lead", "설명", "soft")],
    lists: [{ key: "items", label: "프로그램 카드", itemLabel: "카드", fields: [img("image", "사진"), t("cat", "카테고리"), t("title", "이름"), ta("desc", "설명", "soft"), t("filter", "사진 보정(CSS filter)", undefined, "예: brightness(0.97) saturate(0.94)")], min: 1, max: 12 }],
    defaults: {
      visible: true,
      label: "04  /  RSC SOCIAL — EVERYDAY",
      title: "RSC를 일상적으로 찾게 만드는\n취향 프로그램",
      lead: "연애를 앞세우지 않습니다.\n좋아하는 것을 함께 경험하다 보면 자연스럽게 사람을 알게 됩니다.",
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
    page: "home",
    label: "05 MONTHLY & SEASON",
    fields: [bool("visible", "표시"), t("label", "섹션 라벨")],
    lists: [{ key: "cards", label: "카드", itemLabel: "카드", fields: [img("image", "사진"), t("label", "라벨"), t("title", "이름"), ta("body", "설명", "soft"), t("filter", "사진 보정(CSS filter)")], min: 1, max: 4 }],
    defaults: {
      visible: true,
      label: "05  /  MONTHLY & SEASON",
      cards: [
        { image: "/images/social-night.jpg", label: "MONTHLY", title: "RAUM SOCIAL NIGHT", body: "매월 한 번 열리는 RSC 대표 싱글 소셜. 공연, 다이닝, 와인, 음악 안에서\n자연스럽게 사람을 만납니다.", filter: "brightness(1.1) saturate(0.94)" },
        { image: "/images/raum-solo.jpg", label: "QUARTERLY · FLAGSHIP", title: "RAUM SOLO", body: "한 번의 소개팅이 아닌, 함께 보내는 한 시즌. 선별된 RSC 싱글 회원들이\n6주 동안 다양한 경험을 함께하며 서로를 발견하는 시즌형 프로그램입니다.", filter: "grayscale(1) brightness(1.05) contrast(1.05)" },
      ],
    },
  },
  {
    id: "home.spaces",
    page: "home",
    label: "06 공간",
    fields: [bool("visible", "표시"), t("label", "섹션 라벨"), t("title", "제목"), t("lead", "설명")],
    lists: [{ key: "items", label: "공간", itemLabel: "공간", fields: [img("image", "사진"), t("n", "번호"), t("title", "이름"), t("desc", "설명")], min: 1, max: 6 }],
    defaults: {
      visible: true,
      label: "06  /  SPACES",
      title: "모든 경험이 열리는 곳, 라움아트센터",
      lead: "아름다운 공간이 없다면, 이 모든 만남도 없습니다.",
      items: [
        { image: "/images/lounge.jpg", n: "01", title: "RSC 라운지", desc: "프로그램 사이, 익숙한 얼굴들과 마주치게 되는 자리입니다." },
        { image: "/images/hall-chamber.jpg", n: "02", title: "체임버 홀", desc: "클래식 공연·북토크 및 웰니스 행사를 위한 홀." },
        { image: "/images/garden-grass.jpg", n: "03", title: "그라스 가든", desc: "RAUM SOCIAL NIGHT와 야외 행사가 열리는 정원." },
        { image: "/images/hall-majestic.jpg", n: "04", title: "마제스틱 볼룸", desc: "RAUM SOLO 와 같은 시즌의 Finale를 위한 공간." },
      ],
    },
  },
  {
    id: "home.membership",
    page: "home",
    label: "07 멤버십",
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
    label: "08 자주 묻는 질문 (FAQ)",
    description: "검색엔진·AI 검색이 '가입 조건·회비·환불' 같은 질문에 답할 때 인용하는 섹션입니다. 질문은 방문자가 실제로 검색할 문장으로 쓰는 것이 좋습니다.",
    fields: [bool("visible", "표시"), t("label", "섹션 라벨"), ta("title", "제목", "hard"), ta("lead", "설명", "soft")],
    lists: [{ key: "items", label: "질문", itemLabel: "질문", fields: [t("q", "질문"), ta("a", "답변", "hard")], min: 1, max: 20 }],
    defaults: {
      visible: true,
      label: "08  /  FAQ",
      title: "자주 묻는 질문",
      lead: "가입 조건부터 환불, 오시는 길까지.\n더 궁금한 점은 상담 신청으로 남겨 주세요.",
      items: [
        { q: "라움소셜클럽은 어떤 곳인가요? 소개팅·매칭 서비스인가요?", a: "매칭 서비스가 아니라 커뮤니티입니다. 라움이 검증한 싱글 회원들이 라움아트센터의 공간에서 전시·와인·운동·다이닝 같은 프로그램을 함께 경험하며, 여러 프로그램에서 반복해서 만나는 동안 자연스럽게 관계가 깊어지는 구조입니다. 1:1 만남이나 결혼을 목적으로 하는 관계 프로그램(CONNECTION, RAUM MERRY)은 원하는 분만 별도로 선택합니다." },
        { q: "가입 조건이 어떻게 되나요?", a: "만 19세 이상이고 법률상 배우자가 없는 싱글이면 상담을 신청할 수 있습니다. 상담과 적합성 확인을 거쳐 초대코드를 받은 분만 가입할 수 있으며, 가입 즉시 회원 자격이 활성화됩니다(별도 승인 대기 없음)." },
        { q: "초대제라는 게 무슨 뜻인가요? 바로 가입할 수는 없나요?", a: "네, 상담 없이 바로 가입할 수는 없습니다. 사이트의 'RSC 상담 신청'에서 간단한 설문을 남기시면 운영팀이 연락드려 상담을 진행하고, 상담 후 초대코드를 보내드립니다. 그 코드로 가입 화면에 들어올 수 있습니다. 회원이 되시면 지인 초대권(ACCESS 연 8매, SIGNATURE 연 12매)으로 지인을 행사에 동반할 수도 있습니다." },
        { q: "회비는 얼마인가요?", a: "RSC ACCESS 연 3,300,000원(월 환산 275,000원), RSC SIGNATURE 연 8,800,000원(월 환산 733,000원)이며 Founding Member 100명 한정으로 각각 2,400,000원 · 7,200,000원에 가입할 수 있습니다. 가입 전 행사 1회로 먼저 경험하는 RSC PREVIEW는 165,000원입니다. 모든 금액은 VAT 포함 총액이고 자동 갱신은 없으며, 분납은 ACCESS 최대 2회 · SIGNATURE 최대 3회까지 가능합니다." },
        { q: "PREVIEW는 무엇이고, 가입하면 비용은 어떻게 되나요?", a: "PREVIEW는 가입을 결정하기 전에 RSC의 공간·회원·프로그램을 실제 행사 1회로 먼저 경험하는 상품입니다(생애 최초 1회, 165,000원). RSC Basic Event 1회, 호스트 온보딩과 공간 안내, 행사 후 멤버십 상담, 행사 당일 주차 3시간이 포함됩니다. 행사 후 7일 이내에 ACCESS 또는 SIGNATURE에 가입하시면 165,000원이 전액 차감됩니다." },
        { q: "어떤 프로그램이 있나요?", a: "일상적으로 참여하는 6개 카테고리 행사 — RAUM ART WALK(전시), SUNDAY RESET(웰니스), TASTE TABLE(와인·위스키), ONE QUESTION SALON(토크), RAUM AFTER HOURS(공연·음악), RUN & BRUNCH(러닝) — 와 매월 열리는 RAUM SOCIAL NIGHT, 6주 동안 한 시즌을 함께 보내는 RAUM SOLO가 있습니다. 여기에 관계 프로그램 CONNECTION(ESSENTIAL · SELECT · BESPOKE)과 결혼 목적의 RAUM MERRY를 선택할 수 있습니다." },
        { q: "취소·환불은 어떻게 되나요?", a: "프로그램 예약은 프로그램 시작 3일 전까지 내 예약에서 직접 취소하면 전액 환불되며, 이후에는 환불이 어렵습니다(정확한 기준은 예약 화면과 환불규정 페이지에 표시됩니다). 멤버십 환불은 상품별 산정 기준을 따르되, 관계 법령과 소비자분쟁해결기준 중 회원에게 유리한 기준을 우선 적용합니다. 상세 환불·노쇼·홀드 기준은 상담 시 안내드립니다." },
        { q: "위치는 어디이고 주차는 가능한가요?", a: "서울특별시 강남구 언주로 564 라움아트센터(역삼동 680-1)입니다. 정회원은 평일 1일 1회, 3시간까지 무료로 주차할 수 있고 PREVIEW 참가자는 행사 당일 3시간 주차가 제공됩니다. 행사 전후에는 RSC 라운지를 자유롭게 이용하실 수 있습니다." },
        { q: "상담은 어떻게 신청하나요?", a: "사이트 상단의 'RSC 상담 신청' 버튼을 눌러 1분 정도의 설문(Fit Check)을 남겨 주세요. 운영팀이 확인 후 전화 또는 이메일로 연락드립니다. 전화 02-538-3366, 이메일 support@theraum.co.kr, 인스타그램 @raum_socialclub 로도 문의하실 수 있습니다." },
        { q: "멤버십을 잠시 쉬거나 다른 사람에게 넘길 수 있나요?", a: "계약기간 중 1회, 30~90일 범위에서 객관적 사유가 있을 때 홀드(일시 정지)할 수 있습니다. 멤버십의 양도와 재판매는 불가하며, ACCESS에서 SIGNATURE로의 전환은 60일 이내 전액 차감, 이후에는 잔여기간 비례 차감으로 계산됩니다." },
      ],
    },
  },

  /* ---------- 가격 ---------- */
  {
    id: "pricing.hero",
    page: "pricing",
    label: "상단 소개",
    fields: [t("label", "작은 제목"), ta("title", "제목", "hard"), ta("body", "설명", "hard")],
    defaults: { label: "MEMBERSHIP & PRICING", title: "경험에서 시작해\n관계로 이어지는 멤버십", body: "한 번의 경험으로 시작하고, 커뮤니티로 머물고, 원할 때 관계 프로그램으로 확장합니다. \n모든 금액은 VAT 포함 총액입니다." },
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
        { name: "RSC PREVIEW", price: 165000, unit: "1회 · 생애 최초 1회 한정", desc: "가입 전, RSC의 공간·회원·프로그램을 \n실제 행사로 먼저 경험합니다.", features: "RSC Basic Event 1회\n호스트 온보딩 · 공간 안내\n행사 후 멤버십 상담\n행사 당일 주차 3시간", note: "7일 이내 ACCESS·SIGNATURE 가입 시\n165,000원 전액 차감", dark: false, badge: "" },
        { name: "RSC ACCESS", price: 3300000, unit: "연간 · 월 환산 275,000원", desc: "검증된 싱글 커뮤니티. 1년 동안 라움의 공간과 \n프로그램을 일상으로 누립니다.", features: "RSC Basic Event 연 8회 포함\n6개 카테고리 행사 우선 예약\n지인 초대권 연 8매\nCONECTION SELECT 1회 포함\nRSC 라운지 상시 · 평일 무료주차\n아트센터 대관 우선 · 파트너 할인\nPRIVATE CONNECTION 1회 포함", note: "Founding Member 100명 한정 2,400,000원", dark: false, badge: "" },
        { name: "RSC SIGNATURE", price: 8800000, unit: "연간 · 월 환산 733,000원", desc: "커뮤니티와 관계 형성을 하나로. ACCESS 전 혜택에 관계 프로그램과 전담 컨시어지를 더했습니다.", features: "Basic Event 연 18회 + Premium Night 4회\nCONNECTION SELECT 3회 포함\nRAUM SOLO 1시즌 무료 · 추가 시즌 50% 할인\n지인 초대권 연 12매\n미팅룸·세미나룸 각 연 4회\n전담 Relationship Concierge", note: "개별 환산 약 10,110,000원 → 1,310,000원 절감\nFounding Member 100명 한정 7,200,000원", dark: true, badge: "RECOMMENDED" },
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
      title: "관계 프로그램",
      lead: "멤버십과 별도로 선택하는 프로그램입니다. CONNECTION은 실제 대면이 이루어진 경우에만 1회 차감되며(프로필 열람만으로 차감하지 않음), 교제·성혼은 보장하지 않고 성혼비는 없습니다.",
      rows: [
        { name: "RAUM SOLO", sub: "6주 시즌 · 기수제", price: "660,000원", priceSub: "ACCESS 회원 550,000원\nSIGNATURE 첫 시즌 무료", unit: "6회 · 회당 110,000원", desc: "취향 기반 반복 만남. Welcome Table → Taste Pairing → Social Rotation → Team Experience → Date Lab → Final Soirée" },
        { name: "CONNECTION ESSENTIAL", sub: "", price: "550,000원", priceSub: "", unit: "실제 대면 1회", desc: "기본 상담, RSC 내부 회원 큐레이션, 일정 조율" },
        { name: "CONNECTION SELECT", sub: "", price: "1,100,000원", priceSub: "", unit: "실제 대면 1회", desc: "심층 인터뷰, 우선 큐레이션, 프로필 정비, 만남 후 피드백" },
        { name: "CONNECTION BESPOKE", sub: "", price: "2,200,000원", priceSub: "", unit: "실제 대면 1회", desc: "시니어 디렉터 전담, 고난도 조건 설계, 집중 탐색, 전담 피드백" },
        { name: "RAUM MERRY", sub: "결혼 목적 플래그십", price: "33,000,000원부터", priceSub: "", unit: "12개월 · 실제 만남 8회", desc: "Relationship Director 전담. 별도 신청·심사, 탐색 난이도에 따른 맞춤 견적" },
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
        { s: "STEP 1 · 경험", t: "PREVIEW", d: "가입 전 행사 1회로 RSC를 확인합니다." },
        { s: "STEP 2 · 커뮤니티", t: "ACCESS", d: "1년 동안 같은 공간에서 반복해 마주칩니다." },
        { s: "STEP 3 · 관계", t: "SOLO · CONNECTION · SIGNATURE", d: "원하는 깊이로 관계 프로그램을 더합니다." },
      ],
      rows: [
        { a: "ACCESS", b: "3,300,000원", c: "연간 커뮤니티 혜택 + CONNECTION 1회", d: "커뮤니티 중심", highlight: false },
        { a: "ACCESS + SELECT 1회", b: "4,400,000원", c: "커뮤니티 + 1:1 만남 2회", d: "가벼운 관계 탐색", highlight: false },
        { a: "ACCESS + SELECT 3회 + SOLO", b: "7,150,000원", c: "커뮤니티 + 1:1 만남 4회 + 6주 프로그램", d: "적극적 관계 탐색", highlight: false },
        { a: "SIGNATURE", b: "8,800,000원", c: "위 구성 + 프리미엄 행사·초청·공간·컨시어지", d: "대표 선택", highlight: true },
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
    fields: [t("label", "작은 제목"), t("title", "제목"), ta("body", "설명", "hard"), t("tableTitle", "표 제목")],
    defaults: { label: "RSC MEMBER BENEFITS", title: "정회원 혜택 안내", body: "“아름다운 공간에서, 서로의 특별함을 발견하는 곳”\n라움이 검증한 멤버가 모이는, 싱글 라이프스타일 커뮤니티", tableTitle: "회원 혜택 구성" },
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
    defaults: { title: { terms: "RAUM SOCIAL CLUB 이용약관", privacy: "개인정보처리방침", refund: "취소 · 환불 규정" }[k], updated: "2026년 10월 1일", placeholder: k !== "privacy", sections: [] },
  })),
];

DOCS.push(...SETTINGS_DOCS, ...SEO_DOCS);
export const DOC_BY_ID = new Map(DOCS.map((d) => [d.id, d]));
export const PAGES: { key: DocDef["page"]; label: string; preview: string }[] = [
  { key: "global", label: "브랜드 · 테마", preview: "/" },
  { key: "home", label: "메인 페이지", preview: "/" },
  { key: "pricing", label: "가격 안내", preview: "/pricing" },
  { key: "benefits", label: "혜택 안내", preview: "/benefits" },
  { key: "legal", label: "약관", preview: "/terms" },
];
