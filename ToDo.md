# ToDo.md — 구현 순서

규칙: **한 번에 한 모듈**. 각 모듈이 끝나면 (1) 로컬 실행 방법을 비개발자에게 설명하듯 알려주고 (2) 확인할 화면/동작 체크리스트를 주고 (3) 작업 브랜치에 push 후 멈춘다. 불명확하면 추측하지 말고 질문한다. 항상 작업 브랜치(`feat/*`)에서 작업하고 `main`은 검수 후에만 병합.

플랫폼 판단: **웹**(Next.js). 모바일 앱은 만들지 않는다(반응형 웹으로 충분). 서버·DB 필요 → Supabase, 서버 로직은 Next.js Route Handler.

---

## M0. 프로젝트 골격 + 로컬 실행
- [x] `npx create-next-app@latest . --ts --tailwind --app --src-dir=false`
- [x] 의존성: `@supabase/supabase-js @supabase/ssr @tosspayments/payment-widget-sdk zod`
- [x] `Design.md` 토큰을 `tailwind.config.ts`에 등록, SamsungOne `next/font/local` 4종 로드, `app/layout.tsx`에 body 기본(bg cream, text ink, weight 500)
- [x] `.env.example` 작성(SETUP.md 목록), `README.md`에 로컬 실행법: `npm i && npm run dev`
- [x] `scripts/setup.sh`(mac) / `setup.ps1`(win): node 확인 → npm i → .env 복사 → dev 서버 실행
- 완료 조건: `localhost:3000`에 크림 배경 + "RAUM SOCIAL CLUB" 텍스트가 SamsungOne으로 보임

## M1. 브랜드 페이지 5종 (정적, 현 배포본 대체)
- [x] 공통 GNB(데스크톱/모바일 오버레이) + 푸터 + UP 플로팅 버튼
- [x] `/` — `design/RAUM Social Club.dc.html` 재현 (deploy/index.html 렌더 참고)
- [x] `/pricing` — `design/RSC Pricing.dc.html`
- [x] `/benefits` — `design/RSC Benefits.dc.html`
- [x] `/fit-check` — `design/RSC Fit Check.dc.html` 설문 UI(아직 저장은 안 함, 다음 모듈)
- [x] 이미지 `public/images/`로 이동, `next/image` 사용
- [x] 375px·768px·1440px 에서 잘림·겹침 없음
- 완료 조건: 현재 배포 사이트와 동일하게 보임. Vercel 프리뷰 URL 공유.

## M2. Supabase 연결 + 상담 신청 저장
- [x] `SCHEMA.sql` 실행(사용자가 Supabase에서 실행 — 방법 안내)
- [x] `lib/supabase/{client,server,admin}.ts`
- [x] `POST /api/inquiries` (zod 검증) → `inquiries` insert
- [x] `/fit-check` 완료 시 저장 + 결과 화면
- 완료 조건: 설문 제출 → Supabase Table Editor `inquiries`에 행 생김

## M3. 인증 + 초대코드 + 가입
- [x] Supabase Auth: 이메일/비밀번호, 카카오, 구글 (콜백 `/auth/callback`)
- [x] `/join` 초대코드 입력 → `POST /api/invites/verify`
- [x] `/join/register?code=` 가입 폼 + 소셜 가입 → 트리거로 `members` 생성 → 코드 used 처리
- [x] `/login`, 로그아웃, GNB 로그인 상태 표시(이니셜 아바타)
- [x] `middleware.ts` 보호 라우트
- 완료 조건: 어드민이 SQL로 넣은 초대코드로 가입 → `/programs` 접근 가능, 코드 없이 `/join/register` 진입 불가

## M4. 어드민 골격 + 상담 목록 + 초대코드 발급
- [x] `/admin` 레이아웃(사이드바, role 검사)
- [x] `/admin/inquiries` 목록/상세, 메모, 상태 변경, "초대코드 발급"(코드 생성 + 화면 표시·복사. 이메일 발송은 lib/notify.ts 구조만, RESEND_API_KEY 등록 시 자동 발송)
- [x] `/admin/coupons` 초대코드 목록
- 완료 조건: 상담 신청 → 어드민에서 코드 발급 → 이메일 수신 → 그 코드로 가입

## M5. 프로그램 CRUD (어드민) + 회원 목록/상세
- [x] `/admin/programs` 탭(전체/단일/시즌) 테이블
- [x] `/admin/programs/new`, `/admin/programs/[id]` 폼: 종류·이름·서브·카테고리·장소·소개·설명·이미지 업로드(Storage)·정원·판매가·회원가·일정(단일 1 / 시즌 6)·타임라인·공개
- [x] `/programs` 카드 그리드 + 카테고리 필터, 잔여석(`session_availability`)
- [x] `/programs/[id]` 상세 + sticky 예약 카드(모바일 하단 고정바)
- 완료 조건: 어드민에서 등록·공개한 프로그램이 회원 목록에 보이고 비공개는 안 보임

## M6. 예약 + 토스 결제 + 내 예약
- [ ] `POST /api/bookings` → `rpc('reserve_seat')` (pending, 15분)
- [ ] `/checkout/[bookingId]` 토스 결제위젯 (테스트 키)
- [ ] `/checkout/success` → `POST /api/payments/confirm` (금액 검증 → 토스 confirm → payments/bookings 갱신)
- [ ] `/checkout/fail`
- [ ] `POST /api/payments/webhook`
- [ ] pg_cron `expire_pending_bookings` 5분
- [ ] `/my` 다가오는/지난 예약, 취소 → `POST /api/bookings/[id]/cancel` → 토스 cancel
- [ ] 예약 확정 이메일
- 완료 조건: 테스트 카드로 결제 → 예약 확정 → 내 예약에 표시 → 취소 → 토스 대시보드에서 취소 확인. 두 브라우저로 마지막 1석 동시 결제 시 한 명만 성공.

## M7. 어드민 예약·결제 + 회원 DB + 대시보드
- [ ] `/admin/orders` 필터·테이블·상세(영수증, 환불 버튼)
- [ ] `/admin/members` 검색·필터·상세 드로어(예약/결제 이력, 메모, 상태)
- [ ] `/admin` 대시보드 KPI(이번 달 매출, 신규 회원, 예약 수, 상담 대기), 최근 예약, 마감 임박
- 완료 조건: 실제 데이터로 KPI 숫자 일치

## M8. 마무리 & 라이브 전환
- [ ] 이용약관·개인정보처리방침·환불규정 페이지(`/terms`, `/privacy`, `/refund`) — 문구는 사용자 제공
- [ ] 에러·로딩·빈 상태 화면 전수 점검(Design.md 규칙)
- [ ] 접근성(포커스 링, 대비), Lighthouse 모바일 90+
- [ ] 토스 라이브 키 교체, 웹훅 URL 등록, Supabase Redirect URL 등록
- [ ] Vercel 도메인 `raumsocialclub2026.vercel.app` 새 프로젝트로 이전
- [ ] `main` 병합 → 배포

## 2차 (별도 지시 후)
- 멤버십 결제/분납(빌링키), 네이버 로그인, 지인 초대권 사용, 알림톡(솔라피) 전환, 사이트 이미지 CMS, 리마인더 자동 발송
