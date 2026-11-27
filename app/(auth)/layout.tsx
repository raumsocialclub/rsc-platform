import type { Metadata } from "next";

/** 로그인·가입 화면은 검색에서 제외 (M11) */
export const metadata: Metadata = { robots: { index: false, follow: false } };

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return children;
}
