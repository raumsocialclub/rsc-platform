/** Supabase Auth 오류를 사용자 문구로 바꾼다. 알 수 없는 오류는 원문을 붙여 원인 파악을 돕는다. */
export function describeAuthError(raw: string, context: "signup" | "login"): string {
  const m = raw.toLowerCase();
  if (m === "config_missing") return "서비스 설정 오류입니다(Supabase 주소/키 누락). 운영자에게 문의해 주세요.";
  if (m.includes("failed to fetch") || m.includes("network") || m.includes("load failed")) return "네트워크 연결이 불안정합니다. 잠시 후 다시 시도해 주세요.";
  if (m.includes("already registered") || m.includes("already been registered") || m.includes("user already exists")) return "이미 가입된 이메일입니다. 로그인해 주세요.";
  if (m.includes("signups not allowed") || m.includes("signup is disabled")) return "현재 신규 가입이 비활성화되어 있습니다. 운영자에게 문의해 주세요.";
  if (m.includes("rate limit") || m.includes("too many requests")) return "요청이 너무 많습니다. 잠시 후 다시 시도해 주세요.";
  if (m.includes("error sending confirmation") || m.includes("error sending") ) return "이메일 인증 설정이 켜져 있어 인증 메일 발송에 실패했습니다. 운영자가 Supabase에서 'Confirm email'을 꺼야 합니다.";
  if (m.includes("email not confirmed")) return "이메일 인증이 완료되지 않은 계정입니다. 운영자에게 문의해 주세요.";
  if (m.includes("invalid login credentials") || m.includes("invalid credentials")) return "이메일 또는 비밀번호가 올바르지 않습니다.";
  if (m.includes("invalid email") || m.includes("unable to validate email")) return "이메일 형식을 확인해 주세요.";
  if (m.includes("password should be") || m.includes("weak password") || m.includes("password is too short")) return "비밀번호는 8자 이상이어야 합니다.";
  if (m.includes("invite_required")) return "초대코드가 없어 가입할 수 없습니다. 초대코드 입력 화면으로 돌아가 주세요.";
  if (m.includes("invite_invalid")) return "초대코드가 이미 사용되었거나 만료되었습니다. 상담 담당자에게 확인해주세요.";
  if (m.includes("database error")) return "회원 정보를 저장하지 못했습니다(초대코드 검증 실패 가능). 상담 담당자에게 확인해주세요.";
  const base = context === "signup" ? "가입을 완료하지 못했습니다." : "로그인하지 못했습니다.";
  return `${base} (오류: ${raw})`;
}

/** /api/invites/verify 의 reason → 문구 */
export function describeInviteReason(reason: string | undefined): string {
  switch (reason) {
    case "USED": return "이미 사용된 초대코드입니다. 상담 담당자에게 새 코드를 요청해 주세요.";
    case "EXPIRED": return "만료된 초대코드입니다(발급 후 30일). 상담 담당자에게 새 코드를 요청해 주세요.";
    case "NOT_FOUND": return "존재하지 않는 초대코드입니다. 코드를 다시 확인해 주세요.";
    case "FORMAT": return "초대코드 형식이 올바르지 않습니다. RSC-XXXX-XXXX 형태로 입력해 주세요.";
    case "SERVER": return "초대코드 확인 중 서버 오류가 났습니다. 잠시 후 다시 시도해 주세요.";
    default: return "유효하지 않은 코드입니다. 상담 담당자에게 확인해주세요.";
  }
}
