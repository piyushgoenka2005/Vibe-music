"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import { storefrontImageUrl } from "@/lib/storefrontImages";

interface StorefrontThumbImageProps {
  src: string;
  alt?: string;
  className?: string;
  width?: number;
  height?: number;
}

/**
 * Small product thumbs. Prefer thumb API / derivatives; fall back to the
 * original URL in the browser when the proxy fails so drawers never stay blank.
 */
export default function StorefrontThumbImage({
  src,
  alt = "",
  className,
  width = 72,
  height = 72,
}: StorefrontThumbImageProps) {
  const preferred = useMemo(
    () => storefrontImageUrl(src, Math.max(width, height)),
    [src, width, height]
  );
  const [attempt, setAttempt] = useState<"preferred" | "master">("preferred");
  const [failed, setFailed] = useState(false);

  const displaySrc =
    attempt === "master" && preferred.kind === "thumb" ? src : preferred.src;

  const unoptimized =
    displaySrc.startsWith("http://") ||
    displaySrc.startsWith("https://") ||
    displaySrc.includes("/api/media/thumb");

  if (!displaySrc || failed) {
    return (
      <div
        aria-hidden
        className={`${className ?? ""} storefront-thumb-image--placeholder`.trim()}
        style={{ width, height }}
      />
    );
  }

  return (
    <Image
      src={displaySrc}
      alt={alt}
      width={width}
      height={height}
      className={className}
      unoptimized={unoptimized}
      onError={() => {
        if (attempt === "preferred" && preferred.kind === "thumb" && src) {
          setAttempt("master");
          return;
        }
        setFailed(true);
      }}
    />
  );
}
