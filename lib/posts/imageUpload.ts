/** 소식 사진 업로드 전 처리 — 브라우저 전용(canvas·createImageBitmap). 크기 계산은 lib/posts/images.ts */
import { planSlices } from "./images";

export function toBlob(c: HTMLCanvasElement): Promise<Blob> {
  // WEBP(글자가 많은 디자인 시안도 선명·가벼움). 지원하지 않는 브라우저는 PNG 로 돌려주므로 그때는 JPEG 로 한 번 더
  return new Promise((res, rej) => c.toBlob((b) => {
    if (b && b.type === "image/webp") return res(b);
    c.toBlob((j) => (j ? res(j) : rej(new Error("변환 실패"))), "image/jpeg", 0.9);
  }, "image/webp", 0.9));
}

/**
 * 업로드 전 브라우저에서 가로 MAX_W 로 줄이고, 세로로 긴 사진은 조각으로 나눈다(lib/posts/images.ts 계산).
 * 대표 사진처럼 한 장만 필요한 곳은 maxSlices=1 → 자르지 않고 가로만 맞춘다.
 * 브라우저가 사진을 못 읽는 경우(아주 큰 파일 등)에는 원본을 그대로 올린다(서버 10MB 제한은 그대로).
 */
export async function prepareImage(file: File, maxSlices = Infinity): Promise<Blob[]> {
  let bmp: ImageBitmap;
  try { bmp = await createImageBitmap(file); } catch { return [file]; }
  const plan = planSlices(bmp.width, bmp.height);
  const slices = maxSlices === 1 ? [{ sy: 0, sh: bmp.height, dh: plan.height }] : plan.slices;
  if (plan.scale === 1 && slices.length === 1 && file.type !== "image/png") { bmp.close(); return [file]; }
  const out: Blob[] = [];
  const c = document.createElement("canvas");
  for (const sl of slices) {
    c.width = plan.width;
    c.height = sl.dh;
    const ctx = c.getContext("2d")!;
    ctx.clearRect(0, 0, c.width, c.height);
    ctx.drawImage(bmp, 0, sl.sy, bmp.width, sl.sh, 0, 0, c.width, sl.dh);
    out.push(await toBlob(c));
  }
  bmp.close();
  return out;
}
