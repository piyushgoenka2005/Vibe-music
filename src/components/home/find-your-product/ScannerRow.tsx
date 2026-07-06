"use client";

import ScannerProductCard from "@/components/home/find-your-product/ScannerProductCard";
import ScannerSkeletonCard from "@/components/home/find-your-product/ScannerSkeletonCard";
import type { ScannerProduct, ScannerRowCurve } from "@/components/home/find-your-product/types";
import { useHydrationSafeReducedMotion } from "@/hooks/useHydrationSafeReducedMotion";

interface ScannerRowProps {
  products: ScannerProduct[];
  duration: number;
  curve: ScannerRowCurve;
}

export default function ScannerRow({ products, duration, curve }: ScannerRowProps) {
  const reduceMotion = useHydrationSafeReducedMotion();
  const loop = [...products, ...products];
  const trackStyle = { "--scanner-duration": `${duration}s` } as React.CSSProperties;

  if (reduceMotion) {
    return (
      <div className={`scanner-row scanner-row--${curve} scanner-row--static`}>
        <div className="scanner-row__static-track">
          {products.slice(0, 5).map((product) => (
            <ScannerProductCard key={product.id} product={product} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={`scanner-row scanner-row--${curve}`}>
      <div className="scanner-row__inner">
        <div className="scanner-row__track" style={trackStyle}>
          {loop.map((product, index) => (
            <ScannerProductCard
              key={`full-${product.id}-${index}`}
              product={product}
            />
          ))}
        </div>
        <div className="scanner-row__skeleton-layer" aria-hidden>
          <div className="scanner-row__track" style={trackStyle}>
            {loop.map((_, index) => (
              <ScannerSkeletonCard key={`skel-${index}`} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
