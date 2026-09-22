"use client";

/** 루트 레이아웃 자체가 실패했을 때의 최후 경계. 폰트·CSS 없이도 읽히도록 인라인 스타일. */
export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="ko">
      <body style={{ margin: 0, background: "#f7f3ec", color: "#211e19", fontFamily: "Arial, sans-serif", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
        <div style={{ maxWidth: 560, textAlign: "center" }}>
          <div style={{ fontSize: 11, letterSpacing: ".3em", opacity: 0.5, marginBottom: 18 }}>ERROR</div>
          <h1 style={{ fontWeight: 500, fontSize: 28, margin: "0 0 14px" }}>문제가 생겼습니다</h1>
          <p style={{ fontSize: 14.5, lineHeight: 1.7, opacity: 0.7 }}>잠시 후 다시 시도해 주세요.{error.digest ? ` (코드 ${error.digest})` : ""}</p>
          <button type="button" onClick={reset} style={{ marginTop: 20, padding: "16px 28px", background: "#5a3d24", color: "#f7f3ec", border: 0, fontSize: 13.5, fontWeight: 600, cursor: "pointer" }}>다시 시도</button>
        </div>
      </body>
    </html>
  );
}
