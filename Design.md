# Design.md — RSC 디자인 규칙 (Wanted Design System 기반)

2026-11 전면 개편. 원티드 디자인 시스템(Figma Community "Wanted Design System")의 토큰·타입 스케일·컴포넌트 규격을 그대로 가져와 적용한다. 모든 공개 화면은 `components/ui/ds.tsx` 의 프리미티브와 아래 토큰만 사용한다. 새 화면(에러·로딩·빈 상태 등)도 이 규칙 안에서만 만든다.

## 무드
흰 바탕, 또렷한 검정 텍스트, 파란 포인트 하나. 12px 라운드 카드, 얇은 선, 그림자는 입력·호버에서만 아주 약하게. 과한 그라데이션·이모지·장식용 아이콘·큰 글자 그림자 금지. "채용 서비스처럼 담백하게"가 기준.

## 색상 토큰 (`app/globals.css` `--ds-*` → `tailwind.config.ts` 이름)
```
label         #171719                  본문·제목
labelNeutral  rgba(46,47,51,.88)       본문 보조
labelAlt      rgba(55,56,60,.61)       설명·캡션
labelAssist   rgba(55,56,60,.28)       번호·비활성 라벨
labelDisable  rgba(55,56,60,.16)
primary       #0066FF   strong #005EEB   heavy #0054D1   (버튼·링크·라벨)
line          rgba(112,115,124,.22)  lineNeutral .16  lineAlt .08   (카드·구분선)
lineSolid     #E1E2E4   lineSolidNeutral #EAEBEC   lineSolidAlt #F4F4F5
fill          rgba(112,115,124,.08)  fillStrong .16  fillAlt .05    (호버·칩 배경)
white #FFFFFF (페이지)   sand #F7F7F8 (대체 배경·푸터)   sandDeep #F4F4F5
inverseBg #1B1C1E   inverseLabel #F7F7F8   inversePrimary #3385FF   (다크 CTA 밴드)
positive #00BF40 / positiveFg #009632   cautionary #FF9200 / #D17600   negative #FF4242 / #E52222
```
- 레거시 이름(cream·ink·brown·gold·success·warn·error 등)은 같은 변수에 매핑된 호환용이며 코드에서는 더 쓰지 않는다 (sand·sandDeep 은 그대로 사용).
- CMS 테마 문서는 `global.theme2` 를 읽는다. 옛 `global.theme` 는 구버전 배포본용으로 그대로 둔다.

## 타이포그래피
- 폰트: **Pretendard Variable** (`app/fonts/PretendardVariable.woff2`, `next/font/local`, `--font-pretendard`). `font-feature-settings: "ss10"`, `word-break: keep-all`.
- 기본 weight 400. 제목 700, 라벨·버튼 600.
- 크기는 반드시 아래 유틸리티 클래스(`@utility t-*`, `app/globals.css`)로만 지정한다. 임의 `text-[..px]` 금지(아이콘·배지 예외).

| 클래스 | 크기/행간/자간 | 용도 |
|---|---|---|
| `t-display-1` | 56 / 1.286 / -0.0319em | 데스크톱 히어로 |
| `t-display-2` | 40 / 1.3 / -0.0282em | 태블릿 히어로 |
| `t-display-3` | 36 / 1.334 / -0.027em | 페이지 제목(데스크톱) |
| `t-title-1` | 32 / 1.375 / -0.0253em | 모바일 히어로·페이지 제목 |
| `t-title-2` | 28 / 1.358 / -0.0236em | 섹션 제목(데스크톱) |
| `t-title-3` | 24 / 1.334 / -0.023em | 섹션 제목(모바일) |
| `t-heading-1` | 22 / 1.364 / -0.0194em | 카드 그룹 제목 |
| `t-heading-2` | 20 / 1.4 / -0.012em | 카드 제목·탭 |
| `t-headline-1` | 18 / 1.445 / -0.002em | 소제목 |
| `t-headline-2` | 17 / 1.412 / 0 | 행 제목 |
| `t-body-1` (`-reading` 1.625) | 16 / 1.5 / 0.0057em | 리드 문단 |
| `t-body-2` (`-reading` 1.6) | 15 / 1.467 / 0.0096em | 본문·표 |
| `t-label-1` (`-reading` 1.571) | 14 / 1.429 / 0.0145em | 라벨·네비·버튼(md) |
| `t-label-2` | 13 / 1.385 / 0.0194em | 작은 라벨 |
| `t-caption-1` | 12 / 1.334 / 0.0252em | 캡션·도움말·표 헤더 |
| `t-caption-2` | 11 / 1.273 / 0.0311em | 배지 |

- 반응형 조합 예: 페이지 제목 `t-title-1 md:t-display-3`, 섹션 제목 `t-title-3 md:t-title-2`.
- 영어 오버라인(eyebrow)은 `t-label-1 font-semibold text-primary`. 대문자 CMS 텍스트 그대로, 글자 간격 추가 금지.

