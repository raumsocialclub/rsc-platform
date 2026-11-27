/**
 * 채널톡(ChannelTalk) 버튼 — 일반 설정 → 「상담 신청 · 광고 측정」 → 채널톡 플러그인 키.
 * 플러그인 키는 채널톡 데스크 → 설정 → 채널톡 버튼 설치 → Plugin Key (UUID 꼴). 공개 HTML 에 실리는 값이라 비밀이 아니다. Access Secret 은 쓰지 않는다.
 */
export const CHANNEL_TALK_SDK = "https://cdn.channel.io/plugin/ch-plugin-web.js";
const KEY_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
/** 플러그인 키 형식 검사 (UUID). 틀리면 버튼을 싣지 않는다 */
export const isChannelTalkKey = (v: unknown): v is string => typeof v === "string" && KEY_RE.test(v.trim());
/** 버튼을 싣지 않는 경로: 어드민·로그인·API·상담 전 설문(설문 화면은 채팅 버튼이 양식을 가림) */
export const channelTalkHidden = (pathname: string | null): boolean => !pathname || /^\/(admin|login|api|apply|admin-invite|auth|checkout)(\/|$)/.test(pathname);
