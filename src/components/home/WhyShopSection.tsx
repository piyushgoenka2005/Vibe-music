"use client";

import Link from "next/link";
import { WHY_SHOP_HEADING, WHY_SHOP_ITEMS } from "@/data/whyShop";
import WhyShopValueIcon from "@/components/home/WhyShopValueIcons";
import { useHydrationSafeReducedMotion } from "@/hooks/useHydrationSafeReducedMotion";
import Reveal from "@/components/layout/Reveal";

function WhyShopCard({
  item,
  duplicateIndex,
}: {
  item: (typeof WHY_SHOP_ITEMS)[number];
  duplicateIndex: number;
}) {
  return (
    <Link
      href={item.href}
      className="why-shop__card"
      role="listitem"
      aria-hidden={duplicateIndex > 0 ? true : undefined}
      tabIndex={duplicateIndex > 0 ? -1 : undefined}
    >
      <div className="why-shop__icon-badge" aria-hidden>
        <WhyShopValueIcon iconId={item.iconId} />
      </div>
      <div className="why-shop__card-body">
        <h3 className="why-shop__card-title">{item.title}</h3>
        <p className="why-shop__card-desc">{item.subtitle}</p>
      </div>
      <span className="why-shop__card-cta">Learn More</span>
    </Link>
  );
}

export default function WhyShopSection() {
  const reduceMotion = useHydrationSafeReducedMotion();
  const loop = [...WHY_SHOP_ITEMS, ...WHY_SHOP_ITEMS];

  return (
    <section className="why-shop" aria-labelledby="why-shop-title">
      <div className="why-shop__inner">
        <Reveal as="header" className="why-shop__header">
          <h2 id="why-shop-title" className="why-shop__title">
            {WHY_SHOP_HEADING}
          </h2>
        </Reveal>
      </div>

      <div
        className={`why-shop__marquee${reduceMotion ? " why-shop__marquee--static" : ""}`}
        role="list"
        aria-label="Store benefits"
      >
        <div className="why-shop__marquee-track">
          {loop.map((item, index) => (
            <WhyShopCard
              key={`${item.id}-${index}`}
              item={item}
              duplicateIndex={index >= WHY_SHOP_ITEMS.length ? 1 : 0}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
