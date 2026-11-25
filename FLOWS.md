# RSC 핵심 흐름 (시퀀스)

## 1. 상담 → 초대 → 가입
1. 방문자 `/fit-check` 간단 신청(이름 · 휴대폰 · 직업 · 학력 · 거주지역 시/도(필수) + 시/군/구(선택) · 개인정보 동의; 2026-11-12 부터 5항목) 또는 설문 완료 → `POST /api/inquiries` → `inquiries` insert(status=pending; 직업·학력·거주지는 `answers.job · education · region · district`). 어드민 목록 「직업 · 학력 · 거주지」열 · 상세 · CSV 뒤 4열(job, education, region, district)에 고른 글자 그대로 나온다. 개인정보 동의 아래 「마케팅 정보 수신 동의(선택)」(목적 문구는 관심 방식별)에 체크하면 같은 요청으로 `marketing_consents`(이름·휴대폰·거주지역·관심 방식·동의 일시·동의문 버전)에 따로 저장되고 `answers.marketing · marketingAt` 에도 남는다 → 어드민 `/admin/marketing`(동의 중·철회 탭, 철회/철회 취소 `PATCH /api/admin/marketing/:id`, 주관리자 CSV `/api/admin/marketing/export`, 재확인 예정일 = 동의일 + 2년). 상담 신청이 180일 뒤 지워져도 수신 동의는 철회 전까지 남고(inquiry_id 만 null), 철회 기록은 1년 뒤 크론 삭제.
1-2. **프로필 진단 「3분 프로필 진단」** (2026-11-16, 1:1 매칭 DB 수집): 공개 페이지 아래 플로팅 버튼(`components/site/MatchCta.tsx`, 문구·보이기는 CMS `match.cta`, 상담 신청·설문·어드민에서는 숨김; 2026-11-18 부터 소셜클럽 톤 세트 3개 「이번 달 행사 보기」·「RSC 멤버십 문의하기」·「프로필 남기고 상담받기」, 세 세트 모두 `/match-check`(2026-11-19 사용자 결정), 세트별 링크는 CMS 에서 바꿀 수 있음) → `/match-check` 한 화면 한 질문 퍼널(`lib/match/schema.ts` 29문항(2026-11-18 정비): 이름 · 성별 · 생년월일(만 나이) · 혼인 상태(미혼·돌싱·기혼 — 기혼은 안내가 빨갛게 바뀌며 진행 불가) · 자녀 · 거주 시/도 · 시/군/구 · 활동 가능 지역 · 활동 지역 시/군/구 · 키 · 체중 · 학력 · 대학명 · 직업 · 직업 상세 · 고용형태 · 연 소득 · 본인 자산 · 외모 자기평가 · MBTI · 흡연 · 주량 · 종교* · 신체 특이사항* · 만남에서 중요하게 생각하는 항목 3가지(14개 중, 설명 포함, 누른 순서 = 우선순위) · 알게 된 경로 · 사진(최대 3장) · 상담 시 확인 서류 안내(읽기만) · 휴대폰; 필수는 이름·성별·생년월일·혼인 상태·거주 시/도·휴대폰, 나머지는 건너뛰기; *민감정보는 그 화면의 별도 동의 체크 시에만 저장). 사진은 고르는 즉시 `POST /api/match/upload-url` 서명 URL 로 비공개 버킷 `match-photos`(장당 10MB · jpg/png/webp/heic) 에 직접 업로드. 마지막 화면에서 개인정보 동의(필수)·마케팅 수신(선택) 후 `POST /api/match` → 서버가 선택지 밖 값 제거·민감정보 동의 확인·사진 존재 확인 → `inquiries` insert(`answers.form = "match"`, `track = "matching"`, `job · education · region · district` 로 어드민 열·CSV 공유, `answers[]` 질문·답 목록, `match` 원본, `photos` 경로 배열(`photo` 는 첫 장), `sensitiveConsentAt`) + 마케팅 동의 시 `marketing_consents`. 어드민 목록 「진단」 배지, 상세 「프로필 진단 응답」 + 「사진 n 보기」(`GET /api/admin/inquiries/:id/photo?n=` 5분 서명 URL). 보관 180일 — `purge_expired_inquiries` 가 행과 사진(photo·photos), 제출되지 않은 하루 지난 사진을 함께 삭제. **초대코드**(2026-11-20): 「알게 된 경로」 문항 아래 입력칸(선택) → `answers.inviteCode`(대문자 정규화) → 어드민 목록·상세 배지, 상세 응답 목록 「초대코드」 줄, CSV `invite_code`.
2. 어드민 `/admin/inquiries`에서 상담 진행 → "초대코드 발급" → `invite_codes` insert(`RSC-` + 4 + 4 대문자/숫자, 30일 만료) → 알림톡/이메일 발송(코드 + `/join?code=` 링크) → inquiry status=invited.
3. 방문자 `/join` 코드 입력 → `POST /api/invites/verify` (service role) → 유효하면 `/join/register?code=`.
4. 가입: Supabase Auth `signUp` (이메일) 또는 `signInWithOAuth` (kakao/google; 네이버는 Supabase 기본 provider 아님 → 네이버는 커스텀 OIDC 또는 2차) — `options.data = {name, phone, invite_code}`.
5. `on_auth_user_created` 트리거가 `members` 생성 → 서버 콜백 `/auth/callback`에서 `invite_codes.used_by/used_at` 기록. status=active 즉시 활성(승인 대기 없음).

