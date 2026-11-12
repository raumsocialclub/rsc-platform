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
  /** 사진 초점 = CSS object-position (예: "50% 60%"). 모바일에서 핵심 피사체가 잘리지 않도록 초점을 옮긴다 */
  focus?: string;
  /** (하위 호환) 예전에는 카드 안 사진만 확대했지만 지금은 모든 사진이 기본으로 살아 움직인다(img-live). 넘겨도 무시된다 */
  zoom?: boolean;
  /** 스크롤 등장 효과 (data-reveal) */
  reveal?: boolean;
};

/** 프로토타입의 <image-slot fit="cover"> 를 대체한다. 래퍼를 꽉 채우는 cover 이미지.
 *  모든 사진은 `img-live`(globals.css): 호버 시 확대 + 빛줄기, 누르면 살짝 가라앉는다. */
export function ImageBlock({ src, alt, className = "", filter, priority, sizes = "100vw", focus, reveal }: Props) {
  // 래퍼가 absolute 로 배치되는 경우(히어로)에는 relative 를 붙이지 않는다.
  const position = /\babsolute\b/.test(className) ? "" : "relative";
  return (
    <div className={`${position} overflow-hidden img-live ${className}`} data-reveal={reveal ? "" : undefined}>
      <Image
        src={src}
        alt={alt}
        fill
        sizes={sizes}
        priority={priority}
        className="object-cover"
        style={filter || focus ? { ...(filter ? { filter } : {}), ...(focus ? { objectPosition: focus } : {}) } : undefined}
      />
    </div>
  );
}
