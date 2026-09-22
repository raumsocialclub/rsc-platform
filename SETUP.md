# 구축 순서 & 준비물

## 0. 사업자 준비 (개발과 병행, 대표가 직접)
- [ ] 사업자등록증, **통신판매업 신고** (온라인 결제 필수)
- [ ] 토스페이먼츠 가맹 신청 (https://www.tosspayments.com) — 사업자등록증·통장사본·대표 신분증. 심사 1~3영업일. 승인 전엔 테스트 키로 개발.
- [ ] 카카오 개발자 앱 등록 (카카오 로그인 · REST API 키 · Redirect URI = Supabase callback URL)
- [ ] 구글 클라우드 OAuth 클라이언트 (동일 Redirect URI)
- [ ] 네이버 로그인 앱 등록 (2차 — Supabase 기본 미지원, 커스텀 구현 필요)
- [ ] 이용약관 · 개인정보처리방침 · 환불규정 페이지 (토스 심사 시 URL 요구)
- [ ] 알림톡: 카카오 채널 비즈니스 인증 + 솔라피(Solapi) 가입, 템플릿 심사(예약 확정·초대코드·리마인더 3종). 심사 전엔 이메일(Resend)로 대체.

## 1. Supabase
> 2026-09-22 완료: 프로젝트 `rsc-platform`(ref `vfjpouuwvwgiqpwttyup`, Seoul) 생성, `SCHEMA.sql` 전체 실행됨.
> 대시보드: https://supabase.com/dashboard/project/vfjpouuwvwgiqpwttyup
1. 새 프로젝트(Seoul 리전) → SQL Editor에 `SCHEMA.sql` 실행.
2. Authentication → Providers: Email, Kakao, Google 활성화(각 client id/secret 입력).
3. Storage → 버킷 `programs`(public), `site`(public).
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
NEXT_PUBLIC_SITE_URL=https://raumsocialclub2026.vercel.app
```

## 4. Vercel 배포
- 새 GitHub 저장소(Next.js) 생성 → Vercel에서 Import → 기존 프로젝트의 도메인 `raumsocialclub2026.vercel.app`을 **기존 정적 프로젝트에서 제거 후 새 프로젝트에 추가** (Settings → Domains). 커스텀 도메인 연결 시 DNS CNAME `cname.vercel-dns.com`.
- Supabase Auth → URL Configuration → Site URL / Redirect URLs에 배포 주소 + `/auth/callback` 등록.
- 토스 개발자센터 → 웹훅 URL `https://<domain>/api/payments/webhook` 등록.

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
