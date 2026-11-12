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
- [x] `POST /api/bookings` → `rpc('reserve_seat')` (pending, 15분)
- [x] `/checkout/[bookingId]` 토스 결제위젯 (테스트 키)
- [x] `/checkout/success` → `POST /api/payments/confirm` (금액 검증 → 토스 confirm → payments/bookings 갱신)
- [x] `/checkout/fail`
- [x] `POST /api/payments/webhook`
- [x] pg_cron `expire_pending_bookings` 5분
- [x] `/my` 다가오는/지난 예약, 취소 → `POST /api/bookings/[id]/cancel` → 토스 cancel
- [x] 예약 확정 이메일
- 완료 조건: 테스트 카드로 결제 → 예약 확정 → 내 예약에 표시 → 취소 → 토스 대시보드에서 취소 확인. 두 브라우저로 마지막 1석 동시 결제 시 한 명만 성공.

## M7. 어드민 예약·결제 + 회원 DB + 대시보드
- [x] `/admin/orders` 필터·테이블·상세(영수증, 환불 버튼)
- [x] `/admin/members` 검색·필터·상세 드로어(예약/결제 이력, 메모, 상태)
- [x] `/admin` 대시보드 KPI(이번 달 매출, 신규 회원, 예약 수, 상담 대기), 최근 예약, 마감 임박
- 완료 조건: 실제 데이터로 KPI 숫자 일치

## M8. 마무리 & 라이브 전환
- [x] 이용약관·개인정보처리방침·환불규정 페이지(`/terms`, `/privacy`, `/refund`) — 자리 문구(`lib/legal/content.ts`), 실제 문구는 사용자 제공 후 교체
- [x] 에러·로딩·빈 상태 화면 전수 점검(Design.md 규칙) — `app/not-found`, `app/error`, `app/global-error`, 회원·어드민 `loading`
- [x] 접근성(포커스 링, 대비), Lighthouse 모바일 90+ — 로컬 측정 `/` 96/95/100/100, `/pricing` 94/96, `/login` 98/96, `/terms` 97/91 (대비 경고는 Design.md 고정색 overline)
- [ ] 토스 라이브 키 교체, 웹훅 URL 등록, Supabase Redirect URL 등록 — 사용자 작업 (SETUP.md 4)
- [x] ~~Vercel 도메인 `raumsocialclub2026.vercel.app` 새 프로젝트로 이전~~ → 이전하지 않음(다른 Vercel 팀 소유). `rsc-platform.vercel.app` 사용, 이후 실도메인 `www.raumsocialclub.co.kr` 연결 예정(사용자 결정 2026-09-23)
- [ ] `main` 병합 → 배포

## M9. 어드민 고도화 — 사이트 관리(CMS) · 통계 · 리포트 (사용자 요청)
- [x] 사이트 콘텐츠 관리: `site_content` + `lib/cms/schema.ts`(문서·필드 정의, 기본값 = 기존 문구) → `/admin/site` 편집기(문구·사진 업로드·색상·연락처·섹션 표시/순서, 저장 즉시 게시, 이력·기본값 복원)
- [x] 홈·가격·혜택·약관·GNB·푸터가 CMS 데이터로 렌더 (기본값 상태에서 기존 화면과 섹션 위치·높이 동일)
- [x] 색상 테마: tailwind 토큰 → CSS 변수, 어드민에서 변경 시 전체 반영
- [x] 접속 통계: `page_views` 비콘(`/api/track`), 일별 PV/UV·페이지·유입·기기·국가 (`stats_page_views`)
- [x] `/admin/stats`: 기간(7/30/90일·이번 달·지난 달·올해·직접 지정) 매출(일별·프로그램·결제수단)·예약·회원·상담·접속·전환 퍼널·관리자 활동 로그, 항목별/전체 CSV
- [x] 관리자 활동 로그 `admin_logs` (사이트 저장, 환불, 회원 수정, 프로그램 등록/공개, 초대코드 발급)
- [ ] 페이지 빌더(섹션 자유 추가·레이아웃 편집)는 범위 밖 — 필요 시 별도 지시

## M10. 어드민 일반 설정 (사용자 요청)
- [x] `/admin/settings`: 사이트 상태(점검 모드·허용 IP) · 보안(보안 헤더·관리자 허용 IP·로그인 연속 실패 잠금) · 접근 차단(IP·국가) · 페이지 캐시(CDN 시간·비우기) · 알림(이메일 켜기·발신자) · 결제/환불(일수·환불률)
- [x] `proxy.ts` 가 요청 앞단에서 차단·점검·관리자 IP·보안 헤더·캐시 헤더 적용(설정 30초 캐시), `/api/auth/login` 잠금, 환불 정책·알림 설정 연동
- [x] Vercel 함수 리전 서울(icn1). 국가 차단·요청 제한·공격 대응은 Vercel Firewall 안내(SETUP.md 4-1, 일반 설정 화면 하단)