## 레이아웃
- 콘텐츠 max-width **1060px** (`Container`), 넓은 섹션 1200px (`Container wide`). 좌우 padding 20px / md 32px.
- 간격 단위 4px. 섹션 간격 56px(모바일) / 80~96px(데스크톱). 카드 padding 24px(모바일) / 28~32px.
- breakpoint: sm 640 · **md 761** · lg 1024.
- 라운드: 카드·입력·버튼 **12px** (`rounded-ds`), 작은 요소 8px (`rounded-ds-sm`), 칩·배지 pill.
- 그림자: `shadow-xs`(입력) `shadow-sm` `shadow-md`(호버 카드) `shadow-lg`(토스트·메뉴).
- GNB 높이 56px(모바일) / 64px. 페이지 래퍼는 `pt-[56px] md:pt-[64px]`.
- 표는 `Scroll`(overflow-x) 컨테이너로 감싼다.

## 컴포넌트 (`components/ui/ds.tsx`)
- **버튼** `btn(variant, size)` / `<Button>` / `<ButtonLink>`  
  variant: `solid`(primary bg, 흰 글자) · `outlined`(primary 테두리) · `assistive`(lineNeutral 테두리, 검정 글자) · `text` · `inverse`(다크 밴드용 흰 버튼).  
  size: `lg` 48px/px28/16px · `md` 40px/px20/15px · `sm` 32px/px14/14px. 모두 radius 12, weight 600. disabled: `disable` 배경 + `labelDisable` 글자.
- **카드** `CARD`(흰 배경 + lineAlt 1px + 12px), `CARD_ALT`(sand 배경), 호버 시 `CARD_HOVER`.
- **입력** `INPUT`(48px, lineNeutral 1px, 12px, 16px 글자, focus primary 링), `TEXTAREA`, 오류 `INPUT_ERR`. 라벨 `FIELD_LABEL`(14 SemiBold), 도움말 `FIELD_HELP`(12 labelAlt), 오류 `FIELD_ERROR`.
- **칩(선택지)** `CHIP` + `CHIP_ON`(primary 테두리 + 연파랑 배경) / `CHIP_OFF`.
- **배지** `<Badge tone>` neutral·primary·positive·cautionary·negative·inverse — pill, 12px SemiBold.
- **섹션 머리** `<SectionHead eyebrow title lead align>`.
- **GNB** `SiteHeader` — 흰 배경 95% + blur, 하단 lineAlt. 데스크톱 메뉴 `t-label-1` SemiBold, 우측 로그인(assistive md) + 상담 신청(solid md). 모바일: 햄버거 → 흰 전체 화면 메뉴(`t-heading-2` 목록, 하단 풀폭 solid 버튼).
- **푸터** `SiteFooter` — sand 배경, 4열(브랜드·메뉴·문의·패밀리 사이트) + 사업자 정보 한 줄 + 약관 링크.
- **다크 CTA 밴드** `bg-inverseBg rounded-ds`, 라벨 `text-inversePrimary`, 제목 `text-inverseLabel`, 본문 `rgba(247,247,248,.7)`, 버튼 solid + inverse.
- **플로팅 UP 버튼** 우하단 44px 흰 원 + lineNeutral + shadow-md, 뷰포트 60% 스크롤 후 표시.
- **탭(법적 고지 등)** 하단 2px 언더라인, 선택 `text-label`/미선택 `text-labelAlt`.

## 움직임 (생동감)
- **버튼**: 호버 시 색이 진해지고 파란 그림자(solid), 누르면 `scale(.97)`. 모든 변화 200ms ease-out.
- **카드** `CARD_HOVER`: 호버 시 4px 떠오름 + `shadow-md` + 테두리 진하게, 안의 사진은 `ImageBlock zoom` 으로 700ms 동안 5% 확대 (`group`).
- **스크롤 등장** `data-reveal` (+ `--d` 로 지연): 화면에 들어오면 아래에서 22px 떠오르며 나타난다. `RevealObserver`(루트 레이아웃)가 `html.js` 를 붙인 뒤에만 숨기므로 JS 가 없으면 그대로 보인다. `SectionHead`·`ImageBlock` 은 `reveal` prop.
- **첫 화면**: `anim-up` / `anim-up-2` / `anim-up-3` 순서 등장, 사진은 `anim-zoom`.
- **GNB**: 메뉴 밑줄이 왼쪽에서 자라남(`link-grow`), 스크롤하면 그림자. 모바일 메뉴는 `anim-pop` + 항목 순차 등장.
- **모바일 가로 스와이프** `SWIPE` + `SWIPE_ITEM`: 프로그램·순간 카드는 모바일에서 82% 폭 카드로 옆으로 밀어 보고(스냅), 데스크톱은 그리드. 위에 "옆으로 밀어서 보기 →" 안내.
- **FAQ**: 열리면 답이 떠오르고(`faq-body`) 질문이 파란색. **표 행**은 호버 시 연파랑.
- **종이 접기** `data-fold`: 섹션이 화면에 들어올 때 위쪽 모서리를 축으로 -18° 에서 펼쳐진다(위쪽 그늘이 함께 사라짐). `animation-timeline: view()` 를 지원하면 스크롤 위치에 정확히 따라가고, 아니면 RevealObserver 가 한 번 펼친다. 히어로(첫 화면)에는 쓰지 않는다.
- `prefers-reduced-motion` 이면 모든 효과를 끈다.

