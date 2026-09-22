import type { Config } from "tailwindcss";

/**
 * Design.md 토큰. 모든 화면은 이 값만 사용한다.
 * Tailwind v4에서는 app/globals.css의 `@config`로 이 파일을 불러온다.
 */
const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    // breakpoint는 하나(760px)만 사용한다.
    screens: {
      md: "760px",
    },
    extend: {
      colors: {
        cream: "#f2eee5",
        card: "#f7f3ec",
        ink: "#211e19",
        brown: "#5a3d24",
        brownHover: "#9c6b3e",
        gold: "#e2b478",
        goldHover: "#f0c98e",
        success: "#2e6b3e",
        successBg: "rgba(46,107,62,.12)",
        warn: "#7a5420",
        warnBg: "rgba(226,180,120,.25)",
        error: "#a3402c",
        // 보조 텍스트 / 선
        "ink-50": "rgba(33,30,25,.5)",
        "ink-65": "rgba(33,30,25,.65)",
        "ink-70": "rgba(33,30,25,.7)",
        "line-10": "rgba(33,30,25,.1)",
        "line-14": "rgba(33,30,25,.14)",
        "line-24": "rgba(33,30,25,.24)",
        "line-30": "rgba(33,30,25,.3)",
        // 다크 섹션 위
        paper: "#f7f3ec",
        "paper-60": "rgba(247,243,236,.6)",
        "paper-85": "rgba(247,243,236,.85)",
        "paper-line": "rgba(247,243,236,.15)",
        // 결제수단 브랜드색
        kakao: "#FEE500",
        naver: "#03C75A",
        toss: "#0064FF",
        // 스켈레톤
        skeleton: "#e9e3d7",
      },
      fontFamily: {
        sans: ["var(--font-samsung)", "Arial", "sans-serif"],
      },
      maxWidth: {
        content: "1100px",
      },
      borderRadius: {
        pill: "999px",
      },
      transitionDuration: {
        DEFAULT: "150ms",
      },
    },
  },
  plugins: [],
};

export default config;
