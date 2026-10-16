# 라움소셜클럽 개인정보 처리·국외 이전 현황 점검 보고서 (2026-09-23)

조사 범위: 저장소 `raumsocialclub/rsc-platform` 브랜치 `claude/keen-wright-e5pmqv` 커밋 7f998e2, Supabase 프로젝트 `rsc-platform`(ap-northeast-2), Vercel 프로젝트 `rsc-platform`(Hobby), 공식 문서. 코드 수정·배포·데이터 삭제·플랜 변경은 하지 않았음. 실제 고객 데이터는 조회하지 않았고(행 수·컬럼명·마스킹 여부만 확인), 비밀값은 기록하지 않음.

근거 표기: **[코드]** 코드로 확인 · **[운영]** 운영 설정으로 확인 · **[문서]** 공식 문서로 확인 · **[확인 필요]** 추가 확인 필요

---

## 1. 비개발자를 위한 핵심 결과 5줄

1. 실제 개인정보(회원·상담·예약·결제 기록)는 **Supabase 서울 리전(AWS ap-northeast-2)** 에 저장되고, 서버 함수는 **Vercel 서울(icn1)** 에서 실행됩니다. [운영]
2. 처리방침에 적힌 5개 업체 중 **운영에서 실제로 돌아가는 것은 Supabase·Vercel·토스(테스트 키) 3개뿐**입니다. Resend·Sentry는 코드만 있고 운영 환경변수(API 키·DSN)가 없어 **꺼져 있습니다**. 카카오·네이버 로그인도 꺼져 있습니다. [운영]
3. 그럼에도 "국내에서만 처리"라고 말할 수 없습니다. Supabase·Vercel의 **로그·백업·관리 콘솔·기술 지원 접근·요청 앞단 처리(미들웨어·CDN)** 는 서울 리전 밖에서 이뤄질 수 있고, 두 회사 모두 미국 법인입니다. 로그 저장 위치는 문서에 명시돼 있지 않아 **확인 필요**입니다.
4. 처리방침과 실제 구현이 어긋나는 곳이 여럿입니다. 대표적으로 **회원 탈퇴 시 파기 기능이 없음**, **비밀번호 찾기 없음**, 상담 정보 1년·관리자 기록 3년 자동 파기 없음, "일일 백업"은 무료 플랜에서 사용 불가, Sentry "최대 90일"은 실제 무료 플랜 30일, Resend·Sentry를 현재 사용 중인 것처럼 기재.
5. 권장안은 **A안(현 구성 유지 + 최소화·정비)** 입니다. 지금 단계에서 B안(국내 전면 이전)은 비용·운영 부담 대비 이득이 작고, A안만으로도 처리방침을 사실과 맞추고 국외 이전 항목을 법 요건 형식으로 정리할 수 있습니다. 단, "계약 이행을 위한 처리위탁·보관"으로 공개 방식이 적법한지는 **법률 검토가 필요**합니다.

---

## 2. 실제 사용 중인 외부 서비스 (설치 vs 운영 작동)

| 서비스 | 코드에 존재 | 운영에서 작동 | 근거 |
|---|---|---|---|
| Supabase (DB·Auth·Storage) | 예 | **예** | [운영] Vercel env `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`(production) 설정됨 |
| Vercel (호스팅·함수·CDN·방화벽) | 예 | **예** | [운영] 프로젝트 `rsc-platform`, production 배포 READY, regions `icn1` |
| 토스페이먼츠 (결제위젯 + Core API) | 예 | **예, 단 문서 공용 테스트 키** | [운영] `NEXT_PUBLIC_TOSS_CLIENT_KEY`=test_gck_docs…, `TOSS_SECRET_KEY` 설정. 실결제 불가 상태. 가맹점 계약 미체결 |
| Resend (이메일) | 예 (`lib/notify.ts`) | **아니오** | [운영] production에 `RESEND_API_KEY` 없음 → 코드가 `{sent:false, reason:"NOT_CONFIGURED"}` 로 조용히 건너뜀 |
| Sentry (오류 감지) | 예 (`@sentry/nextjs`) | **아니오** | [운영] `NEXT_PUBLIC_SENTRY_DSN`·`SENTRY_DSN` 없음 → `enabled:false`, 전송 없음. 브라우저 번들에 SDK 코드만 포함 |
| 카카오 로그인 (Supabase OAuth) | 예 | **아니오** | [운영] `NEXT_PUBLIC_AUTH_PROVIDERS` 없음 → 버튼 "준비 중" |
| 네이버 로그인 (직접 연동) | 예 (`app/auth/naver/*`) | **아니오** | [운영] `NAVER_CLIENT_ID/SECRET` 없음 |
| 토스 웹훅 비밀키 | 예 | 미설정 | [운영] `TOSS_WEBHOOK_SECRET` 없음 (웹훅은 본문을 신뢰하지 않고 토스에 재조회하므로 기능상 문제는 없음) |
| 솔라피(알림톡) | .env.example에 변수명만 | **아니오** | [코드] 코드에서 `SOLAPI_*` 참조 없음 |
| Google Fonts / 외부 폰트 | 아니오 | — | [코드] `lib/fonts.ts` 로컬 폰트(SamsungOne) 사용 |
| 분석 도구·광고 픽셀 (GA, Meta, Vercel Analytics 등) | 아니오 | — | [코드] 외부 스크립트 없음. 접속 통계는 자체 `/api/track` → 자체 DB `page_views` |
| AI API·자동화 도구 | 아니오 | — | [코드] 외부 URL은 resend.com, tosspayments.com, naver.com 3곳뿐 (+ 인스타그램 링크) |
| GitHub (코드 저장, CI) | 예 | 예 | [코드] 개인정보 없음. CI는 가짜 env로 빌드만 수행 |

브라우저에서 직접 통신하는 외부 도메인: Supabase(가입·세션·소셜 로그인), 토스(결제위젯 스크립트·결제창). 그 외는 모두 자체 도메인(Vercel 함수)을 거침. [코드]

---

## 3. 기능별 개인정보 흐름

