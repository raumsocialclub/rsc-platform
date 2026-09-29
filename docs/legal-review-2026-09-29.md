# 이용약관·개인정보처리방침 확정 작업 기록 (2026-09-29) — 내부 확인용

업로드된 작업 요청 두 건(개인정보 처리 점검·방침 확정, 이용약관 수정)에 따라 실제 코드·운영 설정과 대조해 `lib/legal/content.ts` 의 이용약관·개인정보처리방침을 다시 썼다.
공개 화면에는 미확정 메모를 넣지 않았다. 아직 확인되지 않은 항목은 아래 "운영자 확인 필요"에 모았고, 그 항목이 확정되기 전에는 운영 배포를 하지 않는다.

## 1. 검증 결과 (확인 완료 / 코드 수정 완료 / 운영자 확인 필요)

| 항목 | 결과 | 근거 |
| --- | --- | --- |
| 상담 신청 필수·선택 | 확인 완료: 이름·휴대폰 필수, 상담 가능 시간 선택(비워도 제출됨) | `components/fit-check/LeadForm.tsx` `canSubmit`, `tests/inquiries.test.ts` "상담 가능 시간을 비워도 접수된다" |
| 동의 기본 체크 없음 · 서버 검증 | 확인 완료 | `LeadForm` `useState(false)`, `app/api/inquiries/route.ts` `consent: z.literal(true)` (400) |
| 동의 일시·동의문 버전 기록 | 코드 수정 완료: 서버가 `consentAt` + `consentVersion`(= `PRIVACY_CONSENT_VERSION` "2026-10-01") 기록. 클라이언트 값은 무시. 기존 신청에는 소급 기록하지 않음 | `route.ts`, `lib/legal/content.ts`, 테스트 2건 |
| 설문형 상담(설문 원본 미저장) | 확인 완료: 기본 꺼짐(`settings.inquiry.surveyMode` 행 없음). 켜면 결과 유형·경로만 저장, `picks/answers` 는 zod 가 버림 | `route.ts` BodySchema, 테스트 "설문형 신청" |
| 방문자 식별값(rsc_vid)과 상담 정보 연결 | 확인 완료: 연결 없음. `inquiries` 에 방문자 id 컬럼·쿠키 읽기 없음 | `app/api/inquiries/route.ts`(cookies 미사용), `app/api/track/route.ts` 만 `rsc_vid` 사용 |
| UTM 저장 위치·기간 | 확인 완료: localStorage `rsc_utm`, 30일 | `lib/utm/client.ts` |
| 상담 180일 자동 삭제 | 확인 완료(등록·활성). 첫 실행은 등록 다음 날 03:23 UTC — 2026-09-29 기준 아직 실행 이력 없음 | `cron.job` `purge-expired-inquiries` active=true, `job_run_details` 없음 |
| 방문 기록 1년 · 로그인 실패 30일 삭제 | 확인 완료(등록·활성·오늘 성공 실행) | `cron.job` `purge-expired-logs`, 2026-09-29 03:17 succeeded |
| 상담 메모가 상담 정보와 함께 삭제되는지 | 확인 완료: 메모는 `inquiries.memo` 컬럼 → 행 삭제와 함께 삭제 | `SCHEMA.sql` |
| 관리자 활동 기록 범위·보관 | 확인 완료: 프로그램·게시글·설정·관리자 권한 변경 기록(개인정보 열람 기록은 남기지 않음). 삭제 작업 없음(무기한) → 방침은 "1년 이상 보관 후 파기"로 기재. 상한은 운영자 결정 필요 | `lib/admin/log.ts` 호출부, `admin_logs` 19행 |
| RLS | 확인 완료: inquiries·page_views·login_attempts·admin_logs·members·admin_invites·site_content 모두 활성 | `pg_tables.rowsecurity` |
| service_role 키 브라우저 노출 | 확인 완료: 서버 전용(`lib/supabase/admin.ts`), `NEXT_PUBLIC_` 아님 | 코드 |
| Supabase 리전 | 확인 완료: `ap-northeast-2`(서울) | `get_project` |
| Vercel 함수 리전 | 확인 완료: `icn1`(서울). CDN·엣지 캐시 위치는 별개 | `vercel.json` |
| Sentry 실제 사용 | 확인 완료: 운영에 DSN 없음 → 비활성. 방침에서 수탁업체에서 제외 | 운영 `/api/health` `sentryDsn:false` |
| Resend 실제 사용 | 확인 완료: 운영에 `RESEND_API_KEY` 없음 → 메일 발송 안 됨. 수탁업체에서 제외 | `/api/health` `resendApiKey:false` |
| Meta 픽셀 | 확인 완료: 미사용(`metaPixelId` 없음, 운영 HTML 에 `fbevents` 0건). 방침 제8조 "현재 사용하지 않음" | DB, 운영 HTML 검사 |
| 카카오·네이버 로그인 | 확인 완료: 운영 키 없음, 리드 모드로 화면 닫힘 | `/api/health` |
| 광고성 정보 발송 | 확인 완료: 발송 기능·동의 항목 없음 | 코드 |
| CSV 내보내기 | 확인 완료: 주문·통계 CSV 는 예약·결제 데이터용(리드 모드에서 데이터 없음). 상담 신청 CSV 없음 | `app/api/admin/*/export` |
| 백업 | 운영자 확인 필요: Supabase 요금제별 자동 백업 여부·보관 주기. 방침에는 원칙만 기재 | Supabase 대시보드 → Settings → Database → Backups |
| 국외 이전 | 운영자/법률 확인 필요: 저장·실행은 서울 리전. Supabase·Vercel 이 미국 법인이라는 이유만으로 "미국 이전"으로 기재하지 않음. 계약 자료(DPA)로 국외 접근·처리 여부·근거 확인 필요 | 방침 제9조 |
| 관리자 세션 만료 | 운영자 확인 필요(기본값 사용 중). 방침은 "로그아웃 또는 세션 만료 시 삭제"로만 기재 | Supabase → Authentication → Sessions |
| 접속기록 법정 보존 | 법률 검토 필요: 개인정보의 안전성 확보조치 기준상 접속기록 1년 이상(사유별 2년). 방침 "1년 이상" | — |
| 처리 근거(제15조 1항 각 호) | 법률 검토 필요: 상담 = 동의, 통계·광고 유입·보안 = 정당한 이익(제6호), 관리자 = 계약 이행(제4호)으로 기재 | 방침 제2조 |

