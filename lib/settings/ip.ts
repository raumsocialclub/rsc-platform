/** IP 목록 매칭 (proxy 와 서버 공용, 외부 의존 없음). 지원: 정확 일치, 접두 와일드카드 1.2.3.*, IPv4 CIDR 1.2.3.0/24 */
export function parseList(v: unknown): string[] {
  return String(v ?? "").split(/[\n,]/).map((s) => s.trim()).filter(Boolean);
}
function ip4(ip: string): number | null {
  const m = ip.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (!m) return null;
  const p = m.slice(1).map(Number);
  if (p.some((x) => x > 255)) return null;
  return ((p[0] << 24) | (p[1] << 16) | (p[2] << 8) | p[3]) >>> 0;
}
export function ipMatches(ip: string, rules: string[]): boolean {
  const target = ip.trim();
  if (!target) return false;
  for (const r of rules) {
    if (r === target) return true;
    if (r.endsWith("*") && target.startsWith(r.slice(0, -1))) return true;
    const cidr = r.match(/^(.+)\/(\d{1,2})$/);
    if (cidr) {
      const base = ip4(cidr[1]), t = ip4(target), bits = Number(cidr[2]);
      if (base != null && t != null && bits >= 0 && bits <= 32) {
        const mask = bits === 0 ? 0 : (~0 << (32 - bits)) >>> 0;
        if ((base & mask) === (t & mask)) return true;
      }
    }
  }
  return false;
}
/** 요청에서 클라이언트 IP */
export function clientIp(headers: { get(name: string): string | null }): string {
  const xff = headers.get("x-forwarded-for") ?? headers.get("x-vercel-forwarded-for") ?? "";
  const first = xff.split(",")[0]?.trim();
  return first || headers.get("x-real-ip") || "";
}