| 기능 | 어떤 정보가 | 어디로 | 목적 | 근거·비고 |
|---|---|---|---|---|
| 회원가입(이메일) | 이름, 휴대폰, 이메일, 비밀번호, 초대코드, 마케팅 수신 동의 여부 | 브라우저 → **Supabase Auth(서울)** 직접. DB 트리거가 `members` 행 생성 | 계정 생성 | [코드] `RegisterForm.tsx` `signUp({data:{name, phone, invite_code, marketing_opt_in}})`. 마케팅 동의값은 `auth.users.raw_user_meta_data`에만 저장되고 `members`에는 없어 **어드민에서 볼 수 없음**. 동의 체크 2개(약관·처리방침, 성인·미혼) 필수 검사 후 전송 |
| 로그인 | 이메일, 비밀번호, 접속 IP | 브라우저 → Vercel 함수(icn1) `/api/auth/login` → Supabase | 인증, 연속 실패 잠금 | [코드] `login_attempts` 키에 `ip:<IP>` 저장(30일 후 자동 삭제). `members.last_login_at` 기록. Supabase `auth.sessions`에 `ip`, `user_agent` 컬럼 존재(Supabase 자체 저장) |
| 비밀번호 재설정 | — | — | — | [코드] **미구현**. 로그인 화면의 "비밀번호 찾기"는 링크가 없는 글자만 있음(`LoginForm.tsx`) |
| 소셜 로그인 | (꺼짐) 카카오: Supabase Auth가 카카오와 토큰 교환. 네이버: 서버가 이메일·이름·휴대폰(`mobile`)·네이버 ID를 받아 Supabase 사용자 생성 | Supabase(서울) | 간편 가입 | [코드] 켜면 네이버 휴대폰번호가 `user_metadata.phone`으로 들어감. 실패 시 `console.error("[auth/naver] profile", profile)` 로 **프로필 전체가 Vercel 로그에 남을 수 있음** |
| 상담 신청(Fit Check) | 이름, 휴대폰, 설문 응답(싱글 여부·삶의 단계·관심 프로그램·성향 등), 유입 경로, 상담 희망 시간, 결과 유형 | 브라우저 → Vercel 함수 `/api/inquiries` → Supabase `inquiries` (service role) | 상담·초대코드 발급 | [코드] 이메일은 수집하지 않음(`email:null`). 동의 체크 문구: "개인정보 수집 및 이용에 동의합니다. 가입 상담 목적으로만 사용되며, 요청하시면 즉시 파기합니다." — 항목·보유기간·거부권 고지가 없음. **설문에 "현재 싱글이신가요?" 문항 포함**(민감정보 해당 여부 법률 검토 항목) |
| 회원 프로필 작성·수정 | — | — | — | [코드] 회원용 프로필 수정 화면 없음. 결제 화면에 "정보 수정은 고객센터로 문의" |
| 행사 예약 | 회원 ID, 회차 ID | Vercel 함수 → Supabase RPC `book_session`(RLS, 본인 권한) | 좌석 확보 | [코드] 동반 참가자 등록 기능 없음(`qty=1`, `guest_passes` 테이블 미사용) |
| 결제 | ① 위젯에 이름·이메일·휴대폰(숫자만) 전달 ② 카드정보는 토스 결제창에서 입력 ③ 서버는 paymentKey·orderId·amount만 받음 ④ 토스 승인 응답 전체(`raw`)를 DB 저장 | ① 브라우저 → 토스 ② 브라우저 → 토스 ③④ Vercel 함수 → 토스 API → Supabase `payments` | 결제 승인 | [코드] `CheckoutClient.tsx` `requestPayment({customerName, customerEmail, customerMobilePhone})`, `confirm.ts` `raw: p`. [데이터 구조 확인] 운영 DB의 `raw.card.number`는 마스킹(`*` 포함) 상태, `customerName/Email/Phone` 키는 응답에 없음. `raw`에는 `approveNo`, `receipt.url`, `checkout.url`, `secret`(토스 웹훅 검증값), `mobilePhone` 키 등이 포함 |
| 취소·환불 | 환불 사유(관리자 자유 입력 또는 "회원 취소"), 금액 | Vercel 함수 → 토스 취소 API → Supabase `payments.raw` 갱신, `admin_logs.detail.reason` | 환불 | [코드] 부관리자도 환불 가능, 사유 필수. 사유 텍스트에 이름 등이 들어가면 로그·(Sentry·알림 메일 켜질 경우) 외부로 전달됨 |
| 예약 확인·초대·운영 알림 이메일 | 확정 메일: 수신 이메일, 이름, 프로그램명, 일시, 장소, 금액 / 초대코드 메일: 이메일, 이름, 코드 / 관리자 초대: 이메일, 링크 / 운영 알림: 주문번호, 예약 ID, 금액, 토스 오류코드, **환불 사유** | (켜질 경우) Vercel 함수 → **Resend API(미국)** | 알림 | [코드] `lib/notify.ts`. 현재 꺼짐. 홍보 메일 기능은 없음(마케팅 발송 코드 없음). 상담 내용·설문·프로필은 메일에 포함되지 않음 |
| 사진·첨부 업로드 | 관리자만 프로그램·사이트 이미지(JPG/PNG/WEBP/SVG, 10MB) | Vercel 함수 → Supabase Storage 공개 버킷 `programs`, `site` | 콘텐츠 | [코드][운영] 회원 사진·증빙자료 업로드 기능 없음. 버킷 2개 모두 `public=true`, 객체 1개 |
| 관리자 조회·다운로드 | 회원: 이름·이메일·휴대폰(전체, 마스킹 없음)·메모·가입경로 / 상담: 이름·휴대폰·설문·메모 / 주문: 회원 이름·이메일·휴대폰·결제 내역 / CSV: 예약·결제(모든 관리자), 회원 목록(주관리자만), 상담·활동로그 | 브라우저(관리자) ← Vercel 함수 ← Supabase(RLS `is_admin()`) | 운영 | [코드] `admin/stats/export`, `admin/orders/export`. 관리자 IP 제한은 **설정값이 비어 있어 현재 미적용**(아래 운영 설정 참조). 다운로드 자체는 `admin_logs`에 기록되지 않음 |
| 오류 보고 | (Sentry 켜질 경우) 오류 스택, 요청 URL·경로, 필터된 헤더, `opsAlert` extras(주문번호·금액·토스 코드·환불 사유) | Functional Software(미국 또는 EU 선택) | 장애 분석 | [코드] `sendDefaultPii:false` → IP·요청 본문·쿠키 미전송(패키지 기본값 `httpBodies:[]`, `userInfo:false` 확인). Session Replay 0%, 서버 트레이싱 5% 샘플. 현재 꺼짐 |
| 접속 분석 | 경로, 참조 주소, UTM, 기기 구분, 접속 국가(Vercel 헤더), 방문자 쿠키 `rsc_vid`(1년, httpOnly), 로그인 시 회원 ID | 브라우저 → Vercel 함수 `/api/track` → Supabase `page_views` | 통계 | [코드] IP·User-Agent는 저장하지 않음(기기 판별에만 사용). **쿠키 동의 절차 없이 첫 방문부터 쿠키 발급·수집**. 1년 지난 행 자동 삭제(pg_cron) |
| 회원 탈퇴·개인정보 삭제 | — | — | — | [코드] **회원 스스로 탈퇴하는 기능 없음.** 관리자가 상태를 "탈퇴"로 바꾸는 것뿐이며 `auth.users`·`members`·`inquiries`·`payments`·`page_views.member_id` 어느 것도 삭제·분리되지 않음. 처리방침 제4조·제10조("탈퇴 시 파기")와 불일치 |

동의 전 외부 전송 여부: 페이지를 여는 순간 Vercel(호스팅)과 자체 통계 비콘이 동작하고 `rsc_vid` 쿠키가 발급됨. Supabase·토스로의 전송은 사용자가 가입·결제 버튼을 누른 뒤에만 발생. Sentry·Resend는 꺼져 있음. [코드]