## 2. 변경 요약

- `lib/legal/content.ts`
  - 이용약관 12개 조 + 부칙 재작성(요청 조항별 기준 반영). 2영업일 연락 확약 삭제 → 순차 연락. 취소 요청 절차 추가. 삭제 기준을 보류·제한 + 사유·이의제기 안내로 수정. 금지행위 구체화(재신청·보조기술 예외). 면책을 "책임 있는 사유 없는 범위"로 한정. 회원제·유료 계약은 별도 조건 + 사전 안내. 전속관할 없음. 부칙에 공고일·시행일 구분(최초 제정).
  - 개인정보처리방침 15개 조 + 부칙 재작성. 처리 근거 병기, 통신비밀보호법 3개월 문구 삭제, 관리자 계정 3년 문구 삭제(계정/기록 분리), 쿠키 만료와 서버 보관 구분, 문의 기록 1년과 상담 메모 180일 연결, 수탁업체를 실제 사용 중인 Supabase·Vercel 로 한정, 제3자 제공 "해당 없음", Meta 미사용 명시, 권리행사 "즉시" 확약 제거, 별도 동의 필요 변경은 방침 공개로 갈음하지 않음.
  - `PRIVACY_CONSENT_VERSION` 상수 추가.
- `app/api/inquiries/route.ts`: `answers.consentVersion` 서버 기록.
- `components/fit-check/LeadForm.tsx`: 동의 안내를 항목(필수/선택)·목적·기간·거부 효과로 정리, 처리방침 링크와 이용약관 링크 분리(약관 동의 강제 없음), 완료 문구에서 2영업일 삭제·취소 연락처 안내, "신청은 회원 가입이 아님" 문구.
- `components/fit-check/FitCheck.tsx`(설문형): 동의 문구 방침과 일치, 완료 문구 동일.
- `components/admin/InquiryDetail.tsx`: 동의 버전 표시.
- `tests/inquiries.test.ts`: 동의 버전 기록·클라이언트 값 무시·선택 항목 공백 테스트 추가(총 62개).

서비스 동작 영향: 상담 신청 흐름은 동일(필수 2개 + 동의). 저장 항목에 `consentVersion` 1개 추가. 화면 문구만 변경.

## 3. 운영자 확인 필요 (배포 전)

1. 운영 사업자의 정식 상호(법인명·개인사업자명)와 사업자등록번호. 약관 제1조·방침 서문·푸터에 넣을 값. 현재는 "라움소셜클럽"으로만 표기.
2. 국외 이전: Supabase·Vercel 의 DPA/서비스 약관에서 (가) 데이터가 서울 리전 밖에서 처리·조회되는지, (나) 있다면 국가·항목·근거. 확인되면 제9조를 확정 문구로 교체.
3. Supabase 백업: 요금제, 자동 백업 여부, 보관 일수(대시보드 Settings → Database → Backups).
4. 상담 연락 기준: 순차 연락(현재 문구) 유지인지, "영업일 2일 이내"를 확약할지. 확약 시 토·일·공휴일 제외 여부와 지연 안내 절차.
5. 관리자 활동 기록 보관 상한(예: 3년) 결정 → 결정되면 방침 제4조 7호와 삭제 작업 추가.
6. 문의 이메일함(theraumai@gmail.com)의 문의 기록 1년 삭제를 실제로 운영할 방법(수동 정리 주기).
7. 시행일 2026-10-01 유지 여부. 공고일은 운영 배포일로 맞춘다(현재 문구 2026-09-29).
8. 처리 근거·법정 보존 기간(위 표의 "법률 검토 필요")을 법률 자문으로 확인.

## 4. 배포 상태

- 브랜치·스테이징에만 반영. 운영 배포는 하지 않았다. DB 의 `legal.privacy` 저장본도 갱신하지 않았다(배포 시 코드 기본값으로 교체).
- 고객 데이터 삭제·변경 없음.
