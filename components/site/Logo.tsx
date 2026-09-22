import Image from "next/image";
import Link from "next/link";

const INK_FILTER = "invert(1) brightness(0.15)";

type Props = {
  href?: string;
  /** 엠블럼 높이 클래스 (예: "h-[28px] md:h-[39px]") */
  emblemClass: string;
  /** 텍스트 로고 높이 클래스 (예: "h-[16px] md:h-[18px]") */
  textClass: string;
  /** 텍스트 로고 파일 (public/images/ 아래) */
  textSrc?: string;
  /** 엠블럼 파일 (CMS 로고 교체용) */
  emblemSrc?: string;
  className?: string;
};

/** 엠블럼 + 텍스트 로고. 원본은 흰색이라 invert 필터로 잉크색을 만든다. */
export function Logo({ href = "/", emblemClass, textClass, textSrc = "/images/logo-text.png", emblemSrc = "/images/logo-emblem.png", className = "gap-[14px]" }: Props) {
  return (
    <Link href={href} className={`flex items-center ${className}`}>
      <Image
        src={emblemSrc}
        alt="RAUM SOCIAL CLUB"
        width={529}
        height={638}
        priority
        className={`w-auto ${emblemClass}`}
        style={{ filter: INK_FILTER }}
        unoptimized={emblemSrc.startsWith("http")}
      />
      <Image
        src={textSrc}
        alt=""
        width={2612}
        height={332}
        priority
        className={`w-auto opacity-85 ${textClass}`}
        style={{ filter: INK_FILTER }}
        unoptimized={textSrc.startsWith("http")}
      />
    </Link>
  );
}