서버 로그에 남는 개인정보(Vercel 런타임 로그): `console.error` 호출 시 오류 객체·detail을 그대로 출력함. 특히 `[ops-alert]`(환불 사유 포함), `[auth/naver] profile`(네이버 켜질 경우 프로필 전체) 주의. Vercel Hobby 런타임 로그 보관은 1시간. [코드][문서-검색]

---

## 4. 업체별 개인정보 처리 현황표

### 4-1. Supabase, Inc. (미국 법인) — 운영 중

| 항목 | 내용 | 근거 |
|---|---|---|
| 실제 수령 법인 | Supabase, Inc. | [문서] supabase.com/legal/dpa (DPA 당사자) |
| 업무·사용 기능 | Postgres DB(회원·상담·예약·결제·통계·로그), Auth(계정·세션·비밀번호 해시), Storage(프로그램 이미지), pg_cron | [코드][운영] |
| 전달 개인정보 | 이름·이메일·휴대폰·비밀번호(해시)·초대코드·마케팅 동의값·상담 설문·예약·결제 기록(마스킹 카드번호·승인번호 포함)·접속 통계·로그인 실패 IP·관리자 활동 기록·세션 IP/UA | [코드] SCHEMA.sql, auth 스키마 컬럼 |
| 원본 저장 국가 | **대한민국(서울, AWS ap-northeast-2)** — DB·Auth·Storage 객체 | [운영] `get_project` region=ap-northeast-2 [문서] "primary Postgres database, Auth service, and Storage objects are hosted in that region" (supabase.com/docs/guides/security/gdpr-compliance) |
| 로그 처리 국가 | **확인 필요.** 플랫폼 로그(API 게이트웨이 `edge_logs`에 `x_real_ip`, `cf_connecting_ip` 등 IP 헤더 포함, `auth_logs`, `postgres_logs`)는 Supabase 로그 시스템(2026-06 이후 신규 프로젝트는 ClickHouse, 이전은 BigQuery)에 저장. 리전은 문서에 명시 없음 | [문서] supabase.com/docs/guides/observability/advanced-log-filtering |
| 로그 보관 기간 | Free 1일 · Pro 7일 · Team 28일 · Enterprise 90일 (검색 결과 기준, 공식 pricing 페이지에서 재확인 권장) | [문서-검색] supabase.com/pricing |
| 백업 처리 국가 | Pro 이상: 매일 백업, Pro 7일 보관. 백업은 S3에 저장. "All data will remain within the chosen region"(SOC2 문서) — 백업도 서울로 해석되나 **백업 버킷 리전 명시는 없음 → 확인 필요.** Storage 파일은 DB 백업에 포함되지 않음 | [문서] supabase.com/docs/guides/platform/backups, supabase.com/docs/guides/security/soc-2-compliance |
| 현재 백업 상태 | **무료 플랜: 대시보드에서 접근 가능한 백업 없음**(Supabase가 내부적으로 최대 7일 보관하나 유료 전환 후에만 접근) | [문서] "backups are not available for download for Free Plan projects" |
| 해외 지원 인력 조회 | **확인 필요.** SOC2 문서: "only authorized persons have access to the data". 지원 요청 시 접근 동의 절차·직원 소재국은 DPA/개인정보처리방침에서 확인 | [문서] |
| 이전 시점·방법 | 서비스 이용 시 HTTPS로 실시간 전송(브라우저·Vercel 함수 → Supabase) | [코드] |
| 보유기간·삭제 | 앱이 정하는 대로(테이블별). 자동 삭제 구현: login_attempts 30일, page_views 1년(pg_cron `purge-expired-logs` 활성 확인). 나머지는 수동 | [운영] cron.job 2건 활성 |
| 재수탁·재이전 | AWS(인프라), Cloudflare(API 게이트웨이·Storage CDN), 로그 백엔드(ClickHouse/BigQuery-GCP) 등. **공식 sub-processor 목록 확인 필요** | [문서] Storage CDN=Cloudflare (features 문서), 로그=BigQuery/ClickHouse |
| 개인정보 연락처 | privacy@supabase.io (DPA 문서 기준, 확인 필요) | [확인 필요] |
| DPA | 제공됨: supabase.com/legal/dpa (요청/열람). 셀프서비스 플랜에서 서명 절차 확인 필요 | [문서] |
| 관련 설정 위치 | Supabase 대시보드 → Project Settings → General(리전), Database → Backups, Logs, Authentication → Audit Logs, Organization → Legal Documents | |
| 우리 계정 특이사항 | RLS 전 테이블 활성, 공개 버킷 2개(이미지만), Security Advisor: `login_attempts` 정책 없음(INFO, 서버 전용이라 의도됨), SECURITY DEFINER 함수 anon 호출 가능 경고 4건(의도됨), **Leaked Password Protection 꺼짐(WARN)** | [운영] `get_advisors` |

### 4-2. Vercel, Inc. (미국 법인) — 운영 중

