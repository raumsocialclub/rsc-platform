# RSC 핵심 흐름 (시퀀스)

## 1. 상담 → 초대 → 가입
1. 방문자 `/fit-check` 설문 완료 → `POST /api/inquiries` → `inquiries` insert(status=pending).
2. 어드민 `/admin/inquiries`에서 상담 진행 → "초대코드 발급" → `invite_codes` insert(`RSC-` + 4 + 4 대문자/숫자, 30일 만료) → 알림톡/이메일 발송(코드 + `/join?code=` 링크) → inquiry status=invited.
3. 방문자 `/join` 코드 입력 → `POST /api/invites/verify` (service role) → 유효하면 `/join/register?code=`.
4. 가입: Supabase Auth `signUp` (이메일) 또는 `signInWithOAuth` (kakao/google; 네이버는 Supabase 기본 provider 아님 → 네이버는 커스텀 OIDC 또는 2차) — `options.data = {name, phone, invite_code}`.
5. `on_auth_user_created` 트리거가 `members` 생성 → 서버 콜백 `/auth/callback`에서 `invite_codes.used_by/used_at` 기록. status=active 즉시 활성(승인 대기 없음).

## 1-1. 제휴문의 (2026-11-11)
1. 방문자 `/partner` 양식(문의 유형 · 회사 · 담당자 · 휴대전화 · 이메일 · 내용 · 첨부 최대 3개 · 개인정보 동의) → 첨부가 있으면 파일마다 `POST /api/partner/upload-url`(확장자·10MB 검사, IP 10분 20회) → 브라우저가 서명 URL 로 비공개 버킷 `partner-files` 의 `inbox/<uuid>/file.<확장자>` 에 직접 업로드(원래 파일명은 files[].name) → `POST /api/partner` (service role, IP 10분 3회; 첨부 경로가 버킷에 실제로 있는지 확인) → `partner_inquiries` insert(status=new, files, consent_at · consent_version 기록) → 제휴 담당 이메일(`global.brand.partnerEmail`)로 접수 알림(Resend 키가 있을 때만).
2. 어드민 `/admin/partners`(사이드바 「제휴문의」, 접수 건수 배지) 목록·상세 → 첨부는 `GET /api/admin/partners/:id/file?i=`(5분 서명 URL 로 이동) → 상태(접수 · 검토 중 · 진행·완료 · 보류) · 메모 저장 `PATCH /api/admin/partners/:id` → `admin_logs`(partner.update). 「메일 회신」은 담당자 메일 앱을 연다.
3. 보관 1년 → `purge_expired_partner_inquiries` 크론(매일 03:41 UTC): 행과 첨부를 함께 지우고, 제출되지 않은 채 하루 지난 업로드도 지운다. 상담 신청(inquiries)·CRM·초대코드와는 분리.

## 2. 프로그램 예약 → 결제 → 확정
1. `/programs/[id]` "예약하고 결제하기" → `POST /api/bookings { sessionId, qty }`
   - 서버: 로그인 확인 → `rpc('reserve_seat')` → booking(pending, 15분 만료) 반환. 가격은 DB에서 계산(클라이언트 값 무시).
2. `/checkout/[bookingId]` 토스 결제위젯 렌더
   - `loadPaymentWidget(clientKey, customerKey=member.id)`; `renderPaymentMethods('#method', { value: booking.amount })`
   - `requestPayment({ orderId: booking.order_id, orderName: program.name, successUrl: /checkout/success, failUrl: /checkout/fail, customerName, customerEmail })`
3. 토스 → `successUrl?paymentKey&orderId&amount` 리다이렉트.
4. `/checkout/success` 서버 컴포넌트가 `POST /api/payments/confirm`
   - booking 조회, `amount === booking.amount` 검증(불일치 → 거절)
   - `POST https://api.tosspayments.com/v1/payments/confirm` (Basic auth: base64(secretKey + ':'))
   - 성공 → `payments` insert(status=paid, raw, receipt_url) + `bookings.status=confirmed`
   - 알림톡/이메일: 예약 확정(프로그램·일시·장소·금액)
5. 실패/이탈 → booking pending 유지 → 15분 후 `expire_pending_bookings()`가 expired 처리(좌석 반환).
6. 토스 웹훅 `POST /api/payments/webhook` (PAYMENT_STATUS_CHANGED) — confirm 누락 방지 보강용. 시크릿 검증 후 동일 처리.

## 3. 취소 / 환불
- 회원 `/my` 취소 → `POST /api/bookings/[id]/cancel` → 환불 정책 계산(프로그램 시작 기준 D-7 100%, D-3 50%, 이후 불가 — 최종 정책은 pricing 문서 기준으로 어드민 설정값으로) → `POST /v1/payments/{paymentKey}/cancel { cancelReason, cancelAmount }` → payments status=cancelled/partial_cancelled, bookings=cancelled.
- 어드민도 `/admin/orders`에서 동일 API로 수동 환불.

## 4. 멤버십 결제 (ACCESS / SIGNATURE / PREVIEW)
- `/pricing` "가입 상담" → 상담 후 어드민이 초대코드 발급 → 가입 후 `/membership/checkout?plan=access` (동일 토스 위젯, orderId `RSCM-...`) → confirm 성공 시 `memberships` insert(starts_at=today, ends_at=+12m, is_founding 여부는 어드민 플래그) + payments.
- 분납(ACCESS 2회, SIGNATURE 3회)은 1차: 수동(계좌이체 확인 후 어드민이 memberships 등록). 2차: 토스 빌링키.
- PREVIEW → 7일 내 가입 시 165,000 차감: 어드민이 `memberships.paid_amount`에 반영(수동 할인 입력 필드).

## 5. 어드민 프로그램 등록
- `/admin/programs/new` 저장 → `programs` insert + `sessions` insert(단일 1행 / 시즌 6행). 이미지: Supabase Storage `programs/` 업로드 후 public URL 저장.
- `is_published=false` 저장 → 회원에게 미노출. 공개 토글로 노출.

## 6. 권한
- `middleware.ts`: 세션 없음 → `/programs`, `/my`, `/checkout/*` → `/login`; `/admin/*` → members.role 확인 후 아니면 `/`.
- 모든 쓰기(예약·결제·초대코드·환불)는 Route Handler에서 `SUPABASE_SERVICE_ROLE_KEY`로 실행. 클라이언트에는 anon key만.
