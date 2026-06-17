"use client";

import Image from "next/image";
import { useState, type CSSProperties, type SyntheticEvent } from "react";

const BENTO_IMAGE_FALLBACK = "/images/Electric Blue Guitar.png";

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

function isLocalAsset(src: string): boolean {
  return src.startsWith("/images/");
}

function localImagePath(src: string): string {
  return src.split("?")[0];
}

export default function CategoryBentoImage({
  alt,
  className,
  loading = "lazy",
  objectPosition = "center center",
  priority = false,
  sizes,
  src,
  srcSet,
  variant = "card",
}: CategoryBentoImageProps) {
  const [loaded, setLoaded] = useState(false);
  const [imageSrc, setImageSrc] = useState(src);

  function handleError(event: SyntheticEvent<HTMLImageElement>) {
    const img = event.currentTarget;
    if (img.dataset.fallbackApplied === "true") return;
    img.dataset.fallbackApplied = "true";
    setLoaded(false);
    setImageSrc(BENTO_IMAGE_FALLBACK);
  }

  const loadedClass =
    loaded || priority ? " category-bento__image--loaded" : "";
  const imageStyle: CSSProperties = {
    objectFit: "contain",
    objectPosition,
  };

  if (isLocalAsset(imageSrc)) {
    return (
      <Image
        alt={alt}
        className={`${className}${loadedClass}`}
        fill
        onError={handleError}
        onLoad={() => setLoaded(true)}
        priority={priority}
        sizes={sizes ?? (variant === "hero" ? "(min-width: 1024px) 50vw, 92vw" : "25vw")}
        src={localImagePath(imageSrc)}
        style={imageStyle}
      />
    );
  }

  return (
    <img
      alt={alt}
      className={`${className}${loadedClass}`}
      decoding="async"
      loading={priority ? "eager" : loading}
      onError={handleError}
      onLoad={() => setLoaded(true)}
      sizes={sizes}
      src={imageSrc}
      srcSet={srcSet}
      style={imageStyle}
    />
  );
}