| 항목 | 내용 | 근거 |
|---|---|---|
| 실제 수령 법인 | Vercel Inc. | [문서] vercel.com/legal/dpa |
| 업무·사용 기능 | Next.js 호스팅, 서버 함수(API·SSR), Routing Middleware(proxy.ts: 세션 갱신·IP/국가 차단·관리자 IP 제한·캐시 헤더), CDN, 플랫폼 DDoS/방화벽, 환경변수 보관 | [코드] `lib/supabase/proxy.ts`, `vercel.json` |
| 전달 개인정보 | 모든 요청의 IP·User-Agent·URL·헤더·쿠키(세션 토큰)·요청 본문(가입 제외 대부분의 폼이 함수로 전송: 상담·로그인·예약·결제 확인)·응답. 함수 처리 중 메모리에서 회원 정보 조회. 런타임 로그에 `console.error` 내용 | [코드] |
| 서버 함수 실행 국가 | **대한민국(icn1)** | [운영] `vercel.json` regions `icn1`, 배포 `regions:["icn1"]` |
| 미들웨어(proxy) 실행 국가 | **서울 한정 아님(확인 필요).** Next 16 proxy는 Node.js 런타임 고정([문서] node_modules/next/dist/docs …/proxy.md "Proxy defaults to using the Node.js runtime"). Vercel 문서 검색 결과: "Routing Middleware는 리전 설정과 무관하게 기본적으로 모든 리전에 배포"(Hobby는 더 적은 리전). 이 미들웨어가 세션 쿠키 검증(Supabase `getUser` 호출)·IP 판정을 수행하므로, 요청이 들어온 엣지 위치에서 개인정보(쿠키·IP)가 처리될 수 있음 | [문서-검색] vercel.com/docs/routing-middleware |
| CDN·캐시 | 공개 페이지(/, /pricing, /benefits, /fit-check, /terms, /privacy, /refund, /news*, robots, sitemap, llms)만 **비로그인 GET**에 한해 `s-maxage=60` + `Vary: Cookie`로 공용 캐시. 회원·관리자·API 응답은 캐시 헤더 없음. 캐시 노드는 전 세계 | [코드] `PUBLIC_CACHEABLE`, `hasAuthCookie` 검사 |
| 로그 처리 국가 | Vercel의 주 처리 시설은 미국(DPA). 런타임 로그에는 clientIp·userAgent·path 포함(드레인 포맷 예시) | [문서-검색] Vercel DPA, vercel.com/docs/drains/reference/logs |
| 로그 보관 | Hobby 1시간 · Pro 1일 · Enterprise 3일 (Observability Plus 30일) | [문서-검색] vercel.com/docs/logs/runtime |
| 로그 드레인 | 없음 | [운영] `list_drains` = [] |
| 방화벽 | 커스텀 규칙 없음(설정 404). Vercel 기본 DDoS 완화만 적용 | [운영] |
| Web Analytics / Speed Insights | 패키지 미설치 → 미사용. 대시보드에서 켜져 있지 않은지 사용자 확인 | [코드][확인 필요] |
| 배포 보호 | Preview 배포는 Vercel 로그인 필요(SSO, all_except_custom_domains), 운영 도메인 공개 | [운영] |
| 해외 장애 전환 | `functionFailoverRegions` 미설정 → 자동 페일오버 리전 없음(icn1 장애 시 오류) | [코드] vercel.json |
| 해외 지원 인력 조회 | **확인 필요**(Vercel DPA·보안 문서) | |
| 재수탁 | AWS 등. Vercel sub-processor 목록 확인 필요 | [확인 필요] |
| DPA | vercel.com/legal/dpa (EU SCC, DPF 인증) | [문서-검색] |
| 우리 계정 특이사항 | 환경변수 11개, 비밀값은 sensitive 타입. anon key는 공개용이라 plain | [운영] |

### 4-3. 토스페이먼츠 주식회사 (대한민국) — 운영 중(테스트 키)

| 항목 | 내용 | 근거 |
|---|---|---|
| 업무 | 결제 승인·취소·환불, 영수증, (설정 시) 웹훅 | [코드] `lib/toss/client.ts` |
| 전달 개인정보 | 위젯: 이름·이메일·휴대폰(숫자)·주문명·주문번호. 결제창 안에서 카드정보는 토스가 직접 수집. 서버→토스: paymentKey·orderId·amount·취소 사유 | [코드] |
| 우리 DB 저장 항목 | `payments`: paymentKey, orderId, method(카드사·간편결제사명), amount, status, receipt_url, approved_at, cancelled_at, **raw(승인 응답 전체: 마스킹 카드번호·승인번호·발급사/매입사 코드·할부·영수증 URL·checkout URL·secret 등)** | [코드][데이터 구조] |
| 카드 원문 경유 | **우리 서버를 거치지 않음.** 카드번호는 마스킹된 값만 응답에 포함(운영 DB에서 `*` 포함 확인). 토스 공식 문서 원문은 네트워크 차단으로 열람 못 함 → 문서 링크: docs.tosspayments.com/reference | [코드][확인 필요-문서] |
| 저장 국가 | 국내 업체. 자체 재위탁·해외 처리 여부는 토스페이먼츠 개인정보처리방침 확인 | [확인 필요] |
| 계약 | **가맹점 계약 미체결(문서 공용 테스트 키 사용 중).** 계약 시 개인정보 처리 관련 조항(위탁 관계·역할) 확인 필요. 결제대행사는 통상 수탁자가 아니라 독립 처리자로 보는 견해도 있어 법률 검토 항목 | [운영] |
| 참고 | 2026-09 토스페이먼츠 가맹점 결제내역 제3자 조회 사고 보도(구매자 성명·마스킹 카드번호·승인번호) — 우리가 저장하는 `raw`와 같은 종류의 정보임 | [문서-검색] |

### 4-4. Resend, Inc. (미국) — 코드만 있음, 운영 꺼짐

| 항목 | 내용 | 근거 |
|---|---|---|
| 업무 | 예약 확정·초대코드·관리자 초대·운영 알림 메일 | [코드] |
| 전달 개인정보(켜질 경우) | 수신 이메일, 이름, 프로그램·일시·장소·금액, 초대코드, 관리자 초대 링크, 운영 알림(주문번호·금액·오류코드·환불 사유). 첨부 없음. 상담 내용·프로필 없음 | [코드] |
| 저장 국가 | **미국**(메시지 본문·발송 로그·웹훅·계정 정보). EU 리전 설정은 발송 경로만 바꾸고 저장 위치는 바꾸지 못함 | [문서-검색] resend.com/security/gdpr |
| 보유 기간 | 이메일·로그 30일(Free/Pro/Scale), 계정 해지 후 90일 내 삭제, 백업 7일 | [문서-검색] |
| 열람·클릭 추적 | 도메인 단위 설정, **기본 꺼짐**. 코드에서 켜지 않음 | [문서-검색] resend.com/docs/dashboard/domains/tracking |
| 홍보 메일 | 코드 없음. 도입 시 정보통신망법 수신동의 + 마케팅 위탁 통지 필요 | |
| 연락처·DPA | Resend DPA(SCC·DPF). privacy 연락처는 사이트에서 확인 | [확인 필요] |
| 현재 발신 주소 기본값 | `onboarding@resend.dev`(설정값 없음) — 실사용 시 자체 도메인 등록 필요 | [코드] |

### 4-5. Functional Software, Inc. (Sentry, 미국) — 코드만 있음, 운영 꺼짐

| 항목 | 내용 | 근거 |
|---|---|---|
| 업무 | 오류 감지(서버·브라우저·엣지), 서버 트레이싱 5% | [코드] |
| 전달 개인정보(켜질 경우) | 오류 메시지·스택, 요청 URL/경로, PII 필터된 헤더·쿠키, `opsAlert` extras(주문번호·예약ID·금액·토스 코드·**환불 사유 자유 텍스트**), 릴리스·환경. IP·요청 본문·쿼리 PII·사용자 정보는 **미전송**(`sendDefaultPii:false` 기본값을 패키지 코드에서 확인: `httpBodies:[]`, `userInfo:false`, 헤더·쿠키·쿼리 deny-list) | [코드] |
| Session Replay·로그 | Replay 0%(꺼짐). Sentry Logs 미사용 | [코드] |
| 저장 국가 | 조직 생성 시 **미국(아이오와) 또는 EU(프랑크푸르트)** 선택, 이후 변경 불가. 한국 없음 | [문서-검색] docs.sentry.io/organization/data-storage-location |
| 보유 기간 | 오류 이벤트: **Developer(무료) 30일**, Team/Business 90일 | [문서-검색] docs.sentry.io/security-legal-pii/security/data-retention-periods |
| 가입·상담·결제 입력값 전달 가능성 | 본문 미수집이라 입력값 자체는 안 감. 단 개발자가 `captureException`에 객체를 직접 넣거나 `console.error` 통합을 켜면 갈 수 있음. 현재 `opsAlert`가 환불 사유를 extras로 넣는 부분이 유일한 자유 텍스트 경로 | [코드] |
| 현재 안내("비밀번호·결제정보 제외")와 일치 여부 | 대체로 일치하나 표현이 좁음. 실제로는 "요청 본문·IP·쿠키·비밀번호·결제정보 미전송, 오류 내용·URL·주문번호·환불 사유 전송" | [코드] |

