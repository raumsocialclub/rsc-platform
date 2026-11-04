/** 어드민 로딩 (Suspense 기본) */
export default function Loading() {
  return (
    <div aria-busy="true" aria-live="polite" className="animate-pulse">
      <div className="h-[11px] w-[120px] bg-[rgba(112,115,124,.08)] mb-[10px]" />
      <div className="h-[30px] w-[240px] bg-[rgba(112,115,124,.08)] mb-[28px]" />
      <div className="bg-white border border-[rgba(112,115,124,.08)] h-[420px]" />
      <span className="sr-only">불러오는 중</span>
    </div>
  );
}
