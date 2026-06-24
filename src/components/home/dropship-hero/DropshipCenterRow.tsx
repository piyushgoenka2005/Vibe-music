"use client";

import type { HeroMarqueeProduct } from "@/data/heroMarqueeProducts";
import DropshipEmptyCard from "@/components/home/dropship-hero/DropshipEmptyCard";
import DropshipProductCard from "@/components/home/dropship-hero/DropshipProductCard";
import { useHydrationSafeReducedMotion } from "@/hooks/useHydrationSafeReducedMotion";

export type DropshipRowCurve = "up" | "flat" | "down";

interface DropshipCenterRowProps {
  products: HeroMarqueeProduct[];
  duration: number;
  curve: DropshipRowCurve;
}

export default function DropshipCenterRow({
  products,
  duration,
  curve,
}: DropshipCenterRowProps) {
  const reduceMotion = useHydrationSafeReducedMotion();
  const loop = [...products, ...products];
  const trackStyle = { "--duration": `${duration}s` } as React.CSSProperties;

  if (reduceMotion) {
    return (
      <div className={`dropship-c-row dropship-c-row--${curve} dropship-c-row--static`}>
        <div className="dropship-c-row__static-track">
          {products.slice(0, 5).map((product) => (
            <DropshipProductCard key={product.id} product={product} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={`dropship-c-row dropship-c-row--${curve}`}>
      <div className="dropship-c-row__track-wrap">
        <div className="dropship-c-row__arc dropship-c-row__arc-left">
          <div
            className="dropship-c-track dropship-c-track--empty"
            style={trackStyle}
          >
            {loop.map((product, index) => (
              <DropshipEmptyCard key={`empty-${product.id}-${index}`} />
            ))}
          </div>
        </div>

        <div className="dropship-c-row__arc dropship-c-row__arc-right">
          <div
            className="dropship-c-track dropship-c-track--full"
            style={trackStyle}
          >
            {loop.map((product, index) => (
              <DropshipProductCard
                key={`full-${product.id}-${index}`}
                product={product}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
