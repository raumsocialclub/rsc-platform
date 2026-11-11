import { beforeEach, describe, expect, it, vi } from "vitest";
import { fakeDb } from "./helpers/fakeDb";
import { PARTNER_CONSENT_VERSION } from "@/lib/partner/types";

/** 제휴문의 저장(/api/partner): 유형·회사·담당자·연락처·내용·동의 검증, 전화 정규화, 알림 메일은 실패해도 접수 성공 */
const db = fakeDb();
const notice = vi.fn().mockResolvedValue({ sent: false, reason: "NOT_CONFIGURED" });
vi.mock("@/lib/supabase/server", () => ({ createClient: async () => db.client }));
vi.mock("@/lib/supabase/admin", () => ({ hasServiceRoleKey: () => false, createAdminClient: () => db.client }));
vi.mock("@/lib/notify", () => ({ sendPartnerInquiryNotice: (p: unknown) => notice(p) }));
vi.mock("@/lib/cms/get", () => ({ getBrand: async () => ({ partnerEmail: "partner@example.com" }) }));
const verify = vi.fn();
vi.mock("@/lib/partner/files", async (orig) => ({ ...(await orig<typeof import("@/lib/partner/files")>()), verifyFiles: (...a: unknown[]) => verify(...a) }));

const post = (body: unknown) => new Request("https://test.example/api/partner", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
const base = { kind: "brand", company: "테스트 브랜드", name: "홍길동", phone: "01012345678", email: "Hong@Example.com", message: "와인 페어링 협업을 제안드립니다. 11월 중 진행 희망.", consent: true };

describe("제휴문의 POST /api/partner", () => {
  beforeEach(() => {
    db.calls.length = 0;
    db.tables.partner_inquiries = [];
    notice.mockClear();
    verify.mockReset();
  });
  it("첨부: 버킷에 있는 파일만 files 로 기록하고, 확인에 실패하면 400 · 4개 이상은 400", async () => {
    const { POST } = await import("@/app/api/partner/route");
    const files = [{ path: "inbox/00000000-0000-0000-0000-000000000000/제안서.pdf", name: "제안서.pdf", size: 1234 }];
    verify.mockResolvedValueOnce([{ ...files[0], size: 2000 }]);
    const ok = await POST(post({ ...base, files }));
    expect(ok.status).toBe(200);
    expect((db.calls[0].payload as { files: unknown[] }).files).toEqual([{ ...files[0], size: 2000 }]);
    expect((notice.mock.calls[0] as unknown[])[0]).toMatchObject({ files: [{ name: "제안서.pdf" }] });
    db.calls.length = 0;
    verify.mockResolvedValueOnce(null);
    expect((await POST(post({ ...base, files }))).status).toBe(400);
    expect((await POST(post({ ...base, files: [files[0], files[0], files[0], files[0]] }))).status).toBe(400);
    expect(db.calls).toHaveLength(0);
  });
  it("저장: 전화 하이픈 정규화 · 이메일 소문자 · 동의 시각과 버전 기록 · 담당 이메일로 알림", async () => {
    const { POST } = await import("@/app/api/partner/route");
    const res = await POST(post(base));
    expect(res.status).toBe(200);
    expect(db.calls).toHaveLength(1);
    expect(db.calls[0].table).toBe("partner_inquiries");
    const row = db.calls[0].payload as Record<string, string>;
    expect(row.kind).toBe("brand");
    expect(row.phone).toBe("010-1234-5678");
    expect(row.email).toBe("hong@example.com");
    expect(row.consent_version).toBe(PARTNER_CONSENT_VERSION);
    expect(row.consent_at).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    expect(row.status).toBeUndefined(); // DB 기본값 'new'
    expect((row as unknown as { files: unknown[] }).files).toEqual([]);
    expect(verify).not.toHaveBeenCalled();
    expect(notice).toHaveBeenCalledTimes(1);
    expect((notice.mock.calls[0] as unknown[])[0]).toMatchObject({ to: "partner@example.com", company: "테스트 브랜드" });
  });
  it("동의 없음 · 모르는 유형 · 짧은 내용 · 잘못된 이메일 · 봇 함정 채움은 400 이고 저장하지 않는다", async () => {
    const { POST } = await import("@/app/api/partner/route");
    for (const bad of [{ ...base, consent: false }, { ...base, kind: "press" }, { ...base, message: "짧음" }, { ...base, email: "nope" }, { ...base, website: "http://spam" }]) {
      const res = await POST(post(bad));
      expect(res.status).toBe(400);
    }
    expect(db.calls).toHaveLength(0);
  });
  it("전화 형식이 틀리면 400", async () => {
    const { POST } = await import("@/app/api/partner/route");
    const res = await POST(post({ ...base, phone: "12345" }));
    expect(res.status).toBe(400);
    expect(db.calls).toHaveLength(0);
  });
});
