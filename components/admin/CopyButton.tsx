"use client";

import { useState } from "react";

/** 클립보드 복사. 초대코드 전달용. */
export function CopyButton({ text, label = "복사" }: { text: string; label?: string }) {
  const [done, setDone] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setDone(true);
      setTimeout(() => setDone(false), 1500);
    } catch {
      window.prompt("아래 코드를 복사하세요", text);
    }
  };
  return (
    <button type="button" onClick={copy} className="border border-[rgba(33,30,25,.2)] bg-transparent px-[10px] py-[5px] text-[12px] cursor-pointer hover:border-brownHover hover:text-brownHover whitespace-nowrap">
      {done ? "복사됨" : label}
    </button>
  );
}
