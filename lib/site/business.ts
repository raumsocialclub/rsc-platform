/**
 * 사업자 정보 (전자상거래법·통신판매 표시 항목). 값은 CMS global.brand 의 biz* 필드.
 * 정식 상호(bizName)가 비어 있으면 아무것도 표시하지 않는다 — 확인되지 않은 값을 사이트에 내보내지 않기 위해.
 * 푸터 하단 줄과 약관·개인정보처리방침 상단 "사업자 정보" 표에서 같은 목록을 쓴다.
 */
export type BusinessItem = { label: string; value: string };

const clean = (v: unknown): string => (typeof v === "string" ? v.replace(/\s*\n\s*/g, " ").trim() : "");

export function businessInfo(brand: Record<string, unknown>): BusinessItem[] {
  const name = clean(brand.bizName);
  if (!name) return [];
  const items: BusinessItem[] = [{ label: "상호", value: name }];
  const rep = clean(brand.bizRep);
  if (rep) items.push({ label: "대표자", value: rep });
  const num = clean(brand.bizNumber);
  if (num) items.push({ label: "사업자등록번호", value: num });
  const mail = clean(brand.bizMailOrder);
  if (mail) items.push({ label: "통신판매업 신고번호", value: mail });
  const addr = clean(brand.bizAddress) || clean(brand.address);
  if (addr) items.push({ label: "주소", value: addr });
  return items;
}

/** 푸터용 한 줄: "상호 X · 대표자 Y · 사업자등록번호 Z …" */
export function businessLine(brand: Record<string, unknown>): string {
  return businessInfo(brand).map((i) => `${i.label} ${i.value}`).join(" · ");
}
