# Design.md — RSC 디자인 규칙

이 문서는 모든 화면에 **고정**으로 적용한다. `design/` 폴더의 HTML을 브라우저로 열어 실제 렌더를 확인하고 픽셀 수준으로 재현한다. 새 화면(에러·로딩·빈 상태 등)도 이 규칙 안에서만 만든다.

## 무드
크림 종이 위 짙은 브라운 잉크. 여백 넉넉, 각진 카드(radius 0), 그림자 없음, 얇은 선. 럭셔리 멤버십 클럽의 인쇄물 느낌. 화려한 그라데이션·이모지·둥근 큰 카드 금지.

## 색상 (Tailwind `theme.extend.colors`에 이 이름으로 등록)
```
cream:      #f2eee5   // 페이지 배경
card:       #f7f3ec   // 카드 배경
ink:        #211e19   // 본문 텍스트, 다크 섹션 배경
brown:      #5a3d24   // 포인트: 주 버튼, GNB 메뉴, 라벨, 링크 hover
brownHover: #9c6b3e   // 주 버튼 hover, 오버라인 라벨
gold:       #e2b478   // 다크 배경 위 라벨/강조, 추천 배지
goldHover:  #f0c98e
success:    #2e6b3e   (bg rgba(46,107,62,.12))
warn:       #7a5420   (bg rgba(226,180,120,.25))
error:      #a3402c
```
- 보조 텍스트: `rgba(33,30,25,.5)` / `.65` / `.7`
- 구분선·테두리: `rgba(33,30,25,.1)` / `.14` / 입력 `.24` / 보조 버튼 `.3`
- 다크 섹션 위 텍스트 `#f7f3ec`, 보조 `rgba(247,243,236,.6~.85)`, 선 `rgba(247,243,236,.15)`
- 결제수단 브랜드색: 카카오 `#FEE500`, 네이버 `#03C75A`, 토스 `#0064FF`

## 타이포그래피
- 폰트: **SamsungOne** — `design/assets/fonts/SamsungOne-400.ttf / 500 / 600 / 700`. `next/font/local`로 로드. fallback Arial.
- 기본 weight **500** (body). 제목 600. 700은 배지에서만.
- 행간은 촘촘한 편(사용자 요청으로 전체 행간 축소됨).

| 용도 | 크기 | weight | 기타 |
|---|---|---|---|
| 오버라인 라벨 | 11px | 500 | letter-spacing .3em, 대문자, `brownHover` 또는 ink/.5 |
| H1 | clamp(30px, 4vw, 52px) | 600 | line-height 1.28, letter-spacing -.01em |
| H2 | clamp(24px, 2.6vw, 34px) | 600 | line-height 1.3 |
| 본문 lead | 16.5px | 500 | line-height 1.75, ink/.68 |
| 본문 | 14.5~15px | 500 | line-height 1.65~1.7 |
| 캡션 | 12.5~13px | 500 | ink/.5 |
| 표 헤더 | 11.5px | 600 | letter-spacing .12em, ink/.5 |
| 표 셀 | 14.5px | 500 | line-height 1.5 |
| 가격 | 34px | 600 | 단위 "원" 15px/500 |
| 버튼 | 13.5~14px | 500~600 | |

## 레이아웃
- 콘텐츠 max-width **1100px**, 가운데. 페이지 padding: 데스크톱 `72px 40px 140px`, 모바일 `40px 18px 96px`.
- 섹션 간격 96px(모바일 64px).
- 그리드: 3열 `repeat(3, minmax(0,1fr))` gap 16px; 760px 이하 1열. 4열은 모바일 2열.
- 표는 가로 스크롤 컨테이너로 감싸기(`overflow-x:auto`).
- breakpoint 하나: **760px**.

## 컴포넌트
**GNB** — sticky top, bg `rgba(242,238,229,.9)` + `backdrop-filter: blur(14px)`, 하단 1px ink/.1, padding `16px 40px`(모바일 `14px 18px`). 좌: 엠블럼 로고(h 32px) + 텍스트 로고(h 15px). 우: 메뉴 텍스트 13px/600 `brown` + "상담신청" pill. 모바일: 햄버거 → 전체화면 오버레이(bg ink, 메뉴 크게 세로 나열).

**버튼**
- 주(primary): bg `brown`, text `cream`, pill `radius 999px`, padding `15px 28px`, hover bg `brownHover`. 다크 배경 위에서는 bg `gold` text `ink`, hover `goldHover`.
- 보조: 1px ink/.3 border, 투명, hover border+text `brownHover`.
- 폼 제출(풀폭): radius 0, padding 18px, bg `brown`, text 14px letter-spacing .06em 600.
- 텍스트 버튼: 13px/600 `brown`.
- transition 150ms ease. disabled: opacity .6.

**카드** — bg `card`, 1px ink/.14 border, radius 0, padding `36px 32px`(정보 카드) / `30px 28px`(소형). 추천 카드는 bg `ink` + 우상단 `RECOMMENDED` 배지(bg gold, ink, 10px, 700, letter-spacing .2em).

**입력** — bg #fff, 1px ink/.24, radius 0, padding `16px 18px`, 15px; focus border `brown`; placeholder ink/.35. 오류 문구 13px `error` 아래에.

**배지(상태)** — pill, 11px, padding `4px 10px`: 확정/활동 success, 대기 warn, 취소/마감 ink/.5 on ink/.08.

**표** — 헤더 하단 1px ink/.18, 행 하단 1px ink/.1, 마지막 행 선 없음, 셀 padding `18px`(모바일 12px). 강조 행 bg `rgba(226,180,120,.18)`.

**리스트 불릿** — 대시 `—` `brownHover`색, gap 10px.

**어드민 사이드바** — bg `ink`, w 240px, 메뉴 13px `rgba(247,243,236,.7)`, 선택 bg `rgba(247,243,236,.1)` + text `#f7f3ec`. 본문 bg `cream`. KPI 카드 4열.

**플로팅 UP 버튼** — 우하단 44px 원, bg `rgba(33,30,25,.55)`, 화살표 cream, 히어로 지나면 fade-in.

## 이미지
- 비율: 히어로 풀블리드, 프로그램 카드 4:3, 상세 3:2, 공간 카드 3:4 세로.
- 톤: 채도 낮춤·따뜻한 크림 톤 통일(`06 Spaces` 4장처럼). 어두운 사진 위 텍스트는 `#f7f3ec`/`gold`.
- 원본은 `design/assets/`. 어드민 업로드 이미지는 Supabase Storage, 최대 2000px 리사이즈.

## 카피 톤
차분한 존댓말, 짧은 문장, 마침표. "좋은"의 반복 금지. 영어 오버라인 + 한글 제목 조합. 예: `MEMBERS ONLY` / "초대코드를 입력해주세요". 확정 문구는 `design/` HTML의 텍스트를 그대로 사용.
