"use client";

import Image from "next/image";
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
  const [failed, setFailed] = useState(false);
  const href = heroMarqueeProductHref(product);
  const imageSrc = failed ? IMAGE_FALLBACK : product.image;

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
        <Image
          className="scanner-card__img"
          src={imageSrc}
          alt={product.imageAlt}
          loading="lazy"
          width={44}
          height={44}
          sizes="44px"
          onError={() => setFailed(true)}
        />
        <div className="scanner-card__left">
          <div className="scanner-card__name">{product.name}</div>
          <div className="scanner-card__price">Price {product.price}</div>
        </div>
        <div className="scanner-card__divider" aria-hidden />
        <div className="scanner-card__right">
          <div className="scanner-card__revenue-row">
            <span className="scanner-card__revenue">{product.revenue}</span>
            {product.growth ? (
              <span className="scanner-card__growth">
                <GrowthArrowIcon />
                {product.growth}
              </span>
            ) : null}
          </div>
          <div className="scanner-card__rev-label">
            {product.slug ? "Brand" : "Revenue"}
          </div>
        </div>
      </Link>
    </div>
  );
}
