/** 휴대폰 번호를 010-XXXX-XXXX 형태로 정규화한다. 형식이 아니면 null. */
export function normalizePhone(input: string): string | null {
  const digits = input.replace(/\D/g, "");
  if (!/^01[016789]\d{7,8}$/.test(digits)) return null;
  const head = digits.slice(0, 3);
  const rest = digits.slice(3);
  const mid = rest.length === 8 ? rest.slice(0, 4) : rest.slice(0, 3);
  const tail = rest.slice(mid.length);
  return `${head}-${mid}-${tail}`;
}

/**
 * 입력 중인 휴대폰 번호를 숫자만 남기고 010-0000-0000 꼴로 자동 하이픈. 11자리까지만 받는다.
 * (10자리 옛 번호 011-000-0000 도 3-3-4 로 표시)
 */
export function formatPhoneInput(input: string): string {
  const d = input.replace(/\D/g, "").slice(0, 11);
  if (d.length <= 3) return d;
  if (d.length <= 7) return `${d.slice(0, 3)}-${d.slice(3)}`;
  if (d.length <= 10) return `${d.slice(0, 3)}-${d.slice(3, 6)}-${d.slice(6)}`;
  return `${d.slice(0, 3)}-${d.slice(3, 7)}-${d.slice(7)}`;
}
