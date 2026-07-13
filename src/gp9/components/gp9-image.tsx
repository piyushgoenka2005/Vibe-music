"use client";

import Image, { type ImageProps } from "next/image";

function isExternalUnoptimized(src: ImageProps["src"]): boolean {
  if (typeof src !== "string") return false;
  return src.includes("static.roland.com");
}

/**
 * next/image wrapper for GP-9.
 * Roland CDN images fail through the optimizer (400), so external hosts
 * are served unoptimized while local assets still go through `/_next/image`.
 */
export function Gp9Image({ src, alt = "", unoptimized, ...props }: ImageProps) {
  const skipOptimize = unoptimized ?? isExternalUnoptimized(src);
  return <Image src={src} alt={alt} unoptimized={skipOptimize} {...props} />;
}
