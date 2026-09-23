import localFont from "next/font/local";

/** SamsungOne 400/500/600/700 — Design.md 타이포그래피 규칙 */
export const samsungOne = localFont({
  src: [
    { path: "../app/fonts/SamsungOne-400.ttf", weight: "400", style: "normal" },
    { path: "../app/fonts/SamsungOne-500.ttf", weight: "500", style: "normal" },
    { path: "../app/fonts/SamsungOne-600.ttf", weight: "600", style: "normal" },
    { path: "../app/fonts/SamsungOne-700.ttf", weight: "700", style: "normal" },
  ],
  variable: "--font-samsung",
  display: "swap",
  fallback: ["Arial", "sans-serif"],
});
