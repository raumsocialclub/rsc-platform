# 개인정보 점검 후속 조사 (2026-09-23, 2차)

1차 보고서 `docs/privacy-audit-2026-09-23.md`(328줄, 11장 전체 수록)에 대한 12개 보완 요청의 조사 결과. 이번에도 운영 배포·고객 데이터 삭제·유료 변경은 하지 않았고, 코드 수정은 "수정안"으로만 적었다.

근거 표기: [코드] [운영] [문서] [문서-검색](원문 차단, 검색 요약) [로컬 재현](운영과 같은 공개 환경변수로 로컬 빌드·가상 데이터 실행) [확인 필요]

---

## 항목별 조사 결과

### 2. 조사 대상 커밋 vs 실제 운영 배포

| 구분 | 값 | 근거 |
|---|---|---|
| 고객이 접속하는 운영 도메인 | `rsc-platform.vercel.app` (별칭 `rsc-platform-theraumai-5200.vercel.app`) | [운영] `list_project_domains`, `list_deployment_aliases` |
| 운영 도메인이 가리키는 배포 | `dpl_9vYx1mNFJq7Jud1hPDMe2AMqLShj`, target=production, READY, 커밋 **7f998e2** | [운영] `get_deployment("rsc-platform.vercel.app")`, `list_deployments target=production` 최신 |
| 브랜치 최신 커밋 | **10bcd80** = 7f998e2 + `docs/privacy-audit-2026-09-23.md` 1개 파일(문서만). 미리보기 배포 `HtamkKXp4…`(preview)만 생성, 운영 미반영 | [운영] PR #1 head, Vercel bot 코멘트 |
| 환경변수 | 11개. 마지막 변경 시각이 운영 배포 생성 시각보다 약 3시간 40분 앞섬 → 운영 배포는 현재 환경변수 집합으로 빌드됨. 이후 변경 없음 | [운영] `filter_project_envs` updatedAt vs deployment createdAt |
| 결론 | 1차 조사의 코드(7f998e2) = 운영 배포 코드. 브랜치는 문서 1개만 앞섬. 환경변수는 배포 시점과 현재가 동일 | |

### 3. Vercel Hobby 비상업 제한

- 공식 근거(원문 페이지는 이 환경에서 차단, 검색 요약으로 확인): `vercel.com/docs/plans/hobby` "Hobby teams are restricted to non-commercial personal use only", `vercel.com/docs/limits/fair-use-guidelines` "Commercial usage is defined as any Deployment that is used for the purpose of financial gain of anyone involved…", `vercel.com/legal/terms` "you shall only use the Services under a Hobby plan for your personal or non-commercial use". [문서-검색]
- 우리 계정이 Hobby임을 보여주는 운영 증거: `update_project deploymentPolicy` 호출이 `403 pro_plan_required`로 거부됨(1차 세션). [운영]
- 라움은 유료 프로그램을 판매하는 사업이므로 **고객 모집 전 Pro 전환이 필요**. 변경안: Vercel → Team Settings → Billing → Upgrade to Pro(요금은 공식 요금 페이지 확인, 이 환경에서 미열람). Pro 전환 후 할 일: `deploymentPolicy`(main 자동배포 차단) 재설정, 런타임 로그 보관 연장, Spend Management 한도 설정, 팀 멤버 2FA. 요금제 변경은 사용자 작업.

### 4. Resend·Sentry 비활성 검증 (환경변수 외 근거)

| 검증 | 결과 | 근거 |
|---|---|---|
| 운영 환경변수 | production에 `RESEND_API_KEY`, `NEXT_PUBLIC_SENTRY_DSN`, `SENTRY_DSN` 없음 (hiddenProductionEnvCount 0) | [운영] |
| 운영 배포 시점 | 배포가 마지막 env 변경 이후 생성 → 위 상태로 빌드됨 | [운영] |
| 로컬 운영 빌드 | 운영과 같은 공개 env(비밀키 제외)로 `next build` 성공. 클라이언트 번들의 Sentry 초기화는 `enabled:!!env.NEXT_PUBLIC_SENTRY_DSN` 형태로 남아 값이 없으면 `enabled:false` | [로컬 재현] |
| 가상 데이터 통신 확인 | Playwright로 비로그인·가짜 세션 쿠키(회원 A) 두 컨텍스트에서 `/`, `/fit-check`, `/join`, `/login`, `/checkout/success?paymentKey=x&orderId=y&amount=1`(오류 경로), `/nonexistent-page`(404) 방문 → **외부 호스트 요청 0건**(sentry.io·resend.com 없음), 페이지 오류 0건 | [로컬 재현] |
| 로컬 `/api/health` | `resendApiKey:false`, `sentryDsn:false`, `tossTestKeys:true` | [로컬 재현] |
| 운영 서버 직접 확인 | **불가**: 샌드박스에서 vercel.app 차단, Vercel MCP 페이지 조회는 "deployment 접근 거부", 런타임 로그 조회는 team 범위 403 | [확인 필요] |

