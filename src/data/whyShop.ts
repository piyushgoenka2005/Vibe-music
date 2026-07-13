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
  subtitle: string;
  href: string;
}

export const WHY_SHOP_HEADING = "Why Shop With Vibe Music?";

export const WHY_SHOP_ITEMS: WhyShopItem[] = [
  {
    id: "free-shipping",
    iconId: "shipping",
    title: "Fast, FREE Shipping",
    subtitle: "Free on orders over ₹9,999.",
    href: ROUTES.page("shipping"),
  },
  {
    id: "easy-returns",
    iconId: "returns",
    title: "Easy Returns",
    subtitle: "Shop confidently with hassle-free returns.",
    href: ROUTES.page("returns"),
  },
  {
    id: "pay-your-way",
    iconId: "payments",
    title: "Easy Payments",
    subtitle: "UPI, cards & net banking at checkout.",
    href: ROUTES.checkout,
  },
  {
    id: "deals-on-deals",
    iconId: "deals",
    title: "Deals on Deals",
    subtitle: "Exclusive bundles and seasonal promos.",
    href: ROUTES.deals,
  },
  {
    id: "price-match",
    iconId: "price-match",
    title: "Price Protection",
    subtitle: "Worry-free shopping.",
    href: `mailto:${BRAND.email}?subject=Price%20Match%20Request`,
  },
  {
    id: "wishlist-save",
    iconId: "rewards",
    title: "Save to Wishlist",
    subtitle: "Keep gear ready for your next order.",
    href: ROUTES.accountWishlist,
  },
  {
    id: "expert-gear-support",
    iconId: "support",
    title: "FREE Product Support",
    subtitle: "Got a question? We're here to help.",
    href: ROUTES.contact,
  },
  {
    id: "open-box-savings",
    iconId: "open-box",
    title: "Open Box Savings",
    subtitle: "Inspected B-stock, backed by quality checks.",
    href: ROUTES.used,
  },
];