## M11. SEO · GEO + 소식 게시판 (사용자 요청)
- [x] `/admin/seo`: 검색 노출 스위치(기본 꺼짐 → 오픈 때 켬) · 브랜드명 · 기본 설명 · 키워드 · 대표 이미지(OG, 기본 메인 히어로) · 구글/네이버 소유 확인 코드 칸 · AI 크롤러 허용(기본 켜짐) · llms.txt 본문 · 조직 정보(구조화 데이터) · 페이지별 제목/설명/이미지/검색 제외
- [x] `app/robots.ts` `app/sitemap.ts` `app/llms.txt` 자동 생성, 전 페이지 title/description/OG/canonical/robots 메타(`lib/seo/get.ts`), 어드민·회원·로그인 화면 noindex, Organization·WebSite·FAQPage·NewsArticle·Breadcrumb JSON-LD
- [x] 메인 08 FAQ 섹션(`home.faq`, 10문항 초안 — 사이트 관리에서 수정) 
- [x] 소식 게시판: `posts` 테이블(RLS) · `/admin/posts` 목록/새 글/편집(사진 업로드·발행·임시 저장·주소 자동) · 공개 `/news` `/news/[slug]`(마크다운 본문) · GNB·푸터 링크 · 사이트맵·llms.txt 자동 포함
- [ ] 실도메인 연결 후 구글 서치콘솔·네이버 서치어드바이저 등록 → 소유 확인 코드 입력 → 사이트맵 제출 (SETUP.md 4-2) — 사용자 작업

## M12. 관리자 권한 3단계 + 부관리자 초대 (사용자 요청)
- [x] 역할 owner(주관리자: nse101@kakao.com) > admin(부관리자) > member. `is_admin()` 은 활동 상태의 admin·owner, `is_owner()` 추가. 정지(paused) 즉시 어드민 차단
- [x] `/admin/admins`(주관리자 전용): 부관리자 초대(이름·이메일 → 48시간·1회용 링크, 화면 표시+복사, 이메일 키 있으면 발송), 관리자 목록(역할·상태·마지막 로그인), 정지/해제, 권한 해제, 초대 이력·취소, 권한표
- [x] `/admin-invite/[token]`: 이름·비밀번호 → 계정 생성(트리거가 `app_metadata.admin_invite` 로 초대코드 없이 role=admin 생성) → 바로 로그인. 이미 가입된 이메일이면 권한만 부여
- [x] 부관리자 제한: 일반 설정·SEO 설정은 읽기 전용(저장 API 403), 회원 목록 CSV(통계 리포트·회원 DB 버튼) 주관리자만, 관리자 관리 메뉴 숨김. 환불은 가능하되 사유 필수 + 활동 로그(처리자·금액·사유)
- [x] `members.last_login_at`(이메일·소셜 로그인 시 기록), 관리자 로그인 후 기본 목적지 `/admin`, `admin_logs` 에 admin.invite / admin.invite.revoke / admin.role / admin.status / admin.accept

## M13. 오픈 준비 — 모니터링 · 자동 테스트 · 배포 게이트 · 스테이징 · 점검 루틴 (사용자 요청)
- [x] Sentry(`@sentry/nextjs`): 서버·엣지·브라우저 설정, `instrumentation.ts` onRequestError, error/global-error 캡처, `withSentryConfig`. DSN 없으면 비활성. `lib/alert.ts` opsAlert → 결제 승인 실패·웹훅 실패·환불 실패를 Sentry + 운영 알림 메일(일반 설정 → 알림 → 운영 알림 받는 이메일, 기본 theraumai@gmail.com)
- [x] 자동 테스트 Vitest 47개: 가입(초대코드 검증·사용·관리자 초대 토큰), 예약(book_session 오류 코드·성공), 결제(금액 검증·만료·중복 승인·토스 실패 알림·웹훅 재조회·취소 동기화), 환불(전액·부분·정책 일수·회원 취소 API·관리자 사유 필수·로그). `npm test`, `npm run check`
- [x] GitHub Actions `CI`(모든 push/PR: lint·typecheck·test·build) + `Deploy production`(main: 테스트 통과 → Vercel Deploy Hook). `vercel.json` main 자동배포 끔
- [x] 스테이징: `staging` 브랜치 → Vercel Preview(`rsc-platform-git-staging-…`), Preview 환경변수 `NEXT_PUBLIC_SITE_URL`·`NEXT_PUBLIC_APP_ENV=staging` 분리, 화면 상단 STAGING 띠
- [x] `MAINTENANCE.md` 월 1회 점검 루틴 + 보고 양식, SETUP 4-4~4-8(Vercel Pro·Supabase Pro 전환 단계, Deploy Hook·GitHub Secret·main 보호, Sentry 가입·DSN, 스테이징)
- [ ] 사용자: Vercel Pro·Supabase Pro 결제, Sentry 가입 후 DSN 을 Vercel 환경변수에, Deploy Hook → GitHub Secret, main 보호 규칙 (SETUP 4-4~4-6)
- [ ] 스테이징 DB: Supabase 프로젝트 한도(무료 2개) 때문에 보류 → Pro 전환 또는 옛 프로젝트 정리 후 "스테이징 DB 만들어라"

