import { describe, expect, it } from "vitest";
import { channelTalkHidden, isChannelTalkKey } from "@/lib/settings/channelTalk";

/** 채널톡 버튼 설정 (가상 값) */
describe("채널톡 플러그인 키·노출 경로", () => {
  it("UUID 꼴 키만 받는다", () => {
    expect(isChannelTalkKey("f142dd95-00e0-471e-94fc-fd7baf35f537")).toBe(true);
    expect(isChannelTalkKey(" F142DD95-00E0-471E-94FC-FD7BAF35F537 ")).toBe(true);
    expect(isChannelTalkKey("")).toBe(false);
    expect(isChannelTalkKey("abc")).toBe(false);
    expect(isChannelTalkKey("<script>")).toBe(false);
    expect(isChannelTalkKey(null)).toBe(false);
  });
  it("공개 페이지에만 싣고 어드민·로그인·설문·결제는 뺀다", () => {
    for (const p of ["/", "/social", "/matching", "/fit-check", "/news/abc", "/benefits"]) expect(channelTalkHidden(p)).toBe(false);
    for (const p of ["/admin", "/admin/site", "/login", "/api/inquiries", "/apply/xyz", "/admin-invite/t", "/auth/callback", "/checkout/1", null]) expect(channelTalkHidden(p)).toBe(true);
    expect(channelTalkHidden("/applying")).toBe(false);
  });
});