1-3. **회원 설문조사 (문자 발송용 비밀 링크)** (2026-11-18): 어드민 → 설문조사(`/admin/surveys`)에서 종류(코드 정의 `lib/survey/definitions.ts`, 첫 설문 「2027 프로그램 수요조사」 5문항: 관심 분야 1·2순위 · 네트워킹 방식(최대 2) · 규모 · 1회 참여비 · 중요 요소(최대 3)) · 이름 · 마감일을 정해 「설문 링크 만들기」 → `surveys` 행(22자 토큰) → 「문자 문구 복사」((광고) 표기 + `{link}`, CMS `survey.<종류>`의 sms)로 회원에게 발송 → 회원이 `/s/<토큰>`(사이트 미노출, robots 제외, noindex)에서 로그인 없이 첫 화면 → 한 화면 한 질문(순위형은 누른 순서대로 1·2순위 배지, 「기타」는 직접 입력 필수) → 마지막 화면에서 이름·휴대폰 뒤 4자리(선택, 적으면 개인정보 동의 필수) → `POST /api/survey`(IP 10분 10회) → 서버가 정의대로 정제·마감 확인 → `survey_responses` insert(무기명이면 이름·뒤 4자리·동의 null) + `surveys.last_response_at`. 같은 기기에서 다시 열면 「이미 응답」 화면(다시 응답하기 가능). 어드민 결과(`/admin/surveys/:id`): 문항별 비율 막대, 순위형은 1순위 2점·2순위 1점 합산 순, 기타 입력 목록, 응답 목록(같은 이름+뒤 4자리 「중복?」), 주관리자는 응답 CSV. 마감/다시 열기 가능, 마감 후 응답은 남는다. 이름·뒤 4자리는 1년 뒤 `purge_expired_survey_identities` 크론(매일 03:52 UTC)이 지운다. 공통 문구 CMS `survey.form`.
1-4. **1:1 매칭 사전등록 모드** (2026-11-20 정책 변경): 일반 설정 → 사이트 상태 → 「1:1 매칭 사전등록 모드」(`settings.site.matchPreview`, 기본 켬, `lib/settings/matchPreview.ts`). 켜져 있으면 `/matching` 은 상세 페이지(소개·심사·플랜·비교·FAQ) 대신 사전등록 화면(`components/site/MatchPreview.tsx`, 문구 CMS `matching.preview`: 큰 사진 + 짧은 소개 + 「사전등록하기」 + 세 줄 소개)만 보이고, 홈 대문·비교 카드·하단 띠의 1:1 매칭 파란 버튼은 모두 「사전등록하기」 → `/match-check?src=prereg`(3분 프로필 설문). 소셜클럽·홈·제휴 본문의 1:1 매칭 문장(「연회비만 더해 1:1 매칭으로 전환」, 「소셜클럽과 1:1 매칭 …」)과 플랜명·FAQ 는 `scrubDoc`/`stripMatching` 으로 빼고, 상담 신청(`/fit-check`)의 「1:1 매칭」 칩은 숨긴다(`?track=matching` 은 「상담 후 결정」으로). `llms.txt`·`/matching` 메타도 사전등록 안내로 바뀐다. 메뉴·푸터·전환 바의 「1:1 매칭」 링크는 그대로 사전등록 화면으로 간다. **경로 기록**: `/match-check?src=prereg` → `MatchForm` 이 `entrySource:"prereg"` 를 보내고 `POST /api/match` 가 `answers.entrySource` 로 저장 → 어드민 목록 「사전등록」 배지 · 「들어온 경로」 「1:1 매칭 사전등록하기 버튼」 · 상세 제목 「1:1 매칭 사전등록 응답」 · 종류 필터 「1:1 매칭 사전등록」 · CSV 들어온 경로 열(`lib/inquiries/track.ts isPrereg`). 모드를 끄면 모든 화면·문구·링크가 예전 그대로 복원된다(코드·CMS 문서는 지우지 않음).

