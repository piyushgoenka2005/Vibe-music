"use client";

import Image from "next/image";
import { useEffect, useRef, useState, type CSSProperties, type SyntheticEvent } from "react";

const BENTO_IMAGE_FALLBACK = "/images/browse-categories/guitars.jpg";

interface CategoryBentoImageProps {
  alt: string;
  className: string;
  loading?: "eager" | "lazy";
  objectPosition?: string;
  priority?: boolean;
  sizes?: string;
  src: string;
  srcSet?: string;
  variant?: "hero" | "card";
}

function isDirectAsset(src: string): boolean {
  return src.startsWith("/images/") || src.includes("cdn.vibemusic.in") || src.startsWith("http");
}

function localImagePath(src: string): string {
  return src.startsWith("/images/") ? src.split("?")[0] : src;
}

export default function CategoryBentoImage({
  alt,
  className,
  loading = "lazy",
  objectPosition = "center center",
  priority = false,
  sizes,
  src,
  srcSet: _srcSet,
  variant = "card",
}: CategoryBentoImageProps) {
  const [loaded, setLoaded] = useState(true);
  const [imageSrc, setImageSrc] = useState(src);
  const imgRef = useRef<HTMLImageElement | null>(null);

  useEffect(() => {
    setImageSrc(src);
    setLoaded(true);
  }, [src]);

  function markLoaded() {
    setLoaded(true);
  }

  function handleError(event: SyntheticEvent<HTMLImageElement>) {
    const img = event.currentTarget;
    if (img.dataset.fallbackApplied === "true") return;
    img.dataset.fallbackApplied = "true";
    setImageSrc(BENTO_IMAGE_FALLBACK);
  }

  const loadedClass = loaded ? " category-bento__image--loaded" : "";
  const imageStyle: CSSProperties = {
    objectFit: "cover",
    objectPosition,
  };

  return (
    <Image
      ref={imgRef}
      alt={alt}
      className={`${className}${loadedClass}`}
      fill
      loading={priority ? undefined : loading}
      onError={handleError}
      onLoad={markLoaded}
      priority={priority}
      sizes={
        sizes ??
        (variant === "hero" ? "(min-width: 1024px) 50vw, 92vw" : "(min-width: 768px) 50vw, 86vw")
      }
      src={isDirectAsset(imageSrc) ? localImagePath(imageSrc) : imageSrc}
      style={imageStyle}
      unoptimized
    />
  );
}