### 4-6. 카카오·네이버 (대한민국) — 꺼짐

소셜 로그인은 수탁이 아니라 "정보를 제공받는 경로". 켜면 처리방침 제2조 3항의 수집 항목(네이버는 휴대폰번호까지)과 맞춰야 함. 카카오는 Supabase Auth가 중계하므로 카카오 토큰이 Supabase(서울)를 거침. [코드]

---

## 5. 서비스별 세부 점검

### Supabase
- 운영 리전: ap-northeast-2(서울), Postgres 17.6, ACTIVE_HEALTHY. [운영]
- DB·Auth·Storage: 서울. Edge Functions: 미사용. 로그: 위치 확인 필요. 백업: 무료 플랜이라 접근 불가, Pro 전환 시 7일 보관. [운영][문서]
- RLS: public 스키마 16개 테이블 전부 RLS 활성. 회원 관련 정책: `members` self read/update + admin all, `bookings/payments/memberships/guest_passes` 본인 또는 관리자 select, `inquiries` 누구나 insert + 관리자 all, `page_views` 관리자 select(insert는 서버 service role), `login_attempts` 정책 없음(service role 전용), `admin_invites` owner만. [운영] pg_policies
- 버킷: `programs`, `site` 모두 public. 회원 사진·증빙 저장소 없음(회원 업로드 기능 자체 없음). 파일 경로는 날짜/UUID라 추측 어려우나 URL을 알면 누구나 열람 가능(프로그램 홍보 이미지이므로 의도된 공개). [운영][코드]
- service_role 키: 서버 전용 `lib/supabase/admin.ts`에서만 사용, `NEXT_PUBLIC_` 접두 없음, 브라우저 코드 import 없음. 브라우저는 anon 키만 사용. Vercel에서 sensitive 타입으로 저장. [코드][운영]
- 회원 탈퇴: **DB·인증 계정·파일 어느 것도 삭제되지 않음.** `members.id`가 `auth.users` 참조 `on delete cascade`라 `auth.users`를 지우면 members는 함께 지워지지만, `bookings/payments`는 `member_id` FK가 cascade가 아니라 삭제가 막힘(법정 보존 기록이므로 오히려 필요). 현재 삭제 절차 자체가 없음. [코드]
- 백업 복원 시 삭제 정보 부활: Pro 백업은 삭제 전 스냅샷을 포함하므로, 삭제 요청 처리 후 7일간은 복원 시 되살아날 수 있음. 처리방침의 파기 조항에 "백업본은 보관 주기 후 자동 소멸" 문구 검토 필요. Storage 파일은 백업 대상 아님. [문서]
- Auth 세션·감사로그: `auth.sessions`에 IP·User-Agent 저장(로그아웃·만료 시 정리는 Supabase 정책), `auth.audit_log_entries` 현재 0행(대시보드 → Authentication → Audit Logs 설정 확인 필요). [운영][문서]
- Auth 이메일: 가입 즉시 확인(Confirm email 꺼짐)이라 Supabase 기본 SMTP는 현재 메일을 보내지 않음. 비밀번호 재설정 도입 시 Supabase 기본 발송 서비스(공용, 위치 확인 필요) 또는 커스텀 SMTP 선택 필요. [코드][문서]
- Security Advisor: Leaked Password Protection 꺼짐(WARN) — 켜면 HaveIBeenPwned와 비밀번호 해시 접두 비교(k-anonymity)가 일어남. [운영]

### Vercel
- 함수 실행 리전: icn1(서울). 페일오버 없음. [운영][코드]
- proxy.ts: Node.js 런타임(Next 16 고정), Vercel Routing Middleware는 전 리전 배포가 기본 → 세션 쿠키·IP 판정이 서울 밖 엣지에서 처리될 수 있음. **Vercel 대시보드 → Project → Functions/Middleware 탭에서 실제 실행 리전 표시를 확인**하고, 필요하면 Vercel 지원에 "Node.js middleware 실행 리전을 icn1로 고정 가능한지" 문의. [문서-검색][확인 필요]
- CDN 캐시: 회원 정보가 있는 페이지는 캐시되지 않도록 코드에서 비로그인 GET·공개 경로만 캐시. 단 `Vary: Cookie`에 의존하므로 로그인 쿠키가 있으면 캐시 무시. 위험 낮음. [코드]
- 요청 본문·URL·로그: URL 쿼리에 개인정보 없음(초대코드 `?code=`는 있음). 런타임 로그에 IP·UA·경로가 남고 `console.error` 출력이 남음(위 3장 참조). 보관 1시간(Hobby). [코드][문서-검색]
- 방화벽·분석: 커스텀 규칙 없음, 드레인 없음, Analytics 미사용. [운영]
- 해외 지원 접근: 확인 필요(DPA).
- "서울에서 실행" ≠ "국내에서만 처리": 함수 실행은 서울이지만 미들웨어·CDN·로그·대시보드·환경변수 보관은 Vercel 글로벌/미국 인프라. [문서][운영]

### Resend (꺼짐)
- 켜지 않는 한 전송 없음. 켤 경우: 수신 이메일·이름·예약 내용·금액이 미국에 30일 저장. 추적 꺼짐. 홍보 메일 없음.
- 정보 축소안: 확정 메일에서 금액·장소 제거 가능(기능 영향 작음), 운영 알림에서 환불 사유 제거. 국내 서비스로 교체 시 영향: `lib/notify.ts`의 `sendEmail` 함수 하나만 교체하면 됨(코드 구조상 단일 진입점). [코드]

### Sentry (꺼짐)
- 켤 경우 조직 리전을 미국/EU 중 선택(한국 불가), 무료 플랜 30일 보관. PII 기본 차단은 이미 적용. 남는 개선: `opsAlert`의 `reason`(환불 사유) extras 제거·마스킹, `beforeSend`에서 extras 키도 필터.
- 개인정보 최소화하며 오류 분석 유지: 지금 설정(본문·IP·쿠키 미수집) + 위 extras 정리 + `tracesSampleRate:0.05` 유지. [코드]

