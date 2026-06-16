import Link from "next/link";
import {
  CreditCard,
  Gift,
  HandCoins,
  Headphones,
  PackageOpen,
  Percent,
  RotateCcw,
  Truck,
  type LucideIcon,
} from "lucide-react";
import { WHY_SHOP_HEADING, WHY_SHOP_ITEMS, type WhyShopIconId } from "@/data/whyShop";
import Reveal from "@/components/layout/Reveal";

const ICONS: Record<WhyShopIconId, LucideIcon> = {
  shipping: Truck,
  returns: RotateCcw,
  payments: CreditCard,
  deals: Percent,
  "price-match": HandCoins,
  rewards: Gift,
  support: Headphones,
  "open-box": PackageOpen,
};

function WhyShopIcon({ iconId }: { iconId: WhyShopIconId }) {
  const Icon = ICONS[iconId];
  return (
    <span className="why-shop__icon-pedal" aria-hidden>
      <Icon size={28} className="why-shop__icon" strokeWidth={1.75} />
    </span>
  );
}

export default function WhyShopSection() {
  return (
    <Reveal as="section" className="why-shop" aria-labelledby="why-shop-title">
      <div className="why-shop__inner">
        <header className="why-shop__header">
          <h2 id="why-shop-title" className="why-shop__title">
            {WHY_SHOP_HEADING}
          </h2>
        </header>

        <div className="why-shop__grid">
          {WHY_SHOP_ITEMS.map((item, index) => (
              <Reveal key={item.id} delay={index * 60} as="article">
                <Link href={item.href} className="why-shop__card">
                  <WhyShopIcon iconId={item.iconId} />
                  <h3 className="why-shop__card-title">{item.title}</h3>
                  <p className="why-shop__card-desc">{item.description}</p>
                </Link>
              </Reveal>
          ))}
        </div>
      </div>
    </Reveal>
  );
}