사용자 확인 방법(2분): ① 브라우저에서 `https://rsc-platform.vercel.app/api/health` 열기 → `"resendApiKey":false`, `"sentryDsn":false`, `"tossTestKeys":true` 확인. ② 사이트에서 F12 → Network 탭 → 필터에 `sentry` 입력, 페이지 몇 개 이동 → 요청 0건. `resend`도 동일(브라우저에서는 원래 안 보이므로 ①로 확인).

### 5. Supabase Auth 이메일 경로

| 경로 | 코드가 호출하는가 | 메일이 나가는가 | 근거 |
|---|---|---|---|
| 가입 확인(Confirm email) | `signUp` 호출함 | Confirm email이 **꺼져 있으면** 안 나감(가입 즉시 세션). 켜져 있으면 **Supabase 기본 발송 서비스**로 확인 메일이 나감(Resend 키와 무관) | [코드] `RegisterForm.tsx`; [문서] auth-smtp: 기본 서비스는 rate-limit·best-effort |
| 비밀번호 재설정 | `resetPasswordForEmail` **호출 없음**(화면에 링크 없는 글자만) | 안 나감 | [코드] |
| 매직링크/OTP | `generateLink(type:'magiclink')`는 링크만 만들고 서버가 즉시 검증. 메일 발송 없음 | 안 나감 | [코드] naver callback; [문서] generateLink는 발송하지 않음 |
| 관리자 초대 | `admin.createUser({email_confirm:true})` → Supabase 메일 없음. 초대 링크 메일은 우리 `lib/notify.ts`(Resend, 현재 꺼짐) | 안 나감(어드민 화면에 링크 표시로 대체) | [코드] |
| 이메일 변경·재인증 | 호출 없음 | 안 나감 | [코드] |
| Send Email Hook / Before User Created Hook | 코드에 없음. 대시보드 설정은 MCP로 읽을 수 없음 | — | [문서] auth-hooks; [확인 필요] Dashboard → Authentication → Hooks |
| 커스텀 SMTP | 코드에 없음 | — | [확인 필요] Dashboard → Authentication → Emails/SMTP |
| 최근 24시간 Auth 로그 | auth_logs 1,752건 중 `mail/smtp/recover/confirm/hook` 관련 이벤트 **0건**, 로그인 이벤트만 존재 | 발송 없음 | [운영] `query_logs` |

부수 발견: Supabase auth_logs에는 로그인 계정의 **이메일 주소가 그대로 기록**된다(actor_username). 즉 로그 저장 위치가 곧 개인정보(이메일) 처리 위치이며, 1차 보고서의 "로그 리전 확인 필요"가 이메일에도 적용된다. [운영]

또 `auth.audit_log_entries`는 0행인데 로그 스트림의 `auth_audit_logs`는 29건 → DB 기록이 꺼진 상태로 보임(문서상 기본은 둘 다 저장). 대시보드에서 토글 확인 필요.

### 6. 익명 호출 가능한 SECURITY DEFINER 함수 4개

공통: 모두 `SET search_path = public` 고정(검색경로 주입 방지) [운영 pg_proc.proconfig]. 가상 테스트는 트랜잭션 안에서 `set local role anon`으로 실행 후 롤백, 실제 데이터 미변경.

| 함수 | 목적 | 실행 권한(ACL) | 본인/관리자 검사 | 반환 정보 | anon 가상 테스트 | 판단·조치 |
|---|---|---|---|---|---|---|
| `is_admin()` | RLS 정책용 관리자 판정 | public, anon, authenticated, service_role | `auth.uid()` 기준 본인 행만 조회 | boolean | `false` | 위험 낮음(자기 권한 여부만). 그러나 REST `/rpc/is_admin`로 노출될 이유가 없음 → **`private` 스키마로 이동**(API 미노출)하고 정책에서 `private.is_admin()` 호출. 정책이 anon 컨텍스트에서도 평가되므로 anon EXECUTE 자체는 필요(스키마 이동이 정답) |
| `is_owner()` | 주관리자 판정 | 동일 | 동일 | boolean | `false` | 동일 |
| `session_remaining(uuid)` | 회차 잔여석 | public, anon, authenticated, service_role | 없음(회차 ID만 알면 누구나) | int | 모르는 ID → `null` | 노출 정보는 잔여석 수(개인정보 아님). 다만 회원 전용 화면에서만 쓰이므로 **anon EXECUTE 회수**, `session_availability` 뷰도 authenticated만 |
| `verify_invite_code(text)` | 가입 전 초대코드 검증 | anon, authenticated, service_role | 없음 | `{valid, code, name(초대받은 사람 이름)}` | 모르는 코드·빈 문자열 → `NOT_FOUND` | 코드를 아는 사람에게 **초대받은 사람 이름**을 돌려줌(의도된 UX지만 개인정보). 32^8 조합이라 무차별 대입은 비현실적이나 `/api/invites/verify`에 속도 제한이 없음 → **anon EXECUTE 회수 + 서버 라우트는 service role로 호출 + 속도 제한**. 이름 대신 마스킹(홍*동) 반환 검토 |

같은 조회에서 드러난 **더 큰 문제 2건**(함수가 아니라 테이블 권한·정책):