### 토스페이먼츠
- 카드 원문은 결제창(토스)에서만 입력, 우리 서버 미경유. [코드]
- 우리 DB 저장 항목은 4-3 표 참조. `raw` 전체 저장은 분쟁 대응에 유용하나 마스킹 카드번호·승인번호·`secret` 값이 포함되므로 최소화 검토(필요 키만 저장) 가능.
- 처리방침 "카드번호·계좌번호 등 금융정보는 결제대행사가 직접 처리하며 클럽은 보관하지 않습니다"는 **마스킹 카드번호·승인번호는 보관한다**는 사실과 어긋남 → 문구 수정 필요.
- 계약: 테스트 키 상태라 실제 위탁 관계가 아직 성립하지 않음.

---

## 6. 현재 개인정보처리방침(제1~15조·부칙, DB `legal.privacy` 17개 항목 = 코드 기본값) vs 실제 구현

| 현재 문구 | 실제 확인 결과 | 문제점 | 수정 방향 |
|---|---|---|---|
| 제7조 Supabase·Vercel "(서버 위치: 대한민국 서울)" | DB·Auth·Storage·함수는 서울 [운영]. 로그·백업·미들웨어·콘솔은 서울 한정 아님(확인 필요) | 전체가 국내 처리인 것처럼 읽힘 | "주 데이터베이스와 서버 함수는 서울 리전, 로그·백업·기술 지원은 해당 업체의 해외 시설에서 처리될 수 있음"으로 구체화. 로그 위치는 업체 확인 후 기재 |
| 제9조 국외 이전 국가를 일괄 "미국" | Supabase: 원본 한국, 로그·지원 미확정. Vercel: 함수 한국, 로그·미들웨어·본사 미국. Resend: 미국(미사용). Sentry: 미국/EU 선택(미사용) | 국가와 처리 종류가 뒤섞임 | 처리 종류(원본 저장/로그/백업/지원 접근)별로 행을 나누고, 확인되지 않은 국가는 확인 후 기재 |
| 제9조 1항 "회원 정보·상담 정보·예약 기록 전반" | Supabase에 저장되는 항목은 제2조에 열거된 것과 같음 [코드] | 법 제28조의8 ②는 "이전되는 개인정보 항목"을 구체적으로 요구 | 항목을 제2조와 동일하게 열거 |
| 제9조 "보유 기간은 위 보유기간과 동일" | 앱 보유기간과 동일한 것은 원본 DB뿐. 로그(1~7일 등)·백업(7일)은 다름 | 기간이 실제와 다름 | 처리 종류별 기간 명시 |
| 제9조 3항 Resend "발송 기록 보관 기간" | 미사용. 사용 시 30일 [문서-검색] | 사용하지 않는 업체를 이전 대상으로 기재, 기간 불명확 | 도입 전까지 삭제하거나 "도입 시 갱신" 별도 문구. 도입 시 "30일" 명시 |
| 제9조 4항 Sentry "최대 90일" | 미사용. 사용 시 무료 플랜 30일 [문서-검색] | 사실과 다름 | 동일 |
| 제9조 4항 "비밀번호·결제정보는 제외" | 실제로는 IP·요청 본문·쿠키·비밀번호·결제정보 미전송, 오류 내용·URL·주문번호·환불 사유는 전송 [코드] | 제외 항목이 좁고 포함 항목이 빠짐 | 전송 항목을 양쪽 모두 명시 |
| 제9조 "거부 시 서비스 이용이 제한될 수 있음" | 법상 거부 방법·절차·효과를 알려야 함. 현재 거부 절차(이메일 문의)만 있음 | 거부 절차가 구체적이지 않고, 계약 이행 근거로 공개하는 경우 동의 거부 문구와 논리가 어긋날 수 있음 | 법률 검토 후 "이전 근거(동의/계약 이행)"에 맞춰 문구 재작성 |
| 제11조 "관리자 접속 IP 제한 기능" | 기능은 있으나 **설정값 비어 있어 미적용** [운영] | "기능"이라 거짓은 아니나 적용 중으로 오해 | "필요 시 적용할 수 있는 기능" 또는 실제 적용 후 유지 |
| 제11조 "관리자 로그인 연속 실패 시 잠금" | 회원·관리자 공통 5회/15분 잠금 적용(기본값) [운영] | 관리자만이 아니라 전체 로그인에 적용 | "로그인 연속 실패 잠금"으로 수정 |
| 제11조 "일일 백업" | **무료 플랜: 접근 가능한 백업 없음** [문서] | 사실과 다름 | Pro 전환 전까지 삭제하거나 "유료 플랜 전환 시" 조건 명시 |
| 제12조 보호책임자 성명 | "(성명 입력 — …)" 자리 문구 그대로 [운영] | 법정 기재사항 누락 | 어드민에서 성명 입력 |
| 조문 번호 중복 | DB 17개 항목: 머리말, 제1조~제15조, 부칙 — **중복 없음** [운영] | (해당 없음) | 화면에서 다시 확인해 보고 다르면 알려 주세요 |
| 제2조 4항 "카드번호·계좌번호 등 금융정보는 … 클럽은 보관하지 않습니다" | 마스킹 카드번호·승인번호·발급사 코드 등을 `payments.raw`에 보관 [코드][데이터 구조] | 부분적으로 사실과 다름 | "카드번호 전체·유효기간·CVC는 보관하지 않으며, 결제대행사가 제공하는 마스킹된 카드번호·승인번호는 거래 기록으로 보관" |
| 제4조 1항 "회원 탈퇴 시까지 … 즉시 파기" / 제10조 "회원 탈퇴는 고객센터로 요청" | 탈퇴·파기 기능 없음 [코드] | 약속한 절차가 시스템에 없음 | 파기 절차(관리자 기능 또는 수동 SQL 절차서) 마련 후 문구 유지 |
| 제4조 2항 상담 정보 1년, 7항 관리자 기록 3년 | 자동 삭제 없음(수동) [코드] | 이행 수단 없음 | pg_cron에 추가하거나 월 점검 항목으로 수동 파기 |
| 제8조 "이름·이메일 등 신원 정보와 연결하지 않습니다"(rsc_vid) | `page_views.member_id`에 로그인 회원 ID 저장 → 방문자 쿠키와 회원이 같은 행에 연결됨 [코드] | 사실과 다름 | "로그인 상태에서는 회원 ID와 함께 기록" 명시하거나 member_id 저장 중단 |
| 제2조 2항 "마케팅 정보 수신 동의 여부(선택)" | 동의값이 auth 메타데이터에만 저장, 어드민에서 조회·철회 처리 불가, 마케팅 발송 기능 없음 [코드] | 동의는 받지만 관리 수단 없음 | members 테이블에 동의값·일시 저장 및 철회 UI, 또는 항목 삭제 |
| 상담 신청 화면 동의 문구 "요청하시면 즉시 파기" | 파기 절차 없음 | 위와 동일 | 절차 마련 |
| 제2조 1항 상담 "이메일" 수집 | 상담 화면은 이메일을 받지 않음(`email:null`) [코드] | 수집하지 않는 항목 기재 | 삭제 |

---

## 7. 우선순위별 조치

