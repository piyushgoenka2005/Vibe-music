"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import ProductShareButton from "@/components/product/ProductShareButton";
import { heroMarqueeProductHref } from "@/data/heroMarqueeProducts";
import type { ScannerProduct } from "@/components/home/find-your-product/types";

const IMAGE_FALLBACK = "/images/guitar-1.webp";

interface ScannerProductCardProps {
  product: ScannerProduct;
  ariaHidden?: boolean;
}

export default function ScannerProductCard({
  product,
  ariaHidden = false,
}: ScannerProductCardProps) {
  const [failed, setFailed] = useState(false);
  const href = heroMarqueeProductHref(product);
  const imageSrc = failed ? IMAGE_FALLBACK : product.image;

  return (
    <div className="scanner-card-wrap" aria-hidden={ariaHidden || undefined}>
      <Link
        className="scanner-card"
        href={href}
        prefetch
        aria-label={ariaHidden ? undefined : `View ${product.name}`}
        tabIndex={ariaHidden ? -1 : undefined}
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
        <div className="scanner-card__body">
          <p className="scanner-card__name">{product.name}</p>
          <div className="scanner-card__meta">
            <span className="scanner-card__price">{product.price}</span>
            {product.tag ? <span className="scanner-card__tag">{product.tag}</span> : null}
          </div>
        </div>
      </Link>
      <ProductShareButton
        overlay
        position="top-right"
        className="scanner-card__share"
        title={product.name}
        url={href}
        size={14}
      />
    </div>
  );
}
