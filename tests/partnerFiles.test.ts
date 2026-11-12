import { describe, expect, it } from "vitest";
import { PARTNER_FILE_MAX_BYTES, fileProblem, isUploadPath, safeFileName, uploadPathFor } from "@/lib/partner/files";

/** 제휴문의 첨부 규칙: 확장자 허용 목록 · 크기 10MB · 경로 형식 · 파일명 정리 */
describe("제휴문의 첨부 파일 규칙", () => {
  it("pdf·hwp·word·excel·ppt·이미지만, 10MB 이하만 허용", () => {
    for (const n of ["a.pdf", "제안서.HWP", "b.hwpx", "c.docx", "d.xlsx", "e.pptx", "f.jpg", "g.png"]) expect(fileProblem(n, 1024)).toBeNull();
    for (const n of ["x.exe", "x.zip", "x.js", "x", "x.html"]) expect(fileProblem(n, 1024)).not.toBeNull();
    expect(fileProblem("a.pdf", 0)).not.toBeNull();
    expect(fileProblem("a.pdf", PARTNER_FILE_MAX_BYTES + 1)).not.toBeNull();
    expect(PARTNER_FILE_MAX_BYTES).toBe(10 * 1024 * 1024);
  });
  it("저장 파일명은 경로·제어 문자를 빼고 한글은 유지, 경로는 inbox/<uuid>/file.<확장자>", () => {
    expect(safeFileName("../../evil<>.pdf")).toBe("evil.pdf");
    expect(safeFileName("C:\\\\docs\\\\제안서 v2.hwp")).toBe("제안서 v2.hwp");
    const p = uploadPathFor("제안서.pdf");
    expect(p).toMatch(/^inbox\/[0-9a-f-]{36}\/file\.pdf$/); // 저장소 키는 영문·숫자만 (한글 파일명은 name 에만)
    expect(isUploadPath(p)).toBe(true);
    expect(isUploadPath("inbox/not-a-uuid/file.pdf")).toBe(false);
    expect(isUploadPath("other/00000000-0000-0000-0000-000000000000/file.pdf")).toBe(false);
    expect(isUploadPath("inbox/00000000-0000-0000-0000-000000000000/file.exe")).toBe(false);
    expect(isUploadPath("inbox/00000000-0000-0000-0000-000000000000/제안서.pdf")).toBe(false);
  });
});