### 즉시 (오픈 전, 사실 불일치 제거)
1. 처리방침에서 사용하지 않는 Resend·Sentry를 "현재 미사용, 도입 시 갱신"으로 바꾸거나 삭제. 제9조 국외 이전 표를 처리 종류별로 재작성. [내가 문안 작성 가능 → 사용자가 어드민에서 저장]
2. "일일 백업", "카드정보 미보관", "rsc_vid 미연결", "상담 이메일 수집" 문구 정정.
3. 보호책임자 성명 입력. [사용자: 어드민 → 사이트 관리 → 약관]
4. 회원 탈퇴·개인정보 삭제 절차 마련(최소한 관리자 수동 절차서: auth 사용자 삭제 → members cascade → inquiries 삭제 → page_views member_id null 처리 → bookings/payments는 법정 보존으로 분리 표시). [코드 작업 필요 — 별도 승인 후]
5. `opsAlert`·`console.error`에서 환불 사유 등 자유 텍스트 제거. [코드 작업 — 승인 후]

### 운영 확대 전 (실결제·실회원 받기 전)
6. Supabase Pro 전환 후 백업 확인, Leaked Password Protection 켜기, Auth Audit Logs 설정 확인. [사용자]
7. Supabase·Vercel DPA 체결 여부 확인·보관, sub-processor 목록·로그 저장 위치·지원 인력 접근 정책 문의 결과를 처리방침에 반영. [사용자 문의 / 법률 검토]
8. 토스 가맹 계약 체결 시 개인정보 조항 확인, `payments.raw` 저장 항목 최소화 검토. [코드 — 승인 후]
9. 상담 신청 동의 문구에 항목·목적·기간·거부권 명시(법 제15조 ②). 가입 화면 마케팅 동의 저장·철회 수단. [코드 — 승인 후]
10. 쿠키(`rsc_vid`) 발급 시점·고지: 처리방침 제8조 유지 + 필요 시 배너. [법률 검토 후 코드]
11. 상담 1년·관리자 기록 3년 자동 파기 cron 추가. [DB 마이그레이션 — 승인 후]
12. 관리자 IP 제한 실제 적용 여부 결정. [사용자: 어드민 → 일반 설정 → 보안]

### 이후 개선
13. Sentry 도입 시 EU 리전 선택 여부·보관 30일 반영. Resend 도입 시 자체 도메인·추적 꺼짐 확인·30일 반영, 또는 국내 발송 서비스 검토.
14. Vercel Node.js 미들웨어 실행 리전 확인 후 필요 시 구조 변경(세션 검증을 미들웨어에서 서버 컴포넌트로 이동하면 미들웨어가 쿠키를 Supabase에 보내지 않게 할 수 있음).
15. 네이버 로그인 도입 시 휴대폰 수집 항목·오류 로그 마스킹.

---

## 8. A안 vs B안

### A안: 현 구성 유지 + 전송 최소화·설정·계약·고지 정비 (권장)
- 바꿀 것: 처리방침 재작성(사실 일치, 국외 이전 표), 탈퇴·파기 절차, 로그·알림 PII 제거, 동의 문구 보강, 자동 파기 cron, DPA 체결, Pro 플랜 백업, 미들웨어 리전 확인.
- 내가 코드로 할 수 있는 것: 위 4·5·8·9·11·14·15 항목, 처리방침 문안 초안.
- 사용자가 관리 화면에서 할 것: 보호책임자 성명, 처리방침 저장, Supabase Pro·Leaked Password·Audit Logs, DPA 다운로드·서명, Vercel 미들웨어 리전 확인.
- 업체 확인: Supabase 로그 저장 리전·지원 접근 정책·sub-processor, Vercel 동일 + Node.js 미들웨어 리전, 토스 재위탁.
- 영향: 기능 변화 없음, 비용은 Supabase Pro(월 25달러, 공식 문서 확인)만 추가. 서비스 중단 없음. 데이터 이전 없음.
- 테스트·되돌리기: 기존 Vitest 47개 + 탈퇴 흐름 테스트 추가, 스테이징 브랜치에서 확인 후 배포. 되돌리기는 이전 커밋 재배포.

### B안: 개인정보 처리 위치를 국내로 제한
- 바꿀 것: ① DB·Auth·Storage → 국내 사업자 Postgres(예: 네이버클라우드·NHN클라우드·KT클라우드 관리형 DB 또는 국내 VM에 Supabase 셀프호스팅) ② 호스팅 → 국내 클라우드 VM/컨테이너(Next.js standalone) 또는 국내 PaaS ③ 이메일 → 국내 발송(네이버클라우드 Outbound Mailer, NHN Cloud Email 등) ④ 오류 감지 → 셀프호스팅 Sentry 또는 국내 APM.
- 내가 코드로 할 수 있는 것: Supabase 클라이언트는 URL·키만 바꾸면 셀프호스팅 Supabase에 그대로 붙음(RLS·트리거·RPC 유지). Vercel 전용 기능(`x-vercel-ip-country`, `VERCEL_*` env, Routing Middleware)은 Nginx/애플리케이션 레벨로 대체 코드 필요. 이메일 함수 교체.
- 사용자가 할 것: 국내 클라우드 계정·결제, 서버 운영(패치·백업·모니터링)을 직접 또는 운영 대행에 맡기기 — **비개발자 단독 운영 난이도 큼**.
- 업체 확인: 국내 업체도 해외 리전·해외 재위탁(예: 글로벌 CDN, 해외 지원센터) 여부 확인 필요. 셀프호스팅 Supabase는 로그·이메일 컴포넌트를 직접 구성해야 함.
- 비용: 확인 가능한 공식 근거를 이 세션에서 열람하지 못해 숫자 제시 안 함(각 사 요금표 확인 필요).
- 이전·중단: pg_dump/restore로 DB 이전(수 시간, 점검 모드 필요), Auth 사용자는 Supabase에서 비밀번호 해시 포함 내보내기 가능하나 소셜 연동 재설정 필요, Storage 파일 수동 복사. 도메인 전환 시 짧은 중단.
- 테스트·되돌리기: 스테이징에서 전체 흐름(가입·예약·결제·환불) 재검증. 되돌리기는 기존 Supabase·Vercel을 일정 기간 유지(이중 비용).
- 판단: 회원 수가 적고 실결제 전 단계인 지금은 A안으로 법 요건(공개/통지 또는 동의)을 갖추는 것이 합리적. B안은 회원 규모가 커지거나 법률 검토 결과 국외 이전 자체가 부적절하다고 판단될 때 재검토.

---

## 9. 사용자가 직접 확인할 화면과 질문

