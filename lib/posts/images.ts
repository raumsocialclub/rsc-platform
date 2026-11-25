/**
 * 소식 본문 사진 — 업로드 전 크기 계산 (클라이언트·테스트 공용, DOM 의존 없음).
 *
 * 디자이너가 상세 페이지를 ① 통으로 긴 한 장 ② 일정 크기로 자른 여러 장, 어느 쪽으로 넘겨도 되게:
 * - 가로는 MAX_W 로만 맞춘다(본문 폭 760px 의 2배 ≈ 레티나 선명도). 세로는 가로 비율에 따라 그대로.
 * - 한 장이 SLICE_H 보다 길면 같은 높이의 조각으로 잘라 차례로 올린다 → 본문에는 조각 수만큼 사진 줄이 들어가고,
 *   공개 화면(components/Markdown.tsx)은 연속된 사진 줄을 틈 없이 이어 붙여 한 장처럼 보여 준다.
 */
export const MAX_W = 1600;
/** 조각 하나의 최대 세로(px, 축소 후 기준). 캔버스 한도(iOS 약 1,670만 px) 안에서 넉넉하게 */
export const SLICE_H = 4000;
/** 파일 이름 순서(01, 02, … 자연 정렬)로 올려서 본문에 넣을 때 쓰는 비교 함수 */
export const byName = (a: { name: string }, b: { name: string }) => a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: "base" });

export type SlicePlan = {
  /** 축소 배율(1 이면 그대로) */
  scale: number;
  /** 축소 후 전체 크기 */
  width: number;
  height: number;
  /** 원본 좌표 기준 조각(sy, sh)과 축소 후 조각 높이(dh). 순서대로 위에서 아래 */
  slices: { sy: number; sh: number; dh: number }[];
};

export function planSlices(srcW: number, srcH: number, maxW = MAX_W, sliceH = SLICE_H): SlicePlan {
  const scale = Math.min(1, maxW / Math.max(1, srcW));
  const width = Math.max(1, Math.round(srcW * scale));
  const height = Math.max(1, Math.round(srcH * scale));
  const n = Math.max(1, Math.ceil(height / sliceH));
  const slices: SlicePlan["slices"] = [];
  let doneD = 0;
  let doneS = 0;
  for (let i = 0; i < n; i++) {
    const dh = i === n - 1 ? height - doneD : Math.round(height / n);
    const sh = i === n - 1 ? srcH - doneS : Math.round(dh / scale);
    slices.push({ sy: doneS, sh, dh });
    doneD += dh;
    doneS += sh;
  }
  return { scale, width, height, slices };
}

/** 본문에 넣는 사진 줄. 설명(alt)은 비워 두어 공개 화면에 캡션이 생기지 않게 한다(필요하면 대괄호 안에 적는다) */
export const imageLine = (url: string) => `![](${url})`;
