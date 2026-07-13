"use client";

import Image from "next/image";

interface StorefrontThumbImageProps {
  src: string;
  alt?: string;
  className?: string;
  width?: number;
  height?: number;
}

/** Small product thumbs — prefer next/image; unoptimize remote/thumb proxy URLs. */
export default function StorefrontThumbImage({
  src,
  alt = "",
  className,
  width = 72,
  height = 72,
}: StorefrontThumbImageProps) {
  const unoptimized =
    src.startsWith("http://") ||
    src.startsWith("https://") ||
    src.includes("/api/media/thumb");

  return (
    <Image
      src={src}
      alt={alt}
      width={width}
      height={height}
      className={className}
      unoptimized={unoptimized}
    />
  );
}
