/**
 * 1:1 매칭 사전등록 모드 (settings.site.matchPreview, 기본 켬 — 2026-11-20 정책 변경).
 * 1:1 매칭 서비스는 당분간 안내하지 않고 "사전등록"만 받는다.
 * - /matching: 상세 페이지(소개·심사·플랜·비교·FAQ) 대신 간단 소개 + 「사전등록하기」 버튼만 (문구는 CMS matching.preview)
 * - 사전등록하기 → /match-check?src=prereg (3분 프로필 설문). src 로 어드민에 「1:1 매칭 사전등록하기 버튼」 경로가 남는다
 * - 홈 게이트·비교 카드·CTA 띠·소셜 멤버십·제휴·fit-check 관심 방식·llms.txt 에서 1:1 매칭 상세 문구를 숨긴다
 * - 끄면(/admin/settings → 사이트 상태) 모든 화면·문구가 예전 그대로 복원된다. 코드·CMS 문서는 지우지 않는다.
 */
export const PREREG_SRC = "prereg";
export const PREREG_HREF = `/match-check?src=${PREREG_SRC}`;

/** 1:1 매칭 상세(플랜명·가입비·/matching 세부)를 언급하는 문구인지 */
export const mentionsMatching = (text: string) => /1\s*:\s*1|RAUM\s*(CLASSIC|SIGNATURE|PRIV)|\/matching\b/i.test(text ?? "");

/**
 * 문장 속의 「…(과|와) 1:1 매칭 …」 짝을 지운다. 제휴 페이지처럼 소셜클럽과 1:1 매칭을 나란히 적은 문구용.
 * 예) "소셜클럽 멤버십과 1:1 매칭 상담을 제공합니다" → "소셜클럽 멤버십 상담을 제공합니다"
 *     "소셜클럽과 1:1 매칭 가입이 궁금하시면" → "소셜클럽 가입이 궁금하시면"
 */
export function stripMatching(text: string): string {
  if (!text) return text ?? "";
  return text
    .replace(/\s*(과|와|및|·|,)\s*1\s*:\s*1\s*매칭(\s*(멤버십|상담|가입|서비스|회원))?/g, (_m, _j, _s, noun) => (noun ? ` ${noun}` : ""))
    .replace(/1\s*:\s*1\s*매칭(과|와|및|·|,)\s*/g, "")
    .replace(/\s{2,}/g, " ")
    .trim();
}

/**
 * 문단에서 1:1 매칭을 말하는 문장·절만 지운다 (줄 단위 → 문장 단위).
 * - 「…(과|와) 1:1 매칭 …」 짝은 stripMatching 으로 지우고, 그래도 남으면 문장을 통째로 뺀다.
 * - 「…하지 않으며, 원할 때 연회비만 더해 1:1 매칭으로 전환합니다.」처럼 쉼표 뒤 절에만 있으면 앞 절만 남기고 「…않습니다.」로 맺는다.
 * 예) "결혼중개가 아닌 커뮤니티. 원하면 연회비만 더해 1:1 매칭으로 전환" → "결혼중개가 아닌 커뮤니티."
 */
export function stripMatchingText(text: string): string {
  if (!text || !mentionsMatching(text)) return text ?? "";
  return text
    .split("\n")
    .map((line) => {
      if (!mentionsMatching(line)) return line;
      const sentences = line.split(/(?<=[.!?])\s+/);
      const kept = sentences
        .map((sent) => {
          if (!mentionsMatching(sent)) return sent;
          const a = stripMatching(sent);
          if (!mentionsMatching(a)) return a;
          const cut = a.search(/,\s*[^,]*1\s*:\s*1[^,]*$/);
          if (cut > 0) {
            const head = a.slice(0, cut).trim();
            if (/않으며$/.test(head)) return head.replace(/않으며$/, "않습니다.");
            if (/이며$/.test(head)) return head.replace(/이며$/, "입니다.");
            if (/[.!?]$/.test(head)) return head;
            return `${head}.`;
          }
          return "";
        })
        .filter(Boolean);
      return kept.join(" ").trim();
    })
    .filter((line, i, arr) => line || (arr.length === 1 ? true : false))
    .join("\n");
}

/** CMS 문서의 문자열 필드·목록 항목 전부에 stripMatchingText 를 적용한 복사본. 모드가 꺼져 있으면(on=false) 원본 그대로 */
export function scrubDoc<T extends Record<string, unknown>>(doc: T, on = true): T {
  if (!on) return doc;
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(doc)) {
    if (typeof v === "string") out[k] = stripMatchingText(v);
    else if (Array.isArray(v)) out[k] = v.filter((it) => !(it && typeof it === "object" && mentionsMatching(Object.values(it as Record<string, unknown>).filter((x) => typeof x === "string").join(" ")) && !stripMatchingText(Object.values(it as Record<string, unknown>).filter((x) => typeof x === "string").join(" ")).trim())).map((it) => (it && typeof it === "object" ? scrubDoc(it as Record<string, unknown>) : it));
    else out[k] = v;
  }
  return out as T;
}

/** 「 · 」로 이어진 요약 문장에서 1:1 매칭 관련 조각만 뺀다 (llms.txt 용) */
export function dropMatchingSegments(line: string): string {
  const [head, ...rest] = line.split(": ");
  const body = rest.join(": ");
  if (!body || mentionsMatching(head)) return mentionsMatching(line) ? "" : line;
  const segs = body.split(" · ").filter((s) => !mentionsMatching(s));
  return segs.length ? `${head}: ${segs.join(" · ")}` : "";
}

/**
 * llms.txt 본문(seo.ai.llmsText)에서 1:1 매칭 상세를 뺀다.
 * "- 항목: a · b · c" 줄은 매칭 조각만 빼고, 소개 문단의 「…과 1:1 매칭(/matching: …)」 짝은 지운 뒤
 * 「## 핵심 사실」 아래에 사전등록 안내 한 줄을 넣는다. 모드를 끄면 원문 그대로.
 */
export function llmsPreview(text: string): string {
  const out: string[] = [];
  for (const raw of text.split("\n")) {
    let line = raw;
    if (/^\s*-\s/.test(line)) line = dropMatchingSegments(line);
    else if (mentionsMatching(line)) {
      line = line
        .replace(/\s*(과|와|및)\s*1\s*:\s*1\s*매칭\([^)]*\)/g, "")
        .replace(/두 가지 방식으로 만납니다\s*[—–-]\s*/, "")
        .replace(/\s*(과|와|및)\s*1\s*:\s*1\s*매칭/g, "");
      if (mentionsMatching(line)) line = "";
    }
    if (line || !raw) out.push(line);
    if (/^##\s*핵심 사실/.test(raw)) out.push("- 1:1 매칭: 정식 오픈 전이라 사전등록(/matching → /match-check 프로필 설문)만 받습니다. 플랜·가입비는 오픈 때 안내");
  }
  return out.join("\n").replace(/\n{3,}/g, "\n\n");
}
