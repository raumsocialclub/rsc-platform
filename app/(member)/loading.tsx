/** 회원 영역 로딩 (Suspense 기본). 카드 자리에 옅은 크림 블록. */
export default function Loading() {
  return (
    <div aria-busy="true" aria-live="polite" className="animate-pulse">
      <div className="h-[12px] w-[160px] bg-[rgba(33,30,25,.08)] mb-[16px]" />
      <div className="h-[36px] w-[280px] bg-[rgba(33,30,25,.08)] mb-[40px]" />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-[24px]">
        {[0, 1, 2].map((i) => <div key={i} className="h-[420px] bg-[rgba(33,30,25,.06)] border border-[rgba(33,30,25,.08)]" />)}
      </div>
      <span className="sr-only">불러오는 중</span>
    </div>
  );
}
