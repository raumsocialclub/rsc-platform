// 클라이언트·서버 공용 (환경변수 접근 없음)
/** 토스 오류 코드 → 회원에게 보여줄 문구 */
export function describeTossError(code: string, fallback: string): string {
  const map: Record<string, string> = {
    ALREADY_PROCESSED_PAYMENT: "이미 처리된 결제입니다.",
    PROVIDER_ERROR: "결제사 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.",
    EXCEED_MAX_CARD_INSTALLMENT_PLAN: "할부 개월 수를 확인해 주세요.",
    INVALID_REQUEST: "잘못된 요청입니다.",
    NOT_ALLOWED_POINT_USE: "포인트 사용이 허용되지 않는 결제입니다.",
    INVALID_API_KEY: "결제 설정(API 키)을 확인해 주세요.",
    INVALID_REJECT_CARD: "카드사에서 승인이 거절되었습니다.",
    BELOW_MINIMUM_AMOUNT: "최소 결제 금액 미만입니다.",
    INVALID_CARD_EXPIRATION: "카드 유효기간을 확인해 주세요.",
    INVALID_STOPPED_CARD: "정지된 카드입니다.",
    EXCEED_MAX_DAILY_PAYMENT_COUNT: "하루 결제 가능 횟수를 초과했습니다.",
    NOT_SUPPORTED_INSTALLMENT_PLAN_CARD_OR_MERCHANT: "할부가 지원되지 않는 카드입니다.",
    INVALID_CARD_INSTALLMENT_PLAN: "할부 정보를 확인해 주세요.",
    NOT_FOUND_PAYMENT: "결제 정보를 찾을 수 없습니다.",
    NOT_FOUND_PAYMENT_SESSION: "결제 시간이 만료되었습니다. 다시 시도해 주세요.",
    FORBIDDEN_REQUEST: "허용되지 않은 요청입니다.",
    REJECT_CARD_PAYMENT: "카드 결제가 거절되었습니다.",
    PAY_PROCESS_CANCELED: "결제를 취소하셨습니다.",
    PAY_PROCESS_ABORTED: "결제가 중단되었습니다.",
    USER_CANCEL: "결제를 취소하셨습니다.",
  };
  return map[code] ?? fallback;
}
