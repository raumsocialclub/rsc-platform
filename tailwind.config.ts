import type { Config } from "tailwindcss";

/**
 * Design.md 토큰 (Wanted Design System 기준). 모든 화면은 이 값만 사용한다.
 * 이전 이름(cream·ink·brown·sand …)은 호환을 위해 남기되 새 팔레트를 가리킨다 — 어드민 화면이 그대로 동작하도록.
 * Tailwind v4에서는 app/globals.css의 `@config`로 이 파일을 불러온다.
 */
const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    screens: { sm: "640px", md: "761px", lg: "1024px" },
    extend: {
      colors: {
        // 테마(어드민에서 변경 가능)
        cream: "var(--c-cream)",
        card: "var(--c-cream)",
        paper: "var(--c-cream)",
        ink: "var(--c-ink)",
        brown: "var(--c-brown)",
        brownHover: "var(--c-brownHover)",
        gold: "var(--c-gold)",
        goldHover: "var(--c-goldHover)",
        sand: "var(--c-sand)",
        sandDeep: "var(--c-sandDeep)",
        sandActive: "var(--ds-line-solid-neutral)",
        sandHover: "var(--c-sand)",
        // 시맨틱 (DS)
        label: "var(--ds-label)",
        labelStrong: "var(--ds-label-strong)",
        labelNeutral: "var(--ds-label-neutral)",
        labelAlt: "var(--ds-label-alt)",
        labelAssist: "var(--ds-label-assist)",
        labelDisable: "var(--ds-label-disable)",
        primary: "var(--ds-primary)",
        primaryStrong: "var(--ds-primary-strong)",
        primaryHeavy: "var(--ds-primary-heavy)",
        line: "var(--ds-line)",
        lineNeutral: "var(--ds-line-neutral)",
        lineAlt: "var(--ds-line-alt)",
        lineSolid: "var(--ds-line-solid)",
        lineSolidNeutral: "var(--ds-line-solid-neutral)",
        lineSolidAlt: "var(--ds-line-solid-alt)",
        fill: "var(--ds-fill)",
        fillStrong: "var(--ds-fill-strong)",
        fillAlt: "var(--ds-fill-alt)",
        inverseBg: "var(--ds-inverse-bg)",
        inverseLabel: "var(--ds-inverse-label)",
        inversePrimary: "var(--ds-inverse-primary)",
        positive: "var(--ds-positive)",
        cautionary: "var(--ds-cautionary)",
        negative: "var(--ds-negative)",
        positiveFg: "var(--ds-positive-fg)",
        cautionaryFg: "var(--ds-cautionary-fg)",
        negativeFg: "var(--ds-negative-fg)",
        inactive: "var(--ds-inactive)",
        disable: "var(--ds-disable)",
        // 상태 (이전 이름 호환)
        success: "var(--ds-positive-fg)",
        successBg: "rgba(0,191,64,.12)",
        warn: "var(--ds-cautionary-fg)",
        warnBg: "rgba(255,146,0,.14)",
        error: "var(--ds-negative-fg)",
        // 보조 텍스트 / 선 (이전 이름 호환 → DS 값)
        "ink-50": "var(--ds-label-alt)",
        "ink-65": "var(--ds-label-neutral)",
        "ink-70": "var(--ds-label-neutral)",
        "line-10": "var(--ds-line-alt)",
        "line-14": "var(--ds-line-neutral)",
        "line-24": "var(--ds-line)",
        "line-30": "var(--ds-line)",
        "paper-60": "rgba(247,247,248,.6)",
        "paper-85": "rgba(247,247,248,.85)",
        "paper-line": "rgba(247,247,248,.16)",
        kakao: "#FEE500",
        naver: "#03C75A",
        toss: "#0064FF",
        skeleton: "#eaebec",
      },
      fontFamily: {
        sans: ["var(--font-pretendard)", "Pretendard", "-apple-system", "BlinkMacSystemFont", "system-ui", "Apple SD Gothic Neo", "Noto Sans KR", "sans-serif"],
      },
      maxWidth: { content: "1060px" },
      borderRadius: { ds: "12px", "ds-sm": "8px", pill: "999px" },
      boxShadow: {
        xs: "0 1px 2px -1px rgba(23,23,23,.1)",
        sm: "0 4px 6px -1px rgba(23,23,23,.06), 0 2px 4px -2px rgba(23,23,23,.06)",
        md: "0 10px 15px -3px rgba(23,23,23,.07), 0 4px 6px -2px rgba(23,23,23,.07)",
        lg: "0 16px 24px -6px rgba(23,23,23,.08), 0 6px 10px -4px rgba(23,23,23,.08)",
      },
      transitionDuration: { DEFAULT: "150ms" },
    },
  },
  plugins: [],
};

export default config;
