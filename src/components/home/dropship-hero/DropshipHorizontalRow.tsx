"use client";

import type { HeroMarqueeProduct } from "@/data/heroMarqueeProducts";
import DropshipProductCard from "@/components/home/dropship-hero/DropshipProductCard";
import { useHydrationSafeReducedMotion } from "@/hooks/useHydrationSafeReducedMotion";

interface DropshipHorizontalRowProps {
  products: HeroMarqueeProduct[];
  direction: "left" | "right";
  duration: number;
}

export default function DropshipHorizontalRow({
  products,
  direction,
  duration,
}: DropshipHorizontalRowProps) {
  const reduceMotion = useHydrationSafeReducedMotion();
  const loop = [...products, ...products];

  if (reduceMotion) {
    return (
      <div className="dropship-h-row dropship-h-row--static">
        <div className="dropship-h-track dropship-h-track--static">
          {products.slice(0, 4).map((product) => (
            <DropshipProductCard key={product.id} product={product} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div
      className="dropship-h-row"
      data-direction={direction}
      style={{ "--duration": `${duration}s` } as React.CSSProperties}
    >
      <div className="dropship-h-track">
        {loop.map((product, index) => (
          <DropshipProductCard
            key={`${product.id}-${index}`}
            product={product}
          />
        ))}
      </div>
    </div>
  );
}