- **회원이 자기 `members` 행의 `role`·`status`·`invite_code_id`·`memo`를 직접 바꿀 수 있음.** `authenticated` 역할에 `members` UPDATE 권한이 모든 컬럼에 있고(`has_column_privilege` role/invite_code_id/status 모두 true), 정책 `self update`가 `using (id = auth.uid() or is_admin())`만 있고 `with check`가 없어(USING이 그대로 적용) 새 값에 제한이 없다. 즉 로그인한 회원이 anon 키 + 자기 세션으로 `PATCH /rest/v1/members?id=eq.<본인>` `{"role":"owner"}` 를 보내면 **주관리자가 될 수 있고**, `invite_code_id`를 아무 값으로 넣어 초대제 검사를 우회할 수 있다. [운영] 권한·정책 조회로 확인(실행 테스트는 데이터 변경 우려로 생략). **오픈 전 필수 수정.**
- **`site_content`가 누구에게나 읽힘**(정책 `using(true)`, anon SELECT). 지금은 `legal.privacy` 1행뿐이지만, 어드민에서 일반 설정을 저장하는 순간 `settings.security`(관리자 허용 IP), `settings.access`(차단 IP), `settings.notify`(운영 알림 이메일)가 **REST로 공개**된다. proxy가 anon 키로 읽는 구조 때문. → 설정 문서는 service role 전용 테이블로 분리하거나, 공개 read 정책을 `page in ('global','home',…)`로 제한하고 proxy는 서버 전용 키로 읽게 변경.
- 부수: `self read` 정책으로 회원이 자기 행의 **관리자 메모(memo)** 를 읽을 수 있음(컬럼 권한으로 memo SELECT 회수 또는 뷰 분리).
- `anon`이 모든 public 테이블에 DELETE/INSERT/UPDATE/TRUNCATE 권한을 가짐(Supabase 기본 grant). RLS가 막고 있으나(anon 가시 행 0) 최소 권한 원칙상 anon에는 필요한 SELECT/INSERT(inquiries)만 남기는 정리 권장.

### 7. 회원 탈퇴 설계 (실제 삭제는 하지 않음)

현재 상태 [코드]: 탈퇴 기능 없음. `members.status='withdrawn'`은 예약만 막고, 로그인 세션·개인정보·통계 연결은 그대로. FK: `members.id → auth.users on delete cascade`, `bookings/payments.member_id → members` (cascade 아님), `memberships → members cascade`.

설계(단계별, 트랜잭션 + 서버 service role):

1. 요청 접수: `/my` "회원 탈퇴" 버튼(비밀번호 재입력 또는 이메일 확인) 또는 어드민 "탈퇴 처리". `withdrawal_requests`(member_id, requested_at, by, reason) 기록.
2. 로그인 차단: `auth.admin.signOut(userId,'global')`로 모든 세션·리프레시 토큰 폐기 → `auth.admin.updateUserById({ban_duration:'876000h'})` 또는 즉시 삭제. 발급된 액세스 JWT는 최대 1시간 유효하므로 `proxy.ts`/`getCurrentMember`가 `members.status='withdrawn'`을 보면 즉시 403 처리(현재는 홈으로 리다이렉트만).
3. 법정 거래정보 분리 보존: `bookings`·`payments`는 그대로 두되(전자상거래법 5년), 소비자 식별에 필요한 최소 항목만 `retained_transactions`(order_id, payment_key, amount, approved_at, cancelled_at, **이름·이메일·휴대폰의 암호화값 또는 마스킹값**)에 복사. 주관리자만 읽는 RLS. 어떤 식별자를 남길지는 법률 검토.
4. 일반정보 파기: `members` 행을 가명화(name→'탈퇴회원', email/phone/memo→null, withdrawn_at 기록, id 유지: bookings FK 보존). `auth.users` 삭제 전에 **FK를 `on delete cascade`에서 분리**(마이그레이션: members.id FK 제거 또는 `on delete no action`)하지 않으면 members 행이 함께 지워져 bookings FK 위반이 난다. 순서: FK 변경 → 가명화 → `auth.admin.deleteUser`.
5. 연관 데이터: `inquiries`(같은 휴대폰·이메일) 삭제 또는 가명화, `invite_codes.used_by`는 유지(코드 이력) 단 `issued_to_name/phone` null, `login_attempts` `email:*` 키 삭제, `admin_invites` 해당 이메일 행 삭제, `page_views.member_id` → null(통계 연결 제거), `admin_logs.detail`에 이메일이 있는 항목(`admin.accept`)은 마스킹.
6. 삭제 원장: `deletion_ledger`(member_id uuid, deleted_at) — 개인정보 없음. 백업 복원 시 재반영: 복원 직후 실행하는 `reapply_deletions()` 함수가 원장의 id를 다시 가명화·삭제. `MAINTENANCE.md`에 "복원 후 반드시 실행" 항목 추가. Supabase Pro 백업은 7일 뒤 자동 소멸(문서) → 처리방침에 "백업본은 최대 7일 후 소멸, 복원 시 파기 재적용" 문구.
7. 통지·기록: 탈퇴 완료 안내(메일 발송 수단 확정 후), `admin_logs`에 `member.withdraw`(대상 id만).
8. 테스트: Vitest에 가상 회원으로 위 1~6 단계 순서·롤백 검증, 스테이징에서 실행.

