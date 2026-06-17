import { ROUTES } from "@/lib/routes";
import { BRAND } from "@/lib/brand";

export type WhyShopIconId =
  | "shipping"
  | "returns"
  | "payments"
  | "deals"
  | "price-match"
  | "rewards"
  | "support"
  | "open-box";

export interface WhyShopItem {
  id: string;
  iconId: WhyShopIconId;
  title: string;
  description: string;
  href: string;
}

export const WHY_SHOP_HEADING = "Why Shop With Vibe Music?";

export const WHY_SHOP_ITEMS: WhyShopItem[] = [
  {
    id: "free-shipping",
    iconId: "shipping",
    title: "Free Shipping",
    description:
      "Free shipping across India on qualifying orders. Fast, secure delivery on instruments and audio gear.",
    href: ROUTES.search,
  },
  {
    id: "easy-returns",
    iconId: "returns",
    title: "Easy Returns",
    description:
      "Simple return process with customer-first support. Shop confidently with hassle-free returns.",
    href: ROUTES.accountOrders,
  },
  {
    id: "pay-your-way",
    iconId: "payments",
    title: "Pay Your Way",
    description: "Flexible payments via Razorpay, UPI, Cards, EMI and Net Banking.",
    href: ROUTES.checkout,
  },
  {
    id: "deals-on-deals",
    iconId: "deals",
    title: "Deals on Deals",
    description:
      "Exclusive discounts, bundle offers and seasonal promotions on top brands.",
    href: `${ROUTES.searchResults}?q=deals`,
  },
  {
    id: "price-match",
    iconId: "price-match",
    title: "Price Match Guarantee",
    description:
      "Found a better deal? We'll work to match competitive pricing on eligible products.",
    href: `mailto:${BRAND.email}?subject=Price%20Match%20Request`,
  },
  {
    id: "earn-rewards",
    iconId: "rewards",
    title: "Earn Rewards",
    description: "Earn reward points on purchases and redeem them on future orders.",
    href: ROUTES.account,
  },
  {
    id: "expert-gear-support",
    iconId: "support",
    title: "Expert Gear Support",
    description:
      "Talk to real musicians and gear experts for product recommendations and guidance.",
    href: `mailto:${BRAND.email}`,
  },
  {
    id: "open-box-savings",
    iconId: "open-box",
    title: "Open Box Savings",
    description:
      "Save more with inspected open-box and B-stock products backed by quality checks.",
    href: `${ROUTES.searchResults}?q=open-box`,
  },
];
