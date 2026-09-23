# MAINTENANCE.md — 월 1회 점검 루틴 (M13)

주관리자가 "이번 달 점검해" 라고 하면 Claude 는 이 문서의 순서대로 확인하고, 아래 **보고 양식**으로 결과를 정리한다.
사람이 직접 눌러야 하는 항목은 **[사용자]**, Claude 가 도구로 확인하는 항목은 **[Claude]** 로 표시한다.

## 0. 원칙
- 점검은 **읽기 전용**으로 시작한다. 고칠 것이 나오면 먼저 보고하고, 사용자가 "고쳐라" 라고 한 뒤에만 수정·배포한다.
- 운영 DB 의 데이터는 점검 중 절대 지우거나 바꾸지 않는다. 확인 쿼리는 `select` 만.
- 비밀값(키·토큰)은 채팅에 절대 적지 않는다. "등록됨/없음" 만 말한다.

## 1. 서비스 살아있는지 (5분)
- [Claude] `https://rsc-platform.vercel.app/api/health` 가 200 이고 `auth.reachable=true`, `env.*` 가 기대값(토스 키·서비스 롤 키·Sentry DSN 등록 여부)인지
- [Claude] 메인 `/`, `/pricing`, `/news`, `/login` 이 200 으로 열리고 `<title>` 이 정상인지, `/robots.txt` 가 현재 SEO 설정(검색 노출 on/off)과 일치하는지
- [Claude] Vercel 최신 production 배포가 READY 이고 커밋이 `main`(또는 합의한 브랜치) 최신과 같은지
- [Claude] Supabase 프로젝트 상태 `ACTIVE_HEALTHY`, pg_cron `expire-bookings` 가 최근 1시간 안에 실행됐는지 (`cron.job_run_details`)

## 2. 오류·알림 (10분)
- [사용자] Sentry → Issues 에서 지난 30일 새 이슈 개수와 가장 많이 난 3개를 캡처해 주기 (Claude 는 Sentry 를 직접 못 본다)
- [Claude] `admin_logs` 최근 30일: 환불(`order.refund`) 건수·사유, 관리자 권한 변경(`admin.*`) 이력이 사용자가 아는 것과 맞는지
- [Claude] `payments` 중 `status='paid'` 인데 `bookings.status` 가 `confirmed/attended/cancelled` 가 아닌 건(불일치) 0건인지
- [Claude] `bookings` 중 `pending` 인데 `expires_at` 이 1시간 넘게 지난 건 0건인지 (pg_cron 정상 여부)
- [Claude] 운영 알림 메일 설정(일반 설정 → 알림 → 운영 알림 받는 이메일) 값 확인, `RESEND_API_KEY` 등록 여부

## 3. 보안 (10분)
- [Claude] Supabase Security Advisor(`get_advisors security`) 새 항목이 있는지. 의도된 SECURITY DEFINER 경고 외 새 경고는 보고
- [Claude] `npm audit --omit=dev` 에서 high/critical 이 있는지. 있으면 영향 범위와 업데이트 계획 제안
- [Claude] `npm outdated` 로 `next`, `@supabase/*`, `@sentry/nextjs`, `@tosspayments/*` 의 메이저 업데이트 여부. 메이저는 바로 올리지 않고 별도 모듈로 제안
- [Claude] 관리자 계정 목록(`members` role in admin/owner): 모르는 계정·정지 해제 누락·90일 이상 미접속 계정
- [사용자] Vercel → Firewall 에서 지난 30일 차단·Challenge 건수 캡처, Attack Challenge Mode 가 꺼져 있는지
- [사용자] Supabase → Authentication → Users 에서 이상 가입(짧은 시간 다수 가입) 없는지

## 4. 백업·복구 가능성 (5분)
- [사용자] Supabase → Database → Backups 에 어제 날짜 백업이 있는지 (Pro 플랜 일일 백업)
- [Claude] `SCHEMA.sql` 이 실제 DB 테이블·함수와 어긋난 곳이 없는지 (`list_tables` 대조)
- [Claude] Storage 버킷 `programs`·`site` 용량, 공개 정책이 그대로인지

## 5. 비용·한도 (5분)
- [사용자] Vercel → Usage: 함수 호출·대역폭이 플랜 한도의 80% 를 넘는지
- [사용자] Supabase → Usage: DB 용량·MAU·Storage 가 한도의 80% 를 넘는지
- [사용자] Resend·Sentry 무료 한도(월 이메일 3,000통 / 이벤트 5,000건) 사용량
- [Claude] `page_views` 테이블 행 수. 100만 행 근처면 오래된 행 정리(아카이브) 제안

## 6. 콘텐츠·법무 (5분)
- [Claude] 약관 3종이 아직 자리 문구(`placeholder` 스위치)인지
- [Claude] 소식 게시판 최근 발행일, FAQ 마지막 수정일 (오래됐으면 갱신 제안)
- [사용자] 통신판매업 신고·PG 심사·사업자 정보 변경 사항 여부

## 7. 정리·보고
- 테스트가 여전히 통과하는지: [Claude] `npm run check` (린트·타입·테스트) 결과
- 배포 게이트가 살아있는지: [Claude] 최근 GitHub Actions `CI` 실행 결과가 초록인지

### 보고 양식 (Claude 가 채팅에 쓰는 형식)
```
[YYYY-MM 정기 점검]
정상: (항목 나열)
주의: (항목 + 왜 주의인지 한 줄)
조치 제안: (있으면. "고쳐라" 를 받기 전에는 실행하지 않음)
사용자 확인 필요: (Sentry·Vercel Usage·백업처럼 Claude 가 못 보는 것)
```

### 점검 기록
| 월 | 결과 요약 | 조치 |
|---|---|---|
| (첫 점검 후 Claude 가 여기에 한 줄씩 추가) | | |