## M16. 두 갈래 홈 — 소셜클럽 / 1:1 매칭 (사용자 요청, 2026-11)
- [x] 홈 게이트 히어로(전환 탭 · 스와이프) + 두 방식 비교 카드 + CTA 두 버튼
- [x] `/social` `/matching` 트랙 페이지 (CMS `social.*` `matching.*`) — 상품 문구는 사업전략(11.03) 기준: 소셜클럽 가입비 구성, ACCESS 5회 · SIGNATURE 10회 만남권, MERRY, 가입 심사 섹션
- [x] 가격 안내 기본값을 같은 구조로 갱신 (SOCIAL CLUB 카드, 관계 확장 프로그램, YOUR PATH)
- [x] 가입비·연회비 비공개 (사용자 결정): 공개 페이지·FAQ·llms.txt 에서 금액 제거, 「대면 상담에서 안내」
- [x] 상담 신청 「관심 있는 방식」 칩 + `?track=` 사전 선택 → `answers.route` → 어드민 「관심 방식」
- [x] GNB·푸터 메뉴(소셜클럽 · 1:1 매칭), sitemap·llms.txt·페이지 SEO 문서
- [x] 운영 배포 (2026-11-06, 5e3b506)

## M17. 모든 공개 문구 어드민 편입 + 문구 검색 (사용자 요청, 2026-11-09)
- [x] 하드코딩 문구 전수 조사 → CMS 문서로 편입: 메뉴 이름(`global.nav`), 비교 카드 버튼·작은 제목(`home.tracks`), 전환 바 한 줄 설명(`home.gate`), 하단 상담 띠 3종(`home.cta` `social.cta` `matching.cta`), 회원 전용 행사 제목·설명(`home.solo`), 멤버십 카드 버튼·확장 옵션 제목·스와이프 안내(`matching.plans`), 이런 분께 버튼(`matching.who`), 상담 신청 양식 전체(`apply.form`), 소식 고정 문구(`news.page`), 혜택 리드 모드 문구(`benefits.hero`)
- [x] 사이트 관리 탭을 실제 페이지 구조에 맞게 재배치: 소셜클럽 탭에 포지셔닝·TASTE SOCIAL·MOMENTS, 1:1 매칭 탭에 회원 전용 행사. 안 쓰는 옛 히어로·옛 멤버십 문서는 목록에서 숨김(`hidden`, 저장값 보존). 「상담 신청」「소식」 탭 추가
- [x] 「문구 검색」(사이트에서 본 문장을 붙여 넣으면 탭 › 섹션 › 항목 위치를 찾아 줌, `lib/cms/search.ts` + 테스트) · 「사이트에서 보기」가 해당 섹션 앵커로 이동 · 섹션 목록에 마지막 수정일
- [x] 저장 시 캐시 갱신 범위를 `/` `/social` `/matching` `/fit-check` `/news` 로 확장
- [x] 운영 배포 (2026-11-09, 5c3db39 → 소셜클럽 가입 심사 분리 5f963db)
- [x] 상담 신청 「관심 방식」(소셜클럽 · 1:1 매칭 · 상담 후 결정) + 「들어온 경로」(직전 페이지 · 어느 상담 버튼 · 외부 링크) 기록 → 어드민 목록 열·상세·필터·CSV(interest, entry 열) (`lib/inquiries/track.ts`)
- [x] 위 항목 운영 배포 (2026-11-09, 9c36f89)
- [x] 색상 테마가 새 디자인 토큰(--ds-primary 등)에 반영되지 않던 버그 수정 + 하드코딩 파란색 제거, 어드민은 기본 팔레트 고정 — 운영 배포 (2026-11-09, 8a49063)
- [x] 채널톡 버튼: 일반 설정 → 「채널톡 플러그인 키」가 있으면 공개 페이지(어드민·로그인·설문·결제 제외)에 공식 로더 + `ChannelIO('boot')` 로 싣고, 「맨 위로」 버튼은 그 위로 올림 (`components/site/ChannelTalk.tsx`, `lib/settings/channelTalk.ts`). 운영 DB settings.inquiry 에 플러그인 키 저장 완료
- [x] 위 항목 운영 배포 (2026-11-09, d875e95)
- [x] 푸터 「개인정보처리방침」 링크 색을 이용약관·환불규정과 같은 회색으로 통일 — 운영 배포 (2026-11-09, 4e73c18)
- [x] 사진 생동감 `img-live`: 대문 히어로 배경·모든 섹션 사진·소식·프로그램 사진에 호버 확대 + 빛줄기, 누름(터치) 효과 (`app/globals.css`, `ImageBlock`)
- [x] 모바일 생동감: 스크롤 시 사진 가라앉기(settle, 스크롤 연동 + is-in 폴백), 대문 배경 켄 번즈, 스와이프 카드 가운데 포커스(`swipe-item`), 카드·사진 누름 효과(iOS :active 활성화), 카드 떠오름 전환 속성 보정
- [x] 위 항목(사진 생동감 + 모바일 생동감) 운영 배포 (2026-11-10, 6b64886)
- [x] 대문 사진 호버 복구(켄 번즈를 상자로 이동) + 「동작 줄이기」 기기에서도 호버·누름 반응 유지 — 운영 배포 (2026-11-10, beb541a)
- [x] 상단 메뉴 재배치 — 순서 「브랜드소개 · 소셜클럽 · 1:1 매칭 · 소식 · FAQ」, 로고와 버튼 사이 가운데 정렬, 간격 24px(lg 48px) · lg 15px 글자, 모바일 메뉴·푸터도 같은 순서. 「소개」 → 「브랜드소개」(CMS global.nav 기본값). 운영 배포 (2026-11-11, 61afea7)
- [x] 푸터 「패밀리 사이트」 열 → 「제휴문의」 열(제휴 담당 010-9272-7783 · se.na@theraum.co.kr · 제휴 안내 링크) + `/partner` 제휴문의 페이지(협업 분야 3종 · 제휴 담당/일반 문의 카드 · 제안서 안내, CMS partner.page · SEO seo.partner · 사이트맵·llms.txt 등록) — 운영 배포 (2026-11-11, c3dfb25)
- [x] 푸터 정리: 2열 「문의」 → 「서비스 문의」, 3열 제휴문의는 연락처 없이 「제휴문의 →」 링크 하나(/partner). 운영 배포 (2026-11-11, 876444a)
- [x] 제휴문의 접수 양식: /partner 연락처 카드 → 실제 양식(유형 4종 · 회사 · 담당자 · 휴대전화 · 이메일 · 내용 · 제휴문의용 개인정보 수집·이용 안내 동의) → `POST /api/partner` → `partner_inquiries`(DB 적용 완료, RLS admin, 1년 보관 크론) → 어드민 `/admin/partners`(목록·상세·상태·메모, 사이드바 배지) + 제휴 담당 이메일 접수 알림. 운영 배포 (2026-11-11, 876444a)
- [x] 제휴문의 첨부 파일: 양식에서 최대 3개(파일당 10MB · pdf·hwp·hwpx·doc·docx·xls·xlsx·ppt·pptx·jpg·png) → 서명 업로드 URL(`/api/partner/upload-url`)로 비공개 버킷 `partner-files` 에 직접 업로드(DB·버킷·정책 적용 완료) → 어드민 상세에서 내려받기(5분 서명 URL). 보관 1년 크론이 첨부·고아 파일도 정리. 운영 배포 (2026-11-11, 876444a)
- [x] 제휴문의 양식 안내 보강: 제안 내용 「10자 이상 3,000자까지」 명시 + 글자 수 카운터, 보내기 버튼이 비활성일 때 「보내려면 아직 필요한 것: …」 안내. 운영 배포 (2026-11-11, 876444a)
- [x] 휴대전화 자동 하이픈 보강(제휴문의 · 상담 신청 공통): 브라우저 자동완성이 React 보다 먼저 채운 값 감지, 칸을 벗어날 때 재서식, 숫자만 있어도 유효(서버로는 정규화해 전송). 운영 배포 (2026-11-11, 876444a)
- [x] 첨부 업로드 오류 수정: 한글 파일명이 저장소 키로 들어가 거부되던 문제 → 경로는 inbox/<uuid>/file.<확장자>(영문만), 원래 파일명은 files[].name 으로 내려받기에 사용. 업로드 실패 시 원인 문구 표시. 운영 배포 (2026-11-11, 876444a)
- [x] 상담 신청 5항목화: 이름 · 휴대폰 + 직업(9종) · 학력(10종) · 거주지역 시/도(15종, 충청·전라·경상은 남북 합침, 해외 포함; 시/군/구는 선택) — `lib/inquiries/profile.ts`, `/api/inquiries` 가 목록 밖 값은 거부, `answers.job · education · region · district` 저장 → 어드민 목록 열 · 상세 행 · CSV 뒤 4열 그대로 반영. 동의문·약관·개인정보처리방침 2026-11-12 판(동의 버전 2026-11-12). 운영 DB `site_content` 의 `legal.privacy` 저장본은 2026-11-12 01:07 UTC 에 새 기본값과 같은 내용으로 갱신 완료(옛 저장본은 2026-11-04 기본값과 동일했음). 운영 배포 (2026-11-12, 5c605e3)
- [x] 마케팅 정보 수신 동의(선택): 상담 신청 개인정보 동의 아래 카드(접기/펼치기, 목적 문구는 소셜클럽·1:1 매칭·상담 후 결정별, 방법 전화·문자·카카오톡, 항목 이름·휴대폰·거주지역·관심 방식·상담 이력, 철회 시까지 + 2년마다 재확인) → `marketing_consents` 표(DB 적용 완료, RLS admin, 철회 기록 1년 크론) + `answers.marketing` → 어드민 「마케팅 수신」(`/admin/marketing`: 동의 중·철회 탭, 철회/취소, 주관리자 CSV, 재확인 예정일 30일 전 표시) + 상담 상세 「마케팅 수신」 행 + 리드 CSV marketing·marketing_at 열. 개인정보처리방침 제2조 2-2호·제4조 2-2호·제9조 추가(동의문 버전 MARKETING_CONSENT_VERSION 2026-11-12). 운영 DB `legal.privacy` 저장본도 2026-11-12 01:48 UTC 에 같은 내용으로 재갱신. 2년 재확인 발송은 수동(어드민 목록의 「확인 필요」 표시 기준). 운영 배포 (2026-11-12, 0b4b5a2)
- [x] 1:1 매칭 멤버십 가입비 공개(결혼중개업 요건): `/matching` 03 섹션을 등급 이름 · 한글 이름 · 가입비(VAT 포함) · 상담 버튼만 있는 3장 카드로 교체 — RAUM CLASSIC 4,400,000원 · RAUM SIGNATURE 8,800,000원(주력, 다크) · RAUM PRIVÉ 22,000,000원. 「필요한 만큼 추가」·하단 안내 제거. 회원 전용 행사(home.solo)·FAQ·대문 비교 카드·혜택·SEO 설명·llms.txt 의 ACCESS/SIGNATURE/MERRY 문구를 새 이름으로 교체(RAUM SOLO = 연 6회 프리미엄 미팅 파티, 1:1 매칭 가입 회원 1회 참여권). 운영 DB site_content(matching.plans · home.solo · matching.faq · home.faq) 저장본도 같은 내용으로 갱신(2026-11-12 02:1x UTC). 숨겨진 /pricing 문서는 옛 등급·금액 그대로(페이지 삭제 여부 미결). 운영 배포 (2026-11-12, eae9d18)
- [x] 멤버십 대표 상품 표시를 「주력」 → 「★」 배지(별표만)로, 공개 문구의 나이 범위(만 25~45세)를 모두 삭제해 「싱글」로만 표현(FAQ · 대문 비교 카드 · 혜택 · 이런 분께 · SEO 설명 · llms.txt; 운영 DB home.faq · matching.who · matching.plans 저장본도 갱신). 운영 배포 (2026-11-12, fa4452c)
- [x] 상단 메뉴에서 FAQ 제거(모바일 메뉴 포함, 푸터 「자주 묻는 질문」은 /social#faq 로), 메인 페이지 FAQ 섹션 제거 — FAQ 문서(home.faq)는 소셜클럽 페이지 전용으로 CMS 「소셜클럽」 탭으로 이동(저장값 유지), 1:1 매칭 FAQ 는 그대로. 운영 배포 (2026-11-12, 7809020)

## 2차 (별도 지시 후)
- 멤버십 결제/분납(빌링키), 네이버 로그인, 지인 초대권 사용, 알림톡(솔라피) 전환, 사이트 이미지 CMS, 리마인더 자동 발송