| 화면 | 확인할 것 |
|---|---|
| Supabase → Project Settings → General | Region = Northeast Asia (Seoul) |
| Supabase → Database → Backups | 무료 플랜이면 "업그레이드 필요" 표시. Pro 후 7일치 목록 |
| Supabase → Authentication → Providers → Email | Confirm email 꺼짐 여부(가입 즉시 로그인되는 현재 동작) |
| Supabase → Authentication → Configuration → Audit Logs | DB 저장 여부 토글 |
| Supabase → Authentication → Attack Protection (또는 Security) | Leaked password protection 켜기(권장) |
| Supabase → Authentication → SMTP Settings | 커스텀 SMTP 미설정(기본 서비스) 확인 |
| Supabase → Organization → Legal Documents / supabase.com/legal/dpa | DPA, sub-processor 목록, SOC2(Team 이상) |
| Supabase → Logs → Explorer | edge_logs에 IP 헤더가 남는지 샘플 확인(개인정보이므로 캡처는 하지 마세요) |
| Vercel → Project → Settings → Functions | Function Region = Seoul(icn1). Middleware/Proxy 실행 리전 표시 |
| Vercel → Project → Analytics / Speed Insights | 둘 다 "Enable" 상태(미활성)인지 |
| Vercel → Project → Firewall | 규칙 없음, Attack Challenge Mode 꺼짐 |
| Vercel → Project → Settings → Environment Variables | RESEND_API_KEY·SENTRY DSN·NAVER_* 가 정말 없는지(이 보고서와 동일해야 함) |
| Vercel → Account/Team → Settings → Legal / vercel.com/legal/dpa | DPA 수락 여부 |
| 사이트 `/api/health` | resendApiKey:false, sentryDsn:false, tossTestKeys:true, auth.mailerAutoconfirm:true 인지 |
| 어드민 → 일반 설정 → 보안 | 관리자 허용 IP 비어 있음(현재), 로그인 잠금 5회/15분 |
| 어드민 → 사이트 관리 → 약관 → 개인정보처리방침 | 보호책임자 성명 입력, 조문 번호 확인 |
| 토스페이먼츠 개발자센터 | 가맹점 계약 상태, 웹훅 등록 여부 |

업체에 보낼 질문(그대로 복사 가능):
- Supabase: "프로젝트 ref vfjpouuwvwgiqpwttyup(ap-northeast-2)의 플랫폼 로그(edge/auth/postgres logs)와 일일 백업은 어느 국가·리전에 저장됩니까? 기술 지원 시 직원이 고객 데이터에 접근하는 절차와 접근 직원 소재 국가는 어떻게 됩니까? 현재 sub-processor 목록을 주십시오."
- Vercel: "Next.js 16 proxy(Node.js Routing Middleware)는 프로젝트 함수 리전(icn1)과 무관하게 전 리전에서 실행됩니까? 특정 리전으로 고정할 방법이 있습니까? 런타임 로그·요청 로그의 저장 국가는 어디입니까?"
- 토스페이먼츠: "가맹점 계약 시 개인정보 처리 관계(수탁/독립 처리)와 해외 재위탁 여부를 확인해 주십시오."

---

## 10. 추가 법률 검토가 필요한 사항 (기술 점검으로 확정 불가)

1. **국외 이전 근거 선택**: Supabase·Vercel을 "정보주체와의 계약 체결·이행을 위한 처리위탁·보관"(법 제28조의8 ①3호)으로 보아 처리방침 공개로 갈 수 있는지, 아니면 별도 동의(①1호)가 필요한지. 로그·지원 접근처럼 계약 이행에 필수적이지 않은 처리가 섞여 있을 때의 판단.
2. **처리방침 공개 시 기재 항목**(②각 호: 항목, 국가·시기·방법, 이전받는 자 성명·연락처, 이용 목적·보유기간, 거부 방법·절차·효과)을 처리 종류별로 어떻게 나눠 쓸지.
3. **제26조 위탁**: 위탁 계약 문서(DPA)가 제26조 ①의 필수 기재사항(목적 외 처리 금지, 보호조치, 재위탁 제한, 관리·감독, 손해배상)을 충족하는지. 해외 표준계약(SCC)·GDPR 준수·SOC2만으로는 한국법 요건 충족을 단정하지 않음.
4. **토스페이먼츠의 법적 지위**(수탁자 vs 독립 처리자·제3자 제공)와 처리방침 기재 방식.
5. **상담 설문의 "현재 싱글 여부", 삶의 단계 등**이 민감정보 또는 사생활 침해 우려 정보에 해당하는지, 별도 동의 필요 여부.
6. **"만 19세 이상·미혼 확인"** 체크 항목의 처리 근거.
7. **접속 기록·쿠키(rsc_vid)** 에 대한 고지 방식(처리방침만으로 충분한지, 배너 필요 여부)과 통신비밀보호법상 접속기록 보관 의무 적용 여부.
8. **탈퇴 시 파기와 전자상거래법 보존(5년·3년)** 의 분리 보관 방식, 백업본 잔존 기간 안내 문구.
9. 마케팅 수신 동의(정보통신망법 제50조) 관리·철회 절차.

법령 원문(law.go.kr 개인정보 보호법 제26조·제28조의8, 시행령 제29조의8~11)은 이 세션의 네트워크에서 열람이 차단되어 **원문 대조를 하지 못했습니다.** 위 요약은 검색 결과(2023년 개정 요지)와 일치하지만 조문 문언은 직접 확인이 필요합니다.

---

## 11. 확인한 범위 / 확인하지 못한 범위

**직접 확인함**
- 저장소 전체 소스(app/lib/components/proxy/설정 파일), package.json 의존성, .env.example, vercel.json, GitHub Actions 워크플로
- Supabase 운영 프로젝트: 리전·상태·테이블 목록과 행 수·RLS 정책 전문·버킷 공개 여부·pg_cron 작업·Security Advisor·auth 스키마 컬럼명·결제 raw의 키 목록과 카드번호 마스킹 여부(값은 보지 않음)·site_content 문서 존재 여부
- Vercel 운영 프로젝트: 환경변수 이름·대상 환경·타입(값은 복호화하지 않음), 리전, 도메인, 배포 상태, 방화벽 설정 유무, 로그 드레인 유무, 배포 보호
- 설치된 패키지 내부: Next.js 16 proxy 런타임 문서, Sentry SDK의 PII 기본값 코드
- 공식 문서(도구로 조회): Supabase GDPR/리전/백업/SMTP/로그/감사로그/SOC2 문서, Vercel 함수 리전·미들웨어·캐시·로그 드레인 문서

**확인하지 못함(네트워크 차단 또는 권한)**
- Resend·Sentry·토스·law.go.kr·privacy.go.kr 원문 페이지(검색 결과 요약으로 대체, [문서-검색] 표기)
- Supabase·Vercel의 로그 저장 리전, sub-processor 목록, 지원 인력 접근 정책(문서에 명시 없음)
- Vercel Node.js 미들웨어의 실제 실행 리전(문서 검색 요약만 확보)
- 운영 사이트의 `/api/health` 응답(MCP 접근 거부; 환경변수 목록으로 대체)
- Supabase 대시보드 전용 설정(Confirm email, SMTP, Audit Logs 토글, Leaked Password 외 항목), Vercel 대시보드 Analytics 토글
- 토스 가맹 계약 내용, 각 업체 DPA 서명 여부