1-5. **1:1 매칭 전체 숨김** (2026-11-23, 카카오 비즈니스 채널 심사 「만남주선」 반려 대응): 일반 설정 → 사이트 상태 → 「1:1 매칭 전체 숨김」(`settings.site.matchHidden`, 기본 켬, `lib/settings/matchHidden.ts`). 사전등록 모드보다 앞에 있는 더 강한 스위치로, 켜져 있으면 1:1 매칭을 사이트 어디에서도 안내하지 않는다: `/matching`(사전등록 화면 포함)은 직접 들어와도 메인으로(proxy `lib/supabase/proxy.ts` + 페이지 `redirect`), GNB·푸터의 「1:1 매칭」 메뉴, 홈 대문의 1:1 매칭 탭(탭이 하나면 전환 탭·카운터·점 표시도 안 그림)·두 방식 비교 카드 섹션·하단 띠의 1:1 매칭 버튼, 소셜클럽 상단 전환 바가 사라진다. **프로필 진단(`/match-check`)과 플로팅 버튼은 소셜클럽 사전등록 창구로 그대로 열린다**(2026-11-23 사용자 결정): 플로팅 버튼 세 세트의 기본 링크는 `/match-check?src=prereg`(CMS match.cta), 숨김 중에는 동의 목적·완료 안내·사전등록 이름을 `MATCH_FORM_HIDDEN`(소셜클럽 톤)으로, 검색 제목·llms 줄을 `MATCHCHECK_HIDDEN_SEO` 로 바꾼다. 어드민에는 「사전등록」 배지 · 「들어온 경로」 「사전등록하기 버튼」으로 남는다. 상담 신청의 `?track=matching` 은 「상담 후 결정」으로 받고 마케팅 수신 목적 문구의 1:1 매칭 언급은 빼며(상담 후 결정 = 소셜클럽 목적 문구), 홈·소셜·제휴 본문의 1:1 매칭 문장은 사전등록 모드와 같은 규칙(`matchVisibility().scrub` → `scrubDoc`·`stripMatching`)으로 뺀다. 사이트맵·robots 에서 `/matching` 을 빼고 `llms.txt` 는 1:1 매칭 줄을 모두 뺀다(`llmsHidden`, 사전등록 안내 줄 없음). 어드민의 1:1 매칭 CMS 탭·사전등록 응답 목록·CSV 는 그대로. 끄면 사전등록 모드(`matchPreview`) 설정대로 돌아간다.

1-6. **가입 신청 · 승인 · 회원 프로필 카드** (2026-11-23): 프로필 진단 설문(`/match-check`, 플로팅 버튼 「소셜클럽 사전등록하기」 → `/match-check?src=prereg`, 초대코드 입력 포함)으로 들어온 응답(`inquiries.answers.form = "match"`)은 모두 **라움소셜클럽 가입 요청자**로 어드민 「가입 신청」(`/admin/join`, `lib/inquiries/join.ts`)에 모인다. 상담 신청(`/fit-check`)·상담 전 설문(`/apply`)은 「상담 신청」(`/admin/inquiries`)에 그대로(프로필 진단 응답은 그 목록·배지·대시보드 「상담 대기」에서 빠진다). 목록은 승인 대기/가입완료 탭과 이름·연락처·초대코드 검색, 이름을 누르면 **회원 프로필 카드**(`/admin/join/:id`, `components/admin/JoinProfileCard.tsx`: 사진 + 기본 정보·거주·활동·학력·직업·경제·생활·중요 항목·접수 정보 섹션, 오른쪽에 상담 메모·상태·초대코드 발급 패널). 카드의 「가입 승인」 → `POST /api/admin/inquiries/:id/approve {approve:true}` → `inquiries.approved_at`·`approved_by` 기록 → 「가입완료」(승인일·승인자 표시, 「승인 취소」로 되돌림, 관리자 활동 로그 `join.approve`/`join.unapprove`). 상담 상태(`status`)와는 별개의 축이다. 가입완료 회원도 같은 카드 화면에서 언제든 조회한다.

1-7. **소식 「참여하기」 → 참여 신청** (2026-11-25, M24): 소식 목록 카드·상세(`/news`, `/news/[slug]`)의 「참여하기」 버튼(`posts.apply_open`, 기본 켬) → `/match-check?src=prereg&event=<글 주소>` (`lib/posts/apply.ts`). 첫 화면 「이미 프로필을 남기셨나요?」에서 휴대폰 번호만 입력하면 `POST /api/events/apply` 가 같은 번호의 가장 최근 프로필 설문 행(`answers.form = "match"`)을 찾아 `answers.events[]` 에 `{ slug, title, at }` 를 붙이고(같은 행사는 `already`), 등록된 번호가 없으면 3분 프로필 설문으로 이어져 제출 때 `POST /api/match` 가 같은 자리에 기록한다(`entrySource` 는 `prereg`). 어드민 「가입 신청」 목록 배지 「참여 신청 · 글 제목」, 상세·프로필 카드 「참여 신청 행사」 줄(여러 건), 검색은 행사 제목도 잡는다. 문구는 CMS `news.page`(applyLabel·applyHint)·`match.form`(eventBanner·eventGate*·eventDone*). 글마다 소식 편집의 「참여하기 버튼 표시」로 끈다.

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
