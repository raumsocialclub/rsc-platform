import Image from "next/image";

type Props = {
  src: string;
  alt: string;
  /** 래퍼 클래스. 높이·마진 등을 지정한다. (position: relative 포함) */
  className?: string;
  /** CSS filter 문자열 (예: "brightness(0.97) saturate(0.94)") */
  filter?: string;
  priority?: boolean;
  sizes?: string;
};

/** 프로토타입의 <image-slot fit="cover"> 를 대체한다. 래퍼를 꽉 채우는 cover 이미지. */
export function ImageBlock({ src, alt, className = "", filter, priority, sizes = "100vw" }: Props) {
  // 래퍼가 absolute 로 배치되는 경우(히어로)에는 relative 를 붙이지 않는다.
  const position = /\babsolute\b/.test(className) ? "" : "relative";
  return (
    <div className={`${position} overflow-hidden ${className}`}>
      <Image
        src={src}
        alt={alt}
        fill
        sizes={sizes}
        priority={priority}
        className="object-cover"
        style={filter ? { filter } : undefined}
      />
    </div>
  );
}