### 8. 동의 화면·상세 안내·마케팅 동의·관리자 권한 의존성

- 상담(Fit Check): 체크박스 문구 "개인정보 수집 및 이용에 동의합니다. 가입 상담 목적으로만 사용되며, 요청하시면 즉시 파기합니다." → 수집 항목·보유 기간·거부권과 불이익(법 제15조 ②)이 화면에 없고, 상세 안내 링크도 없음. "즉시 파기" 절차 부재. [코드]
- 회원가입: [필수] 이용약관·개인정보 처리방침 동의(링크) + [필수] 만 19세 이상·미혼 확인 + [선택] 프로그램 소식 알림. **연결된 `/terms`는 자리 문구 상태**로 화면 상단에 "아래 내용은 자리 문구입니다… 법무 검토를 거친 실제 문구로 교체해야" 배너가 보임 → 자리 문구에 동의를 받고 있는 상태. `/privacy`는 실제 문구(1차 보고서의 정정 필요 항목 포함). [코드][운영]
- 마케팅 동의 저장 위치: `auth.users.raw_user_meta_data.marketing_opt_in`만. 이 필드는 **사용자가 `supabase.auth.updateUser({data})`로 직접 바꿀 수 있는 영역**이고, 동의 시각·문구 버전이 없으며 앱 어디서도 읽지 않음. [코드][운영 auth_meta_keys]
- 개선안: `consents` 테이블(member_id, kind ∈ {terms, privacy, adult_single, marketing}, version text, granted bool, granted_at, withdrawn_at, source ∈ {signup, my, admin}, user_agent) + RLS(본인 select, 쓰기는 서버). 가입 시 트리거 `handle_new_user`가 메타데이터의 동의값을 읽어 `consents`에 **버전과 함께** 삽입(버전 = `site_content.legal.*.updated` 또는 코드 상수 `LEGAL_VERSION`), 이후 메타데이터는 무시. `/my`에 마케팅 수신 토글(철회 시각 기록), 어드민 회원 상세에 동의 이력 표시, CSV 회원 목록에 마케팅 동의 컬럼. 약관 개정 시 버전 갱신 → 재동의 배너.
- 관리자 권한 의존성: 권한 판정은 `members.role`(DB 컬럼)이며 user_metadata를 쓰지 않음. 트리거의 `admin_invite`는 가입 INSERT 시점 1회만 읽고 초대 이메일 일치·미사용·미만료를 검증하므로 가입 후 메타데이터를 바꿔도 효과 없음. **단, 6번의 `members` self-update 결함 때문에 회원이 `role`을 직접 바꿀 수 있어 실질적으로 권한이 사용자 수정 가능 상태**임. `getCurrentMember`는 표시 이름 fallback으로만 user_metadata.name 사용. [코드]

### 9. 토스페이먼츠: 테스트 키 vs 가맹 계약, 웹훅·결제 방어, raw 저장

- 구분: **① 테스트 키 사용** = 토스 문서 공용 샌드박스 키(`test_gck_docs_…`)로 실제 돈이 오가지 않는 모의 결제. **② 가맹점 계약 미체결** = 토스 개발자센터에 우리 사업자 등록·심사가 없어 라이브 키(`live_…`)를 받을 수 없는 상태. ①은 ②가 끝나야 교체 가능. 심사에는 사업자정보·이용약관·환불규정·개인정보처리방침 실제 문구가 필요. [운영][코드]
- 결제 승인(`/api/payments/confirm`, `/checkout/success`): 로그인 필수 → `booking.member_id === me.id` 확인 → 상태 `pending`·미만료 확인 → **클라이언트 amount == booking.amount** 확인 후에만 토스 호출 → 토스 응답 `totalAmount == booking.amount` 재확인 → `payments` upsert(`payment_key` 유일) → `bookings` `status=pending`인 행만 confirmed. 중복 승인은 `ALREADY_PROCESSED_PAYMENT` 시 조회로 이어감. Vitest로 금액 불일치·타인 예약·만료·중복 케이스 검증(47개 통과, CI 10bcd80). [코드][운영 CI]
- 웹훅(`/api/payments/webhook`): 본문을 신뢰하지 않고 `paymentKey`로 토스 재조회 → 토스가 준 `orderId`로 예약 조회 → `DONE`+`pending`일 때만 확정(금액 재검증 포함), `CANCELED`+`confirmed`일 때만 취소 반영. 소유자 검사는 토스 데이터가 기준이라 불필요. **취약점**: `TOSS_WEBHOOK_SECRET` 미설정이라 아무나 POST 가능 → 우리 서버가 토스 API를 대신 호출하게 만드는 남용(요청 폭주·토스 API 한도 소진) 가능. 항상 200 반환은 재전송 폭주 방지 의도이나 남용 방어는 없음. → **비밀키 설정(사용자) + 속도 제한**.
- 취소·환불: 회원 취소는 소유자·정책 검사, 관리자 환불은 `requireAdmin` + 사유 필수 + 로그. 부분 취소 금액은 `balanceAmount` 상한. [코드]
- 요청 남용 방어: `/api/inquiries`(스팸 대량 등록), `/api/invites/verify`(코드 추측), `/api/bookings`(회원이 15분 좌석 홀드 반복), `/api/payments/webhook`에 **속도 제한·캡차 없음**. 로그인 잠금은 이메일·IP 단위 5회/15분이라 같은 IP(사무실·카페)를 쓰는 다른 회원까지 잠길 수 있음. → Vercel Firewall 규칙 또는 코드 레벨 제한.
- `payments.raw` 축소: 앱이 실제로 읽는 필드는 `raw.balanceAmount` 하나(cancel.ts, admin/queries.ts, statsFull.ts). 저장 항목을 화이트리스트로 줄일 수 있음: `{paymentKey, orderId, status, method, totalAmount, balanceAmount, approvedAt, receipt.url, easyPay.provider, card.{issuerCode, acquirerCode, number(마스킹), approveNo, installmentPlanMonths, cardType}, cancels[]}`. 제외: `secret`(토스 웹훅 검증용 비밀값), `checkout.url`, `metadata`, `mobilePhone`, `virtualAccount`, `transfer`, `cashReceipts` 등. 마이그레이션은 기존 행도 같은 규칙으로 정리(삭제가 아니라 축소, 승인 후).

