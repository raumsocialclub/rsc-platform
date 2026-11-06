import Link from "next/link";
import { Container } from "@/components/ui/ds";

/** 트랙 페이지 상단의 「소셜클럽 | 1:1 매칭」 전환 바. 현재 페이지가 강조되고, 다른 트랙으로 바로 넘어갈 수 있다. */
export function TrackSwitch({ current }: { current: "social" | "matching" }) {
  const items = [
    { key: "social", href: "/social", label: "소셜클럽", sub: "함께 경험하며 가까워지는" },
    { key: "matching", href: "/matching", label: "1:1 매칭", sub: "한 사람을 깊이 알고 만나는" },
  ] as const;
  return (
    <div className="border-b border-lineAlt bg-white">
      <Container wide>
        <div role="tablist" aria-label="만남 방식" className="flex">
          {items.map((it) => {
            const on = it.key === current;
            return (
              <Link key={it.key} href={it.href} role="tab" aria-selected={on} aria-current={on ? "page" : undefined} className={`flex-1 md:flex-none md:min-w-[200px] px-[8px] md:px-[20px] py-[14px] md:py-[16px] border-b-2 -mb-px text-center md:text-left transition-colors ${on ? "border-primary text-label" : "border-transparent text-labelAlt hover:text-label"}`}>
                <span className="block t-headline-2">{it.label}</span>
                <span className="hidden md:block t-caption-1 text-labelAlt mt-[2px]">{it.sub}</span>
              </Link>
            );
          })}
        </div>
      </Container>
    </div>
  );
}
