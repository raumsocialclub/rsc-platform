# 구축 순서 & 준비물

## 0. 사업자 준비 (개발과 병행, 대표가 직접)
- [ ] 사업자등록증, **통신판매업 신고** (온라인 결제 필수)
- [ ] 토스페이먼츠 가맹 신청 (https://www.tosspayments.com) — 사업자등록증·통장사본·대표 신분증. 심사 1~3영업일. 승인 전엔 테스트 키로 개발.
- [ ] 카카오 개발자 앱 등록 (카카오 로그인 · REST API 키 · Redirect URI = Supabase callback URL)
- [ ] 구글 클라우드 OAuth 클라이언트 (동일 Redirect URI)
- [ ] 네이버 로그인 앱 등록 (2차 — Supabase 기본 미지원, 커스텀 구현 필요)
- [x] 이용약관 · 개인정보처리방침 · 환불규정 페이지 (토스 심사 시 URL 요구) — `/terms` `/privacy` `/refund` 자리 문구, 실제 문구로 교체 필요
- [ ] 알림톡: 카카오 채널 비즈니스 인증 + 솔라피(Solapi) 가입, 템플릿 심사(예약 확정·초대코드·리마인더 3종). 심사 전엔 이메일(Resend)로 대체.

## 1. Supabase
> 2026-09-22 완료: 프로젝트 `rsc-platform`(ref `vfjpouuwvwgiqpwttyup`, Seoul) 생성, `SCHEMA.sql` 전체 실행됨.
> 대시보드: https://supabase.com/dashboard/project/vfjpouuwvwgiqpwttyup
1. 새 프로젝트(Seoul 리전) → SQL Editor에 `SCHEMA.sql` 실행.
2. Authentication → Providers: Email, Kakao 활성화(카카오 개발자 콘솔 REST API 키/시크릿, Redirect URI 는 Supabase 가 보여주는 `https://<ref>.supabase.co/auth/v1/callback`). 네이버는 Supabase 밖에서 직접 연동: 네이버 개발자센터 앱의 Client ID/Secret 을 `NAVER_CLIENT_ID`/`NAVER_CLIENT_SECRET` 에 넣고 Callback URL 로 `https://<도메인>/auth/naver/callback` 등록, 제공 정보에 이메일·이름·휴대전화 포함. 둘 다 준비되면 `NEXT_PUBLIC_AUTH_PROVIDERS=kakao,naver`.
3. Storage → 버킷 `programs`(public) — SCHEMA.sql 끝의 M5 블록이 버킷과 정책을 함께 만듭니다(적용 완료). `site` 버킷은 필요 시 추가.
4. Database → Extensions → `pg_cron` 활성화 → `select cron.schedule('expire-bookings','*/5 * * * *',$$select expire_pending_bookings()$$);`
5. 첫 관리자: 가입 후 SQL `update members set role='admin' where email='...';`

## 2. Next.js 프로젝트
```
npx create-next-app@latest rsc --ts --tailwind --app
npm i @supabase/supabase-js @supabase/ssr @tosspayments/payment-widget-sdk zod
```
폴더 구조(권장)
```
app/
  (public)/page.tsx  fit-check/  pricing/  benefits/
  (auth)/login/  join/  join/register/  auth/callback/route.ts
  (member)/programs/  programs/[id]/  checkout/[bookingId]/  checkout/success/  checkout/fail/  my/
  admin/  admin/members/  admin/programs/  admin/programs/[id]/  admin/orders/  admin/inquiries/  admin/coupons/
  api/inquiries/  api/invites/verify/  api/bookings/  api/bookings/[id]/cancel/  api/payments/confirm/  api/payments/webhook/
lib/supabase/{client,server,admin}.ts   lib/toss.ts   lib/notify.ts
middleware.ts
```
디자인 재현: `design/` HTML을 열고 Tailwind로 이식. 폰트는 `next/font/local`로 SamsungOne 4종 로드. 색상은 `tailwind.config` theme.extend.colors에 README 토큰 등록(cream `#f7f3ec`, card `#f7f3ec`, ink `#211e19`, brown `#5a3d24`, brownHover `#9c6b3e`, gold `#e2b478`).

## 3. 환경변수 (Vercel Project Settings → Environment Variables)
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=          # 서버 전용, 절대 NEXT_PUBLIC 금지
NEXT_PUBLIC_TOSS_CLIENT_KEY=        # test_ck_... → 실서비스 live_ck_...
TOSS_SECRET_KEY=                    # test_sk_... → live_sk_...
TOSS_WEBHOOK_SECRET=
SOLAPI_API_KEY= / SOLAPI_API_SECRET= / SOLAPI_SENDER= / KAKAO_PF_ID=
RESEND_API_KEY=
NEXT_PUBLIC_SITE_URL=https://rsc-platform.vercel.app
```

## 4. Vercel 배포
- Vercel 프로젝트 `rsc-platform` → 주소 `https://rsc-platform.vercel.app`. 기존 `raumsocialclub2026.vercel.app` 는 다른 Vercel 팀 소유라 이전하지 않음. 실도메인(`www.raumsocialclub.co.kr`) 연결 시: Settings → Domains → Add → 안내되는 DNS 레코드(CNAME `cname.vercel-dns.com`) 등록 → `NEXT_PUBLIC_SITE_URL`·Supabase Redirect URL·소셜 로그인 Redirect URI·토스 웹훅 URL 을 새 주소로 변경.
- Supabase Auth → URL Configuration → Site URL `https://rsc-platform.vercel.app`, Redirect URLs 에 `https://rsc-platform.vercel.app/auth/callback` (실도메인 연결 후 그 주소의 `/auth/callback` 추가). 소셜 로그인 붙일 때 필요.
- 토스 개발자센터 → 웹훅 URL `https://<domain>/api/payments/webhook` 등록 (`TOSS_WEBHOOK_SECRET` 을 넣었다면 `?key=<값>` 붙임). 이벤트: PAYMENT_STATUS_CHANGED.
- 결제 키: 지금은 토스 문서 공용 테스트 키. 가맹점 키 발급 후 Vercel 환경변수 `NEXT_PUBLIC_TOSS_CLIENT_KEY`(test_gck_/live_gck_)·`TOSS_SECRET_KEY`(test_gsk_/live_gsk_) 값만 바꾸고 재배포.

## 4-1. Vercel 방화벽 (국가 차단 · 요청 제한)
- Vercel 대시보드 → 프로젝트 `rsc-platform` → **Firewall** → Configure → **+ New Rule**
  - 국가 차단: Condition = Country, 값 선택 → Action = **Deny** → Save → **Publish**
  - 요청 제한: Condition = Request Path (예: starts with `/api`) → Action = **Rate Limit** → 허용 횟수 → Save → Publish
  - IP 차단: Condition = IP Address → Action = Deny (어드민 일반 설정의 차단 IP 와 동일 효과)
  - 트래픽 폭주 시 상단 **Attack Challenge Mode** 를 잠시 켠다
- 어드민 `/admin/settings` 에서 되는 것: 점검 모드, 보안 헤더, 관리자 허용 IP, 로그인 잠금, 차단 IP·국가, 캐시, 알림, 환불 정책

## 4-2. 검색엔진 등록 (SEO · GEO, 실도메인 연결 후)
- 오픈 전에는 어드민 `/admin/seo` 의 **검색 노출 켜기** 가 꺼져 있어 robots.txt 가 검색엔진을 막고 모든 페이지에 noindex 가 붙는다. AI 크롤러(GPTBot·ClaudeBot·PerplexityBot·Google-Extended)는 기본 허용.
- **구글 서치콘솔**: search.google.com/search-console → 속성 추가 → URL 접두어 `https://도메인` → 확인 방법 **HTML 태그** → `content="…"` 값만 복사 → 어드민 SEO 설정 → 검색엔진 소유 확인 → 구글 칸에 저장 → 서치콘솔 "확인" → 왼쪽 Sitemaps 에 `sitemap.xml` 제출
- **네이버 서치어드바이저**: searchadvisor.naver.com → 웹마스터 도구 → 사이트 등록 `https://도메인` → **HTML 태그** → `content="…"` 값 복사 → 어드민 네이버 칸에 저장 → 소유확인 → 요청 → 사이트맵 제출 `https://도메인/sitemap.xml`, 검증 → robots.txt 검증
- **오픈 때**: 어드민 SEO 설정 → 검색 노출 켜기 → 저장. 이후 서치콘솔·서치어드바이저에서 색인 요청.
- 확인 주소: `/robots.txt` `/sitemap.xml` `/llms.txt`. 공유 미리보기 확인: 카카오톡 채팅창에 주소 붙여넣기(캐시가 남으면 developers.kakao.com/tool/debugger/sharing 에서 초기화)

## 4-3. 관리자 계정 (M12)
- 주관리자(owner)는 DB 에서 한 번만 지정: Supabase SQL Editor → `update members set role = 'owner' where lower(email) = '<이메일>';` (현재 nse101@kakao.com)
- 부관리자는 어드민 → **관리자 관리** 에서 초대한다(링크 48시간·1회용). `RESEND_API_KEY` 가 있으면 메일로 나가고, 없으면 화면의 링크를 복사해 전달한다.
- 초대 수락(`/admin-invite/<token>`)은 서버의 `SUPABASE_SERVICE_ROLE_KEY` 가 있어야 동작한다(Vercel 에 등록됨). 로컬 `.env.local` 에 키가 없으면 로컬에서는 수락 화면이 "처리할 수 없습니다" 로 나온다.
- 관리자 권한 잠김 복구: 주관리자가 정지되었거나 허용 IP 에 막힌 경우 Supabase SQL Editor 에서 `update members set status='active' where role='owner';`, 허용 IP 는 `delete from site_content where id='settings.security';`

## 5. 개발 순서 (권장 마일스톤)
1. **W1–2** 브랜드 페이지 5종 이식(메인·상담·가격·혜택) + 상담 저장 API + 어드민 상담 목록 → 현 배포본 교체.
2. **W3–4** Auth(이메일·카카오·구글) + 초대코드 + 프로그램 목록/상세(DB) + 어드민 프로그램 CRUD/이미지 업로드.
3. **W5–6** 예약(reserve_seat) + 토스 결제 confirm + 내 예약 + 어드민 예약·결제 + 취소/환불.
4. **W7** 알림톡·이메일, 대시보드 KPI, 쿠폰·초대권, 멤버십 결제.
5. **W8** QA(테스트 결제 → 라이브 키 전환), 약관 페이지, 성능·접근성, 모바일 점검.

## 6. 테스트 체크리스트
- [ ] 동시 예약 시 정원 초과 안 됨 (두 브라우저로 마지막 1석 동시 결제)
- [ ] 결제 금액 조작 시 confirm 거절 (successUrl amount 변조)
- [ ] 15분 미결제 booking 자동 expired, 좌석 복구
- [ ] 카카오/구글 로그인 후 members row 생성 및 초대코드 used 처리
- [ ] 어드민 아닌 계정으로 `/admin` 접근 차단
- [ ] 환불 후 payments/bookings 상태 및 토스 대시보드 일치
- [ ] 모바일(375px)에서 결제위젯·상세 하단 고정바 정상