### 10. 관리자 조회·다운로드 기록, 로그 내 개인정보, 캐시 분리

- `admin_logs` 기록 대상 18종(초대 발급·수락·권한·정지, 프로그램·소식 CRUD, 회원 상태·메모 변경, 환불, 캐시 삭제). **기록되지 않는 것**: 회원 목록·상세 조회, 상담 상세 조회, 주문 조회, **CSV 다운로드 2종**(`/api/admin/stats/export`, `/api/admin/orders/export`). → 다운로드·상세 조회에 `logAdmin('export.*', type, rows)` 추가.
- 개인정보가 남는 서버 로그(Vercel 런타임, Hobby 보관 미확인): `console.error("[ops-alert]", detail)`(환불 사유), `[auth/naver] profile`(켜질 경우 프로필 전체), `[admin-invite/accept] createUser` 오류 객체. `/api/track`은 IP·UA를 저장하지 않음. Supabase 로그에는 이메일(auth_logs)·IP 헤더(edge_logs).
- 캐시 분리 [로컬 재현, 가상 세션]: 아래 표. 로그인 쿠키(가짜)만 있어도 공개 페이지가 `private, no-store`로 바뀌고 회원·관리자 경로는 로그인으로 리다이렉트. API는 캐시 헤더 없음. 회원 A·B 응답이 섞일 경로 없음.

| 경로 | 비로그인 | 회원 A(가짜 세션) | 회원 B |
|---|---|---|---|
| `/`, `/pricing`, `/privacy`, `/news` | 200, `public, s-maxage=60, swr=300` | 200, `private, no-cache, no-store` | 동일 |
| `/programs`, `/my`, `/admin`, `/checkout` | 307 → /login | 307 → /login(로컬은 Supabase 차단으로 세션 검증 실패) | 동일 |
| `/api/health` | 200, 캐시 헤더 없음 | 동일 | 동일 |

  단, 두 가지 주의: ① proxy가 넣는 `Vary: Cookie`가 최종 응답에서 **사라짐**(Next가 자체 Vary로 덮음). ② Vercel CDN은 `Vary: Cookie`를 존중하지 않음(고카디널리티 헤더 제외) [문서-검색 caching/cdn-cache]. 따라서 로그인 회원이 `/`를 열면 **비로그인 상태로 캐시된 페이지(로그인 버튼이 보이는 GNB)** 를 최대 60초+SWR 동안 받을 수 있다. 개인정보 유출은 아니지만(비로그인 페이지에는 개인정보 없음) 화면 불일치. 반대 방향(회원 페이지가 캐시되는 것)은 없음. → GNB 로그인 표시를 클라이언트에서 그리거나 공개 페이지 캐시를 정적 자원 수준으로만 유지.

### 11. 보관·백업 근거 재확인 (정정)

| 항목 | 1차 기재 | 재확인 결과 | 상태 |
|---|---|---|---|
| Supabase 무료 플랜 백업 | "접근 가능한 백업 없음" | 문서(troubleshooting): "We are currently taking up to 7 daily backups that will be available for you once you upgrade… we might no longer make daily backups for free projects in the future." → **복구 가능 백업: 없음(사용자 조작 불가)** / **업체 내부 보관: 최대 7일(변경 가능)**. 우리 조직이 Free임은 프로젝트 2개 제한 오류로 확인 | [문서][운영] |
| Supabase 로그 보관 | Free 1일 / Pro 7일 | 공식 pricing 페이지 원문 미열람. 검색 요약: Free 1일, Pro 7일, Team 28일 | **미확인(검색 요약)** |
| Supabase 로그 저장 국가 | 확인 필요 | 변화 없음. 로그에 이메일·IP 포함 확인 | 미확인 |
| Vercel 런타임 로그 보관 | Hobby 1시간 등 | 공식 페이지(`vercel.com/docs/logs/runtime`) 원문 미열람. 검색 요약만 | **미확인(검색 요약)** |
| Sentry 보관 | 무료 30일 | `docs.sentry.io` 차단. 검색 요약: Developer 30일, Team/Business 90일. 우리 계정 없음 | **미확인(검색 요약)**, 미적용 |
| Resend 보관 | 30일 | `resend.com` 차단. 검색 요약: 이메일·로그 30일, 백업 7일, 미국 저장. 우리 계정 없음 | **미확인(검색 요약)**, 미적용 |
| Vercel Hobby 비상업 | — | 검색 요약(공식 docs 3곳 인용) | 문서-검색 |

