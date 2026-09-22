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
