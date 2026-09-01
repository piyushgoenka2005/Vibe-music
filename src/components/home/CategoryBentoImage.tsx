"use client";

import Image from "next/image";
import { useEffect, useRef, useState, type CSSProperties, type SyntheticEvent } from "react";

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
  loading: _loading = "lazy",
  objectPosition = "center center",
  priority = false,
  sizes,
  src,
  srcSet: _srcSet,
  variant = "card",
}: CategoryBentoImageProps) {
  const [loaded, setLoaded] = useState(priority);
  const [imageSrc, setImageSrc] = useState(src);
  const imgRef = useRef<HTMLImageElement | null>(null);

  useEffect(() => {
    setImageSrc(src);
    if (priority) {
      setLoaded(true);
      return;
    }
    setLoaded(false);
  }, [src, priority]);

  useEffect(() => {
    const img = imgRef.current;
    if (!img || loaded) return;
    if (img.complete && img.naturalWidth > 0) {
      setLoaded(true);
    }
  }, [imageSrc, loaded]);

  function markLoaded() {
    setLoaded(true);
  }

  function handleError(event: SyntheticEvent<HTMLImageElement>) {
    const img = event.currentTarget;
    if (img.dataset.fallbackApplied === "true") return;
    img.dataset.fallbackApplied = "true";
    setLoaded(false);
    setImageSrc(BENTO_IMAGE_FALLBACK);
  }

  const loadedClass = loaded || priority ? " category-bento__image--loaded" : "";
  const imageStyle: CSSProperties = {
    objectFit: "contain",
    objectPosition,
  };

  return (
    <Image
      alt={alt}
      className={`${className}${loadedClass}`}
      fill
      onError={handleError}
      onLoad={markLoaded}
      priority={priority}
      sizes={sizes ?? (variant === "hero" ? "(min-width: 1024px) 50vw, 92vw" : "25vw")}
      src={isLocalAsset(imageSrc) ? localImagePath(imageSrc) : imageSrc}
      style={imageStyle}
    />
  );
}