### 12. 미확정 사항 목록 + 업체 문의문

미확정 목록:
1. Supabase 플랫폼 로그(edge/auth/postgres, 이메일·IP 포함) 저장 국가·리전, 보관 기간(플랜별 공식 수치).
2. Supabase 일일 백업(S3) 저장 리전, 무료 플랜 내부 백업의 현재 정책, 삭제 요청 후 백업 잔존 기간.
3. Supabase 기술 지원 직원의 고객 데이터 접근 절차·소재 국가·접근 기록 제공 여부.
4. Supabase sub-processor 목록(AWS, Cloudflare, 로그 백엔드 등)과 각 소재 국가.
5. Supabase 기본 Auth 이메일 발송 서비스의 발송 서버 위치·수신자 정보 보관.
6. Vercel Node.js Routing Middleware(Next 16 proxy) 실행 리전(전 리전 여부, icn1 고정 가능 여부).
7. Vercel 요청·런타임 로그·빌드 로그·환경변수의 저장 국가와 보관 기간(플랜별).
8. Vercel 지원 인력 접근 정책, sub-processor 목록.
9. Vercel Hobby→Pro 전환 후 데이터 처리 조건 변화 여부(DPA 적용 범위).
10. 토스페이먼츠: 가맹 계약상 개인정보 처리 관계, 재위탁·해외 처리 여부.

문의문(그대로 복사):

**Supabase (support 티켓, 영문)**
> Subject: Data location and retention details for project ref vfjpouuwvwgiqpwttyup (ap-northeast-2) — Korean PIPA compliance
> We operate a Korean membership service and must document cross-border transfers under Korea's Personal Information Protection Act. For the project above, please confirm in writing: (1) In which country/region are platform logs (edge_logs, auth_logs, postgres_logs) stored, and what is the retention period on the Free and Pro plans? Note that auth_logs contain user email addresses. (2) In which region are daily backups stored, and how long do backups persist after a row is deleted? Are internal backups taken for Free-plan projects, and where? (3) Under what procedure may Supabase staff access customer data for support, from which countries, and is an access log available to us? (4) Your current sub-processor list with each entity's country. (5) For the built-in Auth email service, where are emails sent from and is recipient data retained? (6) How do we execute the DPA on a self-serve plan? Thank you.

**Supabase (국문 요약, 필요 시)**
> 프로젝트 vfjpouuwvwgiqpwttyup(서울)의 플랫폼 로그(이메일 포함) 저장 국가·보관 기간, 일일 백업 저장 리전과 삭제 후 잔존 기간, 무료 플랜 내부 백업 여부, 기술 지원 직원의 데이터 접근 절차·국가·접근 기록 제공 여부, 현재 재수탁자 목록과 국가, 기본 Auth 이메일 발송 서버 위치, DPA 체결 절차를 서면으로 알려 주십시오.

**Vercel (support, 영문)**
> Subject: Data residency questions for project rsc-platform (prj_FRbcjZLbh6IXQltvemuNtFLnx8B6, functions in icn1)
> To document cross-border transfers under Korea's PIPA, please confirm: (1) Our Next.js 16 proxy (Node.js Routing Middleware) — does it execute in all regions regardless of the function region, and can it be pinned to icn1? (2) Where are request logs, runtime logs, build logs and environment variables stored, and what are the retention periods on Hobby and Pro? (3) Under what procedure may Vercel staff access deployment data or logs, and from which countries? (4) Your current sub-processor list with countries. (5) Does upgrading from Hobby to Pro change any data-processing terms or the DPA scope? Thank you.

**토스페이먼츠 (가맹 문의, 국문)**
> 라움소셜클럽(회원제 프로그램 예약·결제) 가맹 신청과 관련해, 가맹점 계약상 토스페이먼츠의 개인정보 처리 지위(수탁자/독립 처리자), 결제 정보의 해외 처리·재위탁 여부, 가맹점이 보관해도 되는 결제 응답 항목 범위(마스킹 카드번호·승인번호), 개인정보처리방침에 기재할 권장 문구를 알려 주십시오.

---

## 구분별 정리

