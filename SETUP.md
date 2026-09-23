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
NEXT_PUBLIC_SITE_URL=https://rsc-platform.vercel.app   # Production. Preview(스테이징)는 https://rsc-platform-git-staging-theraumai-5200.vercel.app
NEXT_PUBLIC_APP_ENV=production     # Preview 에는 staging (화면 상단 STAGING 띠)
NEXT_PUBLIC_SENTRY_DSN=            # Sentry (M13). 4-6 참고
VERCEL_DEPLOY_HOOK_PRODUCTION=     # Vercel 이 아니라 GitHub → Settings → Secrets 에 넣는 값 (4-5)
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

## 4-4. 유료 플랜 전환 (오픈 전 필수, 대표가 직접 결제)
**Vercel Pro** (월 $20, 상업적 이용은 Hobby 약관 위반이라 필수)
1. https://vercel.com/theraumai-5200 → 왼쪽 위 팀 이름 옆 **Settings** → 왼쪽 메뉴 **Billing** → **Upgrade to Pro** → 카드 등록 → 확인
2. 전환 후 Settings → General 에서 플랜이 Pro 로 보이면 끝. 프로젝트·환경변수는 그대로 유지된다
3. Pro 가 되면 Claude 에게 "배포 정책 켜라" 라고 하면 운영 배포를 Deploy Hook 전용으로 잠근다(Hobby 에서는 이 설정이 막혀 있어 vercel.json 의 main 자동배포 끔으로 대신한다)

**Supabase Pro** (월 $25, 일일 백업·프로젝트 일시정지 없음·스테이징용 두 번째 프로젝트 가능)
1. https://supabase.com/dashboard → 왼쪽 위 조직 `raumsocialclub 2026` → **Organization settings** → **Billing** → **Upgrade to Pro** → 카드 등록
2. 같은 화면에서 Spend Cap 은 켜 둔다(예상 밖 과금 방지). 프로젝트 `rsc-platform` 은 자동으로 Pro 컴퓨트로 바뀐다
3. 전환 후 `rsc-platform` → Database → **Backups** 에 "Daily backups" 가 보이면 끝

## 4-5. 자동 테스트 · 배포 게이트 (M13)
- 코드가 GitHub 에 올라갈 때마다 **CI**(`.github/workflows/ci.yml`)가 린트 → 타입 검사 → 테스트(가입·예약·결제·환불) → 빌드를 돌린다. 결과는 GitHub 저장소 → **Actions** 탭
- 운영 배포는 `main` 에 코드가 합쳐질 때 **Deploy production**(`deploy-production.yml`)이 테스트를 다시 돌리고, 통과했을 때만 Vercel Deploy Hook 을 눌러 배포한다. `vercel.json` 의 `git.deploymentEnabled.main=false` 로 Vercel 의 main 자동 배포는 꺼 두었다
- **Deploy Hook 만들기(1회, 대표)**: Vercel → 프로젝트 `rsc-platform` → Settings → **Git** → 아래 **Deploy Hooks** → Name `production`, Branch `main` → **Create Hook** → 생성된 URL 복사
- **GitHub Secret 등록(1회)**: https://github.com/raumsocialclub/rsc-platform/settings/secrets/actions → **New repository secret** → Name `VERCEL_DEPLOY_HOOK_PRODUCTION`, Secret 에 위 URL → Add
- **main 보호(1회)**: 저장소 Settings → **Branches** → Add branch ruleset(또는 rule) → Branch name `main` → "Require status checks to pass" 체크 → 검색해서 `lint · typecheck · test · build` 선택 → Save. 이러면 테스트가 빨간 PR 은 아예 합칠 수 없다
- 로컬에서 같은 검사: `npm run check` (린트+타입+테스트), 테스트만 `npm test`

## 4-6. 오류 알림 Sentry (M13, 무료 플랜)
1. https://sentry.io/signup → 이메일 nse101@kakao.com 으로 가입(알림이 이 주소로 온다) → Organization 이름은 아무거나
2. **Create Project** → Platform **Next.js** → Alert frequency "Alert me on every new issue" 선택 → Project name `rsc-platform` → Create
3. 화면에 나오는 **DSN**(`https://…@…ingest.sentry.io/…`) 복사. 나중엔 Settings → Projects → rsc-platform → **Client Keys (DSN)** 에서 다시 볼 수 있다
4. Vercel → rsc-platform → Settings → **Environment Variables** → Key `NEXT_PUBLIC_SENTRY_DSN`, Value 에 DSN, 환경 Production·Preview 체크 → Save → 다음 배포부터 적용(Claude 에게 "재배포해라")
5. Sentry → **Alerts** → 기본 규칙 "Send a notification for new issues" 가 켜져 있는지, 받는 사람이 본인 이메일인지 확인. 결제 실패는 `ops.kind = payment.confirm_failed` 태그로 들어오므로, Alerts → Create Alert → "Issues" → 조건에 `tags[ops.kind]:payment.*` 를 넣으면 결제만 따로 알림을 받을 수 있다
6. 이메일 백업 알림: RESEND_API_KEY 가 등록되면 어드민 → 일반 설정 → 알림 → **운영 알림 받는 이메일**(기본 theraumai@gmail.com)로도 결제 실패·환불 실패 메일이 간다(Sentry 와 별개)
7. 확인: `https://rsc-platform.vercel.app/api/health` 에서 `env.sentryDsn: true`

## 4-7. 스테이징(테스트 환경) (M13)
- 브랜치 `staging` 을 GitHub 에 올리면 Vercel 이 자동으로 **https://rsc-platform-git-staging-theraumai-5200.vercel.app** 에 배포한다(Preview). 화면 맨 위에 빨간 **STAGING** 띠가 보인다
- Preview 배포는 Vercel 로그인(팀 멤버)이 있어야 열린다. 테스터에게 공개하려면 Vercel → Settings → **Deployment Protection** → Vercel Authentication 을 Off (Pro 에서는 Password Protection 으로 비밀번호를 걸 수 있다)
- **DB 분리(아직 미완)**: Supabase 무료 플랜은 조직당 프로젝트 2개까지라 스테이징 DB 를 만들지 못했다(기존 `raumsocialclub's Project` + `rsc-platform`). 아래 중 하나를 하면 Claude 가 스테이징 DB 를 만들고 SCHEMA.sql 을 적용한 뒤 Vercel Preview 환경변수를 스테이징 DB 로 바꾼다:
  - Supabase Pro 로 전환(4-4) → "스테이징 DB 만들어라"
  - 또는 옛 프로젝트 `raumsocialclub's Project` 를 Pause/삭제해도 된다고 확인 → "옛 프로젝트 정리하고 스테이징 DB 만들어라"
- 그 전까지 스테이징 화면은 **운영 DB 를 함께 쓴다**. 스테이징에서 결제·회원 테스트를 하면 운영 데이터에 남으니 주의
- 스테이징 DB 가 생기면 Vercel Preview 의 `SUPABASE_SERVICE_ROLE_KEY` 는 대표가 스테이징 프로젝트의 service_role 키로 직접 바꿔 넣는다(Claude 는 그 키를 다루지 않는다)

## 4-8. 월 1회 점검
- `MAINTENANCE.md` 순서대로. 대표가 "이번 달 점검해" 라고 하면 Claude 가 문서대로 확인하고 보고한다

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
