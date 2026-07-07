"use client";

import Link from "next/link";
import { useState } from "react";
import ProductShareButton from "@/components/product/ProductShareButton";
import { heroMarqueeProductHref } from "@/data/heroMarqueeProducts";
import GrowthArrowIcon from "@/components/home/find-your-product/GrowthArrowIcon";
import type { ScannerProduct } from "@/components/home/find-your-product/types";

const IMAGE_FALLBACK = "/images/guitar-1.webp";

interface ScannerProductCardProps {
  product: ScannerProduct;
}

export default function ScannerProductCard({ product }: ScannerProductCardProps) {
  const [imageSrc, setImageSrc] = useState(product.image);
  const href = heroMarqueeProductHref(product);

  return (
    <div className="scanner-card-wrap">
      <ProductShareButton
        className="scanner-card__share"
        title={product.name}
        url={href}
        size={14}
      />
      <Link
        className="scanner-card"
        href={href}
        prefetch
        aria-label={`View ${product.name}`}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          className="scanner-card__img"
          src={imageSrc}
          alt={product.imageAlt}
          loading="lazy"
          decoding="async"
          width={44}
          height={44}
          onError={() => {
            if (imageSrc !== IMAGE_FALLBACK) setImageSrc(IMAGE_FALLBACK);
          }}
        />
        <div className="scanner-card__left">
          <div className="scanner-card__name">{product.name}</div>
          <div className="scanner-card__price">Price {product.price}</div>
        </div>
        <div className="scanner-card__divider" aria-hidden />
        <div className="scanner-card__right">
          <div className="scanner-card__revenue-row">
            <span className="scanner-card__revenue">{product.revenue}</span>
            <span className="scanner-card__growth">
              <GrowthArrowIcon />
              {product.growth}
            </span>
          </div>
          <div className="scanner-card__rev-label">Revenue</div>
        </div>
      </Link>
    </div>
  );
}