### 확인된 문제
1. **회원이 자기 `members.role`·`status`·`invite_code_id`를 바꿀 수 있음**(권한 상승·초대제 우회). [운영 권한·정책 조회]
2. **`site_content` 전체 공개 읽기** → 일반 설정 저장 시 관리자 허용 IP·차단 IP·운영 알림 이메일이 REST로 노출. [운영 정책]
3. 회원이 자기 행의 관리자 메모(`memo`)를 읽을 수 있음. [운영 정책]
4. Vercel **Hobby 플랜으로 상업 서비스 운영 중**(약관 위반 상태). [운영·문서-검색]
5. 토스 **문서 공용 테스트 키** + 가맹 계약 미체결 → 실결제 불가. [운영]
6. 이용약관·환불규정이 **자리 문구**인 채로 가입 동의를 받음. [코드·운영]
7. 회원 탈퇴·파기 기능 없음, 비밀번호 재설정 없음. [코드]
8. 마케팅 동의가 사용자 수정 가능한 메타데이터에만 저장되고 시각·버전 없음. [코드·운영]
9. 상담 동의 문구에 항목·기간·거부권 미기재, "즉시 파기" 절차 없음. [코드]
10. 웹훅 비밀키 미설정 + 주요 공개 API 속도 제한 없음, 로그인 IP 잠금이 공용 IP 사용자에게 파급. [코드·운영]
11. `payments.raw`에 불필요 항목(`secret`, `checkout`, `metadata`, `mobilePhone` 등) 저장. [코드·데이터 구조]
12. CSV 다운로드·회원 상세 조회가 관리자 로그에 남지 않음. [코드]
13. `console.error`에 환불 사유 등 자유 텍스트, (네이버 켜질 경우) 프로필 전체 기록. [코드]
14. 로그인 회원이 공개 페이지의 비로그인 캐시본을 받을 수 있음(Vary: Cookie 미적용). 개인정보 유출은 아님. [로컬 재현·문서-검색]
15. Supabase Leaked Password Protection 꺼짐. [운영 advisor]
16. Supabase auth_logs에 이메일 기록 → 로그 저장 위치가 곧 이메일 처리 위치(리전 미확인). [운영]
17. 1차 보고서의 처리방침 불일치 항목 전부(제9조 국외 이전 표, 일일 백업, 카드정보, rsc_vid, 상담 이메일, 보호책임자 성명 등).

### 아직 확인되지 않은 위험
- Supabase·Vercel 로그·백업·지원 접근의 국가(12번 목록 1~9).
- Vercel Node.js 미들웨어 실행 리전(전 리전 가능성).
- 운영 서버에서 Resend·Sentry 무통신을 **운영 URL로 직접** 확인하지 못함(로컬 재현·환경변수로만 확인). 사용자 2분 확인 필요.
- Supabase 대시보드 전용 설정: Confirm email, Auth Hooks, SMTP, Audit Logs DB 기록 토글.
- 각 업체 보관 기간의 공식 수치(검색 요약만 확보).
- 토스 가맹 심사 요건과 계약 문구.

### 코드 수정안 (승인 후 진행, 우선순위 순)
1. DB: `members` UPDATE 정책을 관리자 전용으로 교체(`self update` 삭제, 회원 자기 정보 수정은 서버 라우트 + 허용 컬럼 화이트리스트), `memo` 컬럼 SELECT를 authenticated에서 회수, `is_admin/is_owner`를 `private` 스키마로 이동, `verify_invite_code`·`session_remaining` anon EXECUTE 회수(서버는 service role), `session_availability` authenticated 한정. Vitest에 가상 회원의 role 변경 시도 → 거부 테스트 추가.
2. DB: `site_content` 공개 read를 `page <> 'settings'`로 제한, `lib/settings/edge.ts`가 service role(서버 전용 env)로 읽도록 변경. (`proxy.ts`는 Node 런타임이라 가능)
3. 탈퇴 설계(7번) 구현: FK 변경, `consents`·`deletion_ledger`·`retained_transactions` 테이블, `/my` 탈퇴·마케팅 토글, 어드민 탈퇴 처리, `reapply_deletions()`, 상담 1년·관리자 로그 3년 자동 파기 cron.
4. 동의 기록(8번): `consents` + 트리거 + 버전 상수 + 상담 동의 상세 안내(항목·기간·거부권) + 가입 화면 동의 문구.
5. 결제: `TOSS_WEBHOOK_SECRET` 필수화(없으면 웹훅 401), `payments.raw` 화이트리스트 저장, 속도 제한(`@vercel/firewall` `checkRateLimit` 또는 DB 카운터)을 inquiries·invites/verify·bookings·webhook에 적용, 로그인 잠금은 이메일 우선·IP는 임계치 상향.
6. 로그: `opsAlert`·`console.error`에서 자유 텍스트 제거(사유는 DB에만), 네이버 콜백 오류 로그 마스킹. CSV 다운로드·회원 상세 조회 `logAdmin` 추가.
7. 캐시: GNB 로그인 상태를 클라이언트 렌더로 바꾸거나 공개 페이지 `s-maxage` 제거(설정 기본값 0) — 트래픽 규모상 캐시 없어도 무방.
8. `/api/track`: 서비스 키 없을 때 204+본문 버그 수정(운영 영향 없음), 쿠키 발급을 첫 상호작용 이후로 미루는 옵션.
9. 처리방침 문안 정정(1차 보고서 6장) + 이용약관·환불규정 실제 문구 반영(사용자 문안 필요).

