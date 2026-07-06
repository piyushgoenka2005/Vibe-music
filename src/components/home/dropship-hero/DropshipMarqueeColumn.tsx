"use client";

import { useEffect, useMemo, useRef } from "react";
import type { HeroMarqueeProduct } from "@/data/heroMarqueeProducts";
import DropshipProductCard from "@/components/home/dropship-hero/DropshipProductCard";
import { useHydrationSafeReducedMotion } from "@/hooks/useHydrationSafeReducedMotion";

const CARD_W = 300;
const V_SPREAD = 520;
const H_SPREAD = 42;
const ANGLE_RANGE = 88;
const SPEED = 0.032;

interface DropshipMarqueeColumnProps {
  products: HeroMarqueeProduct[];
  direction: "left" | "right";
  columnId: string;
}

export default function DropshipMarqueeColumn({
  products,
  direction,
  columnId,
}: DropshipMarqueeColumnProps) {
  const itemRefs = useRef<(HTMLDivElement | null)[]>([]);
  const offsetRef = useRef(0);
  const pausedRef = useRef(false);
  const reduceMotion = useHydrationSafeReducedMotion();

  const nCards = products.length;
  const step = nCards > 1 ? ANGLE_RANGE / (nCards - 1) : 0;

  const baseAngles = useMemo(
    () =>
      products.map((_, index) => {
        const base = -ANGLE_RANGE / 2 + index * step;
        return direction === "right" ? -base : base;
      }),
    [direction, products, step]
  );

  useEffect(() => {
    if (reduceMotion) return;

    let frame = 0;

    function tick() {
      if (!pausedRef.current) {
        offsetRef.current += direction === "left" ? SPEED : -SPEED;
      }

      const offset = offsetRef.current;

      itemRefs.current.forEach((element, index) => {
        if (!element) return;

        let angle = baseAngles[index]! + offset;

        while (angle > ANGLE_RANGE / 2) angle -= ANGLE_RANGE + step;
        while (angle < -ANGLE_RANGE / 2) angle += ANGLE_RANGE + step;

        const radians = (angle * Math.PI) / 180;
        const y = Math.sin(radians) * V_SPREAD;
        const peel = Math.max(0.35, Math.cos(radians));
        const x =
          (direction === "left" ? -1 : 1) *
          (CARD_W * 0.52 + H_SPREAD * peel + Math.abs(angle) * 1.4);

        element.style.transform = `translate(calc(-50% + ${x.toFixed(2)}px), calc(-50% + ${y.toFixed(2)}px)) rotate(${(angle * 0.35).toFixed(3)}deg)`;

        const absAngle = Math.abs(angle);
        const opacity =
          absAngle > 38 ? Math.max(0.15, 1 - (absAngle - 38) / 14) : 1;
        element.style.opacity = opacity.toFixed(3);

        const skeleton = element.querySelector<HTMLElement>(
          ".dropship-card-skeleton"
        );
        if (skeleton) {
          const revealPct = Math.max(0, 1 - absAngle / 30);
          const hiddenPx = Math.round((1 - revealPct) * CARD_W);

          if (direction === "right") {
            skeleton.style.clipPath = `inset(0px ${hiddenPx}px 0px 0px round 12px)`;
          } else {
            skeleton.style.clipPath = `inset(0px 0px 0px ${hiddenPx}px round 12px)`;
          }
        }
      });

      frame = window.requestAnimationFrame(tick);
    }

    frame = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(frame);
  }, [baseAngles, direction, reduceMotion, step]);

  if (reduceMotion) {
    return (
      <div className="dropship-marquee-column dropship-marquee-column--static">
        <ul className="dropship-static-list">
          {products.slice(0, 4).map((product) => (
            <li key={`${columnId}-${product.name}`}>
              <DropshipProductCard product={product} />
            </li>
          ))}
        </ul>
      </div>
    );
  }

  return (
    <div
      className={`dropship-marquee-column dropship-marquee-column--${direction}`}
      id={columnId}
      onMouseEnter={() => {
        pausedRef.current = true;
      }}
      onMouseLeave={() => {
        pausedRef.current = false;
      }}
    >
      <div className="dropship-marquee-track" id={`${columnId}-inner`}>
        {products.map((product, index) => (
          <div
            key={`${columnId}-${product.name}`}
            className="dropship-marquee-item"
            ref={(node) => {
              itemRefs.current[index] = node;
            }}
          >
            <div className="dropship-card-skeleton">
              <DropshipProductCard product={product} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
