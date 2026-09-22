# Handoff: RAUM Social Club (RSC) — 실서비스 플랫폼

## 로컬에서 실행하기 (내 PC에서 화면 띄우기)

준비물: [Node.js](https://nodejs.org) LTS(20 이상) 한 번만 설치.

**가장 쉬운 방법 — 스크립트 한 번 실행**
- mac: 터미널을 열고 이 폴더로 이동한 뒤 `bash scripts/setup.sh`
- Windows: PowerShell을 열고 이 폴더로 이동한 뒤 `.\scripts\setup.ps1`
  (실행 정책 오류가 나면 `powershell -ExecutionPolicy Bypass -File .\scripts\setup.ps1`)

스크립트가 Node.js 확인 → 패키지 설치 → `.env.local` 생성 → 개발 서버 실행까지 해줍니다.
끝나면 브라우저에서 <http://localhost:3000> 을 열면 됩니다. 종료는 그 창에서 `Ctrl + C`.

**직접 입력하는 방법**
```
npm i
cp .env.example .env.local     # Windows: copy .env.example .env.local
npm run dev
```

외부 서비스 키(Supabase·토스 등)는 `.env.local`에 채웁니다. 목록과 받는 방법은 `SETUP.md` 참고.
브랜드 페이지(M1)까지는 키가 비어 있어도 화면이 뜹니다.

**M2(상담 신청 저장)부터**: `.env.local`에 아래 두 값이 있어야 설문 제출이 저장됩니다.
1. https://supabase.com/dashboard/project/vfjpouuwvwgiqpwttyup/settings/api 접속
2. `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`, `anon public` 키 → `NEXT_PUBLIC_SUPABASE_ANON_KEY` 에 붙여넣기
3. 개발 서버를 껐다가 다시 켜기 (`Ctrl + C` 후 `npm run dev`)
저장된 신청은 같은 대시보드의 Table Editor → `inquiries` 에서 볼 수 있습니다.

**M3(가입·로그인)부터**: 가입은 초대코드가 있어야 합니다. 검수용 코드 `RSC-TEST-2026` 이 DB에 들어 있습니다(1회용).
새 코드는 SQL Editor에서 `insert into invite_codes(code, issued_to_name) values ('RSC-XXXX-XXXX','이름');` 로 넣거나 M4 어드민에서 발급합니다.
소셜 로그인은 카카오(Supabase Authentication → Providers 에 키 등록)와 네이버(`NAVER_CLIENT_ID`/`NAVER_CLIENT_SECRET`, 직접 연동)입니다. 준비되면 `NEXT_PUBLIC_AUTH_PROVIDERS=kakao,naver` 로 켭니다. 네이버 가입자는 이메일 제공 동의가 필요하며, 첫 로그인 뒤 `/join` 에서 초대코드를 연결합니다.
Supabase Authentication → Sign In / Providers → Email 의 "Confirm email" 은 꺼 두어야 가입 즉시 로그인됩니다.

**M4(어드민)**: `/admin` 은 `members.role = 'admin'` 인 계정만 들어갑니다. 첫 관리자는 SQL Editor에서
`update members set role='admin' where email='본인이메일';` 로 지정합니다. 상담 신청 → "초대코드 발급"으로 코드를 만들고 복사해 전달합니다.
이메일 자동 발송은 Vercel 환경변수 `RESEND_API_KEY`(+ 선택 `NOTIFY_FROM_EMAIL`)를 넣으면 켜집니다.

**M5(프로그램)**: 어드민 → 프로그램 → "+ 새 프로그램 등록"(단일) 또는 "+ RAUM SOLO 시즌"(6주). 사진은 Supabase Storage 버킷 `programs`(public, SETUP.md 3)에 올라갑니다.
"게시"를 누르면 회원 `/programs` 목록·상세에 바로 보이고, "임시 저장"(비공개)은 관리자만 봅니다. 잔여석은 DB 함수 `session_remaining` 으로 계산합니다.

**M6(예약·결제)**: 프로그램 상세 "결제하기" → 예약(15분 홀드) → `/checkout/[id]` 토스 결제위젯 → 승인 → `/my`. 토스 키는 `.env.local`/Vercel 의
`NEXT_PUBLIC_TOSS_CLIENT_KEY`, `TOSS_SECRET_KEY` 로 읽습니다(지금은 토스 문서의 공용 테스트 키 → 가맹점 키로 교체만 하면 됨). 테스트 결제는 실제 청구가 없습니다.
서버 승인·환불·웹훅은 `SUPABASE_SERVICE_ROLE_KEY` 가 있어야 동작합니다(로컬은 `.env.local` 에도 필요). 환불 정책은 `lib/bookings/refund.ts`(3일 전까지 100%).
토스 웹훅은 개발자센터에서 `https://<도메인>/api/payments/webhook` 을 등록합니다(선택, confirm 누락 보강).

**M7(어드민 예약·결제 / 회원 DB / 대시보드)**: `/admin/orders` 에서 예약을 고르면 결제 정보(토스 paymentKey·영수증)와 환불 버튼이 나옵니다. 관리자 환불은 정책과 무관하게 금액을 지정하며 토스 취소 API 를 호출합니다.
`/admin/members` 는 검색·상태 필터 + 회원 상세(예약 이력, 메모, 활동/휴면/탈퇴). `/admin` 대시보드는 이번 달/지난 달/올해 실제 결제·예약 데이터를 집계합니다(한국 시간 기준). "엑셀 다운로드"는 CSV 파일입니다.

**M8(마무리)**: `/terms` `/privacy` `/refund` 는 자리 문구입니다(`lib/legal/content.ts` 한 파일만 바꾸면 됩니다). 404·오류·로딩 화면과 키보드 포커스 링을 추가했습니다.
라이브 전환 체크리스트는 SETUP.md 4 참고(토스 라이브 키, 웹훅 URL, Supabase Redirect URL, 도메인 이전).

**M9(어드민 고도화)**: `/admin/site` 에서 메인·가격·혜택·약관의 문구·사진·색상·연락처를 코드 수정 없이 바꿉니다(저장 즉시 반영, 이력 복원 가능). 기본값은 `lib/cms/schema.ts` 에 있어 DB 가 비어 있어도 기존 화면이 그대로 나옵니다.
`/admin/stats` 는 기간별 매출·예약·회원·상담·접속(페이지뷰/방문자/유입/기기)·전환 퍼널·관리자 활동을 보여주고 항목별 또는 전체 CSV 로 내려받습니다. 접속 수집은 `/api/track` 비콘(서버에 `SUPABASE_SERVICE_ROLE_KEY` 필요).

기타 명령: `npm run build`(배포용 빌드 확인), `npm run lint`(코드 검사).

## Overview
라움소셜클럽(RSC)의 실서비스 구축 핸드오프. 브랜드 사이트 + 회원 가입/로그인 + 프로그램 예약·결제 + 관리자(어드민)까지 포함.

**타깃 스택 (확정)**
- Frontend: **Next.js 14+ (App Router, TypeScript)**, Tailwind 권장 — Vercel 배포 (기존 주소 `raumsocialclub2026.vercel.app` 유지)
- DB / Auth / Storage: **Supabase** (Postgres + Auth + Storage + RLS)
- 결제: **토스페이먼츠** 결제위젯 (카드·카카오페이·네이버페이·토스페이·계좌이체)
- 알림: 카카오 알림톡(솔라피) 또는 Resend 이메일
- 어드민: Next.js 내 `/admin` 라우트 (role = admin 전용)

이 문서 하나로 이 대화를 모르는 개발자가 구현할 수 있어야 한다. 부족한 부분은 `SCHEMA.sql`, `FLOWS.md`, `SETUP.md`를 함께 참고.

## About the Design Files
`design/` 폴더의 HTML 파일들은 **디자인 레퍼런스(프로토타입)**이다. 이 도구 전용 컴포넌트 형식(`<x-dc>`, `support.js`)이라 그대로 배포/이식하지 않는다. 브라우저에서 열어 **보이는 대로 Next.js/Tailwind로 재구현**한다. 특히 `RSC Member`, `RSC Admin`은 데이터가 하드코딩·localStorage 기반이므로 로직은 참고만 하고 DB 연동으로 다시 작성한다.

`deploy/` 폴더는 현재 정적 배포본(index.html 등) — 브랜드 페이지 실제 렌더 결과 확인용.

## Fidelity
**High-fidelity.** 색상·타이포·간격·문구 모두 최종안. 픽셀 수준으로 재현할 것. 문구(카피)는 확정본이므로 임의 수정 금지.

## Design Tokens
Colors
- 배경 크림 `#f7f3ec` / 카드 크림 `#f7f3ec`(배경과 동일, 1px 테두리로만 구분) / 흰 카드 `#ffffff`
- 잉크(본문) `#211e19` / 다크 섹션 배경 `#211e19` (그 위 텍스트 `#f7f3ec`)
- 포인트 짙은 브라운 `#5a3d24` (버튼·GNB 메뉴·제목 라벨) / hover 브라운 `#9c6b3e`
- 골드(다크 배경 위 라벨·강조) `#e2b478`, hover `#f0c98e`
- 보조 텍스트 `rgba(33,30,25,.5~.7)` / 구분선 `rgba(33,30,25,.1~.14)`
- 상태: 성공 `#2e6b3e` (bg `rgba(46,107,62,.12)`), 경고 `#7a5420` (bg `rgba(226,180,120,.25)`), 오류 `#a3402c`
- 간편결제 브랜드: 카카오 `#FEE500`, 네이버 `#03C75A`, 토스 `#0064FF`

Typography
- 폰트: **SamsungOne** (`design/assets/fonts/SamsungOne-400/500/600/700.ttf`), fallback Arial. 기본 weight 500.
- 오버라인 라벨: 11px, letter-spacing .3em, 대문자, `#9c6b3e` 또는 `rgba(33,30,25,.5)`
- H1: clamp(30px, 4vw, 52px), weight 600, line-height 1.28
- H2: clamp(24px, 2.6vw, 34px), weight 600, line-height 1.3
- 본문: 15~16.5px, line-height 1.7~1.75, `rgba(33,30,25,.65~.75)`
- 표 헤더: 11.5px, letter-spacing .12em, weight 600
- 가격 숫자: 34px weight 600, 단위 "원" 15px weight 500

Layout
- 콘텐츠 max-width 1100px, 데스크톱 좌우 padding 40px, 모바일 18px
- 버튼: pill (`border-radius:999px`), padding 15px 28px, 13.5~14px; 주 버튼 bg `#5a3d24` text `#f7f3ec`; 보조 버튼 1px border `rgba(33,30,25,.3)`
- 카드: 1px border `rgba(33,30,25,.14)`, radius 0 (각진 카드), 그림자 없음
- GNB: sticky, `rgba(242,238,229,.9)` + `backdrop-filter: blur(14px)`, 하단 1px 선
- 반응형 breakpoint 760px: 그리드 1열, 헤더 padding 14px 18px

## Screens / Views

### A. 공개(브랜드) 페이지 — `design/RAUM Social Club.dc.html` (= `deploy/index.html`)
- 라우트 `/`. 현재 정적 배포본과 동일하게 재현. 섹션: Hero → 서비스 소개 → 취향 프로그램 → RAUM SOLO → 06 Spaces → 07 Membership(가격 안내 / 혜택 확인 두 카드) → CTA(RSC 상담 신청하기 · 인스타그램).
- GNB: 엠블럼+텍스트 로고 좌측, 우측 메뉴(서비스 소개, 프로그램, 멤버십) + "상담신청" pill 버튼. 모바일: 햄버거 → 전체화면 오버레이 메뉴.
- 히어로 아래로 스크롤 시 우하단 반투명 원형 "UP" 플로팅 버튼 노출.
- 이미지: `design/assets/*.jpg` — Supabase Storage 또는 `/public`에 배치. **CMS 대상**: 어드민에서 교체 가능하게 하려면 `site_images` 테이블(선택, 2차).
- **실서비스 추가**: GNB 우측에 로그인 상태 표시(비로그인: "로그인" pill / 로그인: "프로그램" "내 예약" + 이니셜 아바타).

### B. 상담 신청 (Fit Check) — `design/RSC Fit Check.dc.html` (`/fit-check`)
- 단계별 설문(한 화면에 한 질문, 선택 시 하단에 선택별 문구 노출) → 마지막에 이름·연락처 입력 → 결과 유형 노출.
- **실서비스**: 완료 시 `inquiries` 테이블에 answers(JSON)+result_type 저장, 어드민 "상담 신청" 탭에서 열람. 로그인 불필요.

### C. 가격 안내 — `design/RSC Pricing.dc.html` (`/pricing`)
정적 페이지. 가격은 DB `membership_plans`에서 읽도록 구현(어드민에서 수정 가능). 현행 값:
- RSC PREVIEW 165,000원 (1회, 생애 1회) — 7일 내 가입 시 전액 차감
- RSC ACCESS 3,300,000원/년 (Founding 100명 2,400,000원) — Basic Event 8회, 초대권 8매, PRIVATE CONNECTION 1회 등
- RSC SIGNATURE 8,800,000원/년 (Founding 7,200,000원) — Basic 18회 + Premium Night 4회, CONNECTION SELECT 3회, RAUM SOLO 1시즌, 컨시어지
- 관계 프로그램: RAUM SOLO 660,000 (ACCESS 550,000 / SIGNATURE 첫 시즌 무료), CONNECTION ESSENTIAL 550,000 / SELECT 1,100,000 / BESPOKE 2,200,000 (실제 대면 1회 단위), RAUM MERRY 33,000,000원부터
- 모든 금액 VAT 포함. 자동 갱신 없음. 분납 ACCESS 2회 / SIGNATURE 3회.

### D. 혜택 안내 — `design/RSC Benefits.dc.html` (`/benefits`)
정적 페이지. 혜택 목록(카테고리 행사 우선 참여, 지인 초대권 연 8매, 전용 미팅룸·세미나룸 예약, RSC 라운지 이용, 평일 무료주차, 라움 아트센터 대관 우선, 제휴 시설 할인). CTA 2개 유지.

### E. 회원 영역 — `design/RSC Member.dc.html` (`/join`, `/login`, `/programs`, `/programs/[id]`, `/checkout/[bookingId]`, `/my`)
프로토타입 상단의 검은 "화면 미리보기" 바는 **개발 시 제거** (프로토타입 전용 스위처).

화면 순서와 라우트:
1. **초대코드 입력** `/join` — "MEMBERS ONLY / 초대코드를 입력해주세요". 입력 `RSC-XXXX-XXXX`(대문자, letter-spacing .18em, 가운데 정렬), 오류 문구 "유효하지 않은 코드입니다. 상담 담당자에게 확인해주세요." 하단 링크 "RSC 상담 신청". → `invite_codes` 검증(status=unused, 만료 전).
2. **가입** `/join/register?code=` — 이름·휴대폰·이메일·비밀번호 + 소셜 가입 버튼(카카오/네이버/구글). Supabase Auth 사용. 가입 성공 시 `members` row 생성(status=active, 즉시 활성 — 승인 대기 없음), invite_code used 처리.
3. **로그인** `/login` — 이메일/비밀번호 + 소셜 로그인 3종.
4. **프로그램 목록** `/programs` — 카테고리 필터 칩(전체·WELLNESS·WINE·SOCIAL·CULTURE), 카드 그리드(이미지 4:3, 오버라인 카테고리, 이름, 서브, 날짜·시간·장소, 잔여석 "N석 남음"/"마감", 가격). 회원 전용(비로그인 → /login).
5. **프로그램 상세** `/programs/[id]` — 좌: 큰 이미지 + 설명 + 타임라인(flow: 시간/내용 리스트). 우 sticky 카드: 날짜·시간·장소·잔여석, 수량(회원 본인만 → 기본 1, 초대권 사용 시 동반 1 추가 가능 — 정책 미확정, 수량 UI는 1 고정으로 시작), 총액, "예약하고 결제하기" 버튼.
6. **결제** `/checkout/[bookingId]` — 주문 요약 + 결제수단 선택(카카오페이 / 네이버페이 / 토스페이 / 신용카드 / 계좌이체) → **토스페이먼츠 결제위젯** 임베드. 성공 URL `/checkout/success`, 실패 URL `/checkout/fail`.
7. **결제 완료** — 체크 아이콘, "예약이 확정되었습니다", 프로그램명·일시·장소·결제금액, "내 예약 보기" 버튼.
8. **내 예약** `/my` — 다가오는 예약 / 지난 예약 탭, 카드 목록(상태 배지: 확정·취소·완료), 취소 버튼(정책에 따른 환불).

### F. 어드민 — `design/RSC Admin.dc.html` (`/admin/*`, role=admin만)
좌측 다크 사이드바(`#211e19`) 메뉴: 대시보드 · 회원 DB · 프로그램 · 예약·결제 · 상담 신청 · 쿠폰·초대권. 선택 항목 bg `rgba(247,243,236,.1)`.
1. **대시보드** `/admin` — KPI 4개(이번 달 매출, 신규 회원, 예약 건수, 상담 대기), 최근 예약 테이블, 마감 임박 프로그램.
2. **회원 DB** `/admin/members` — 검색 + 상태 필터(활동/승인 대기/휴면), 테이블(이름·연락처·멤버십 플랜·가입일·최근 참여·상태), 행 클릭 → 상세 드로어(예약 이력, 결제 이력, 메모, 상태 변경).
3. **프로그램** `/admin/programs` — 탭(전체 / 단일 프로그램 / RAUM SOLO 시즌), 테이블(이미지·이름·일시·장소·정원/예약(채움 바)·가격·공개상태), "새 프로그램 등록" / "새 RAUM SOLO 시즌 등록" 버튼.
4. **프로그램 편집** `/admin/programs/[id]` — 폼: 종류(단일/시즌), 이름, 서브타이틀, 카테고리, 장소, 짧은 소개, 상세 설명, 대표 이미지 업로드(Supabase Storage), 정원, 판매가, 회원가(선택), 일정(단일: 날짜·시작·종료 / 시즌: 6회차 각 날짜), 타임라인(시간+내용 반복 행 추가/삭제), 공개 여부, 저장.
5. **예약·결제** `/admin/orders` — 필터(기간·상태·프로그램), 테이블(주문번호·회원·프로그램·수량·금액·결제수단·상태·결제일), 행 클릭 → 상세(토스 paymentKey, 영수증 URL, 환불 버튼 → 토스 취소 API 호출).
6. **상담 신청** `/admin/inquiries` — 좌 목록(이름·일시·결과 유형·상태 대기/완료), 우 상세(답변 전체, 메모, 초대코드 발급 버튼 → `invite_codes` 생성 + 알림톡/이메일 발송, 상태 완료 처리).
7. **쿠폰·초대권** `/admin/coupons` — 초대코드 목록(코드·발급 대상·발급일·사용 여부·만료), 지인 초대권 잔여 현황(회원별 연 8/12매).

## Interactions & Behavior
- 버튼 hover: 주 버튼 bg `#5a3d24 → #9c6b3e`; 보조 버튼 border/text `→ #9c6b3e`. transition 150ms ease.
- 입력 focus: border `#5a3d24`. 유효성 오류 텍스트 `#a3402c` 13px.
- 로딩: 버튼 내 스피너 + disabled(opacity .6). 목록은 스켈레톤(크림 `#e9e3d7` 블록).
- 빈 상태: "아직 예약한 프로그램이 없습니다" + "프로그램 보기" 링크.
- 잔여석 0 → 카드에 "마감" 배지, 상세 버튼 disabled "마감되었습니다".
- 결제 중 이탈/실패 → booking status=pending 유지, 15분 후 크론(Supabase pg_cron 또는 Vercel Cron)으로 expired 처리하여 좌석 반환.
- 폼 검증: 휴대폰 010-XXXX-XXXX, 이메일 형식, 비밀번호 8자+.
- 반응형: 760px 이하 1열, 상세 우측 카드는 하단 고정 바(총액 + 예약 버튼)로 전환.

## State Management / Data Fetching
- 서버 컴포넌트에서 Supabase 조회(프로그램 목록·상세·내 예약). 예약 생성·결제 승인·취소는 **Route Handler(`/app/api/*`)** 에서 service role 키로 처리 — 클라이언트는 절대 가격을 서버에 보내지 않음(서버가 DB 가격으로 금액 계산).
- 인증: `@supabase/ssr` 쿠키 세션. `middleware.ts`로 `/programs`, `/my`, `/checkout` 보호, `/admin`은 `members.role = 'admin'` 확인.
- 좌석 동시성: `bookings` insert 시 Postgres 함수 `reserve_seat(session_id, member_id, qty)` 로 `FOR UPDATE` 잠금 후 잔여 확인(SCHEMA.sql 포함).

## Assets
- `design/assets/` — 사진(hero, spaces, programs 등), 로고, 폰트. 사진은 Supabase Storage `public/site` 버킷 또는 `/public/images`로 이동.
- 로고 6종 `design/logo-*.png` (위치별: GNB 엠블럼/텍스트, 다크 배경용 등 — 각 HTML의 `<img src>`에서 사용 위치 확인).

## Files
- `design/RAUM Social Club.dc.html` — 메인
- `design/RSC Fit Check.dc.html` — 상담 신청 설문
- `design/RSC Pricing.dc.html` — 가격
- `design/RSC Benefits.dc.html` — 혜택
- `design/RSC Member.dc.html` — 회원 흐름(초대코드→가입→로그인→프로그램→결제→내 예약)
- `design/RSC Admin.dc.html` — 어드민
- `design/support.js`, `design/image-slot.js` — 프로토타입 런타임(참고만, 이식 금지)
- `deploy/*.html` — 현재 정적 배포본
- `SCHEMA.sql` — Supabase 스키마·RLS·좌석 예약 함수
- `FLOWS.md` — 결제·가입·취소 시퀀스
- `SETUP.md` — 단계별 구축 순서·환경변수·외부 서비스 신청 목록