### 내가(사용자가) 해야 할 설정
1. Vercel Pro 전환(상업 이용 요건). 전환 후 "배포 정책 켜라" 요청.
2. 토스페이먼츠 가맹 신청·심사 → 라이브 키·웹훅 비밀키를 Vercel 환경변수에 등록(`NEXT_PUBLIC_TOSS_CLIENT_KEY`, `TOSS_SECRET_KEY`, `TOSS_WEBHOOK_SECRET`).
3. Supabase Pro 전환(복구 가능 백업), Attack Protection → Leaked password protection 켜기, Authentication → Providers → Email → Confirm email 상태 확인, Hooks·SMTP 미설정 확인, Audit Logs DB 기록 토글 확인.
4. `https://rsc-platform.vercel.app/api/health`와 브라우저 Network 탭으로 Resend·Sentry 무통신 2분 확인.
5. 12번 문의문 3통 발송, 답변을 처리방침에 반영. Supabase·Vercel DPA 체결.
6. 어드민 → 사이트 관리 → 약관: 보호책임자 성명, 이용약관·환불규정 실제 문구.
7. (선택) 관리자 허용 IP 적용 여부 결정 — 단, 2번 코드 수정 전에는 설정 저장 시 IP 목록이 공개되므로 **수정 전에는 저장하지 말 것**.

### 법률 확인 필요 사항
1. 탈퇴 시 전자상거래법 보존 기록에 남길 소비자 식별 항목의 범위와 보관 형태(암호화·마스킹).
2. 국외 이전 근거 선택(제28조의8 ①1호 동의 vs ①3호 계약 이행 공개) 및 로그·지원 접근처럼 계약 이행에 필수적이지 않은 처리의 취급.
3. 상담 설문(싱글 여부·삶의 단계)·"미혼 확인"의 민감정보 해당 여부와 별도 동의 필요성.
4. 상담·가입 동의 문구의 법정 고지 항목 충족 여부, 마케팅 수신 동의(정보통신망법 제50조) 형식.
5. 토스페이먼츠의 법적 지위(수탁 vs 독립 처리자)와 처리방침 기재 방식.
6. 접속 기록·`rsc_vid` 쿠키 고지 방식, 통신비밀보호법 보관 의무 적용 여부.
7. 초대코드 검증 시 초대받은 사람 이름 표시가 제3자 제공에 해당하는지.

---

## 고객 모집·실결제 전 완료 항목 (우선순위)

| # | 항목 | 담당 | 상태 | 검증 근거(완료 항목만) |
|---|---|---|---|---|
| 1 | `members` 자기 role 변경 차단(코드 수정안 1) | Claude(승인 후) | 미완 | — |
| 2 | Vercel Pro 전환 | 사용자 | 미완 | — |
| 3 | 토스 가맹 계약·라이브 키·웹훅 비밀키 | 사용자 + Claude(env 반영) | 미완 | — |
| 4 | 이용약관·환불규정 실제 문구, 처리방침 정정, 보호책임자 성명 | 사용자(문안) + Claude(반영) | 미완 | — |
| 5 | `site_content` 설정 공개 읽기 차단(코드 수정안 2) | Claude | 미완 | — |
| 6 | 탈퇴·파기·동의 기록(코드 수정안 3·4) | Claude | 미완 | — |
| 7 | 속도 제한·로그 PII 제거·raw 축소(코드 수정안 5·6) | Claude | 미완 | — |
| 8 | Supabase Pro(백업)·Leaked Password·Auth 설정 확인 | 사용자 | 미완 | — |
| 9 | DPA 체결 + 업체 문의 답변 반영 | 사용자 | 미완 | — |
| 10 | Sentry·Resend 도입 여부 결정(도입 시 리전·보관 반영) | 사용자 | 미완 | — |
| — | RLS가 public 16개 테이블 전부 활성, anon 가시 회원 행 0 | — | **완료** | [운영] `pg_class.relrowsecurity` 전부 true, anon 역할로 `members` count 0 |
| — | service role 키가 브라우저에 노출되지 않음 | — | **완료** | [코드] `lib/supabase/admin.ts`만 사용, 클라이언트 import 없음; [운영] Vercel sensitive 타입 |
| — | 결제 금액·소유자·상태·중복 검증 | — | **완료** | [코드] confirm.ts/route; [운영] CI `lint · typecheck · test · build` 성공(커밋 10bcd80, Vitest 47개) |
| — | 회원·관리자·API 응답이 CDN에 캐시되지 않음 | — | **완료** | [로컬 재현] 가짜 세션 시 `private, no-store`, 보호 경로 307, API 캐시 헤더 없음 |
| — | 운영 배포 = 조사 커밋 7f998e2, 환경변수 동일 | — | **완료** | [운영] alias→dpl_9vYx…, env updatedAt < deployment createdAt |
| — | Resend·Sentry 운영 미작동 | — | **완료(운영 URL 직접 확인만 사용자 몫)** | [운영] env 없음 + [로컬 재현] 외부 요청 0건 |
| — | 로그인 보안 기록 30일·접속 기록 1년 자동 삭제 | — | **완료** | [운영] `cron.job` `purge-expired-logs` active |
| — | 처리방침이 DB와 코드 기본값 모두 실제 문구(17개 항목) | — | 완료(내용 정정은 4번) | [운영] `legal.privacy` sections 17, placeholder false |