## 문장 줄바꿈
- `Txt` 는 마침표·물음표·느낌표 뒤에서 항상 줄을 바꾼다 (PC·모바일 공통, 문장이 중간에 잘려 보이지 않게). 숫자 뒤 점은 제외.
- CMS 의 `\n` 은 기본(soft) 데스크톱에서만 줄바꿈, 모바일은 띄어쓰기로 이어 붙임. `breaks="hard"` 는 항상 줄바꿈.
- 안내 문단은 전부 `Txt` 로 렌더하고 `text-pretty` 를 붙인다. 표 셀은 예외.

## 이미지
- 모두 `rounded-ds`(12px) 모서리. 히어로 4:3(모바일) / 4:5(데스크톱), 프로그램 카드 4:3, 상세 3:2.
- 색 보정 없이 원본 톤 유지. 어두운 사진 위 텍스트는 `inverseLabel`.
- 원본은 `design/assets/`. 어드민 업로드 이미지는 Supabase Storage, 최대 2000px 리사이즈.

## 카피 톤
차분한 존댓말, 짧은 문장, 마침표. 영어 오버라인 + 한글 제목 조합 유지. 문구는 CMS(`site_content`)가 우선이며 코드의 기본값은 CMS 가 비어 있을 때만 쓰인다.

## 정보 구조 (2026-11 · 두 갈래 홈)
- 홈(`/`)은 **게이트**다. 맨 위 전환형 히어로(`components/site/GateHero.tsx`)에 「소셜클럽 | 1:1 매칭」 탭이 있고, 탭을 누르면 사진·문구·버튼이 바뀐다(모바일은 스와이프, PC 는 ←/→ 도 됨). 버튼은 각 트랙 페이지와 `/fit-check?track=…` 으로 간다. 레퍼런스: emotional oranges 홈의 로테이션/프라이빗 전환.
- 그 아래 「두 가지 방식」 비교 카드(`TrackCards`) → 브랜드 소개(01) → 브랜드 약속(03) → FAQ → 두 버튼 CTA(`CtaBand`).
- `/social` 소셜클럽: 트랙 전환 바(`TrackSwitch`) + 상단 소개 + 멤버십 구성(가입비 = 회원 자격 + 행사 6회 + 초대권 2매) + 02 포지셔닝 · 04 TASTE SOCIAL · 06 MOMENTS + 가입 심사 + FAQ. `/matching` 1:1 매칭: 가입 심사(`VerifySection`, 「아무나 들어올 수 없습니다」) · 진행 방식 4단계 · 멤버십 구성(ACCESS 5회 · SIGNATURE 10회 · MERRY, 리드 모드면 금액 숨김) · 회원 전용 행사(`MembersOnly`: SOCIAL NIGHT · GRAND BALL · RAUM SOLO) · 다른 점 · 이런 분께 · FAQ. 상품 문구의 기준은 RSC 사업전략(2026.11.03).
- 상담 신청(`/fit-check`)은 「관심 있는 방식」 칩(소셜클럽 · 1:1 매칭 · 상담 후 결정)이 맨 위에 있고 `?track=` 으로 미리 선택된다. 값은 `inquiries.answers.route` 에 저장되어 어드민 상담 상세에 「관심 방식」으로 보인다.
- 문구·사진은 모두 CMS: 사이트 관리 → 메인 페이지(00 게이트 히어로 · 00-1 비교 카드) / 소셜클럽 / 1:1 매칭 탭.

## 적용 범위
- 1단계(완료): 공개 사이트 전체 — 홈, 상담 신청(/fit-check), 상담 전 설문(/apply), 혜택, 멤버십, 소식, 약관·개인정보·환불, 404·에러.
- 2단계(완료, 2026-11): 어드민(흰 사이드바 + sand 본문, `components/admin/ui.tsx` 의 CARD·TH·TD·FIELD·BTN_*·PageTitle·Badge)·회원·로그인·결제 화면을 같은 토큰으로 교체. 레거시 색 이름(cream·ink·brown·gold 등)은 코드에서 더 쓰지 않으며 tailwind 매핑만 호환용으로 남겨 둔다.
