import {
  CreditCard,
  Gift,
  Headphones,
  PackageOpen,
  Percent,
  RotateCcw,
  Tag,
  Truck,
  type LucideIcon,
} from "lucide-react";
import type { WhyShopIconId } from "@/data/whyShop";
import { cn } from "@/lib/utils";

interface WhyShopIconProps {
  iconId: WhyShopIconId;
  className?: string;
}

const ICONS: Record<WhyShopIconId, LucideIcon> = {
  shipping: Truck,
  returns: RotateCcw,
  payments: CreditCard,
  deals: Percent,
  "price-match": Tag,
  rewards: Gift,
  support: Headphones,
  "open-box": PackageOpen,
};

export default function WhyShopIcon({ iconId, className }: WhyShopIconProps) {
  const Icon = ICONS[iconId];

  return (
    <Icon
      className={cn(
        "h-9 w-9 shrink-0 text-[#0F172A] sm:h-10 sm:w-10 lg:h-11 lg:w-11",
        className
      )}
      strokeWidth={1.65}
      aria-hidden
      focusable={false}
    />
  );
}
