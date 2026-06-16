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

export const WHY_SHOP_HEADING = "Why Shop with Vibe Music?";

export const WHY_SHOP_ITEMS: WhyShopItem[] = [
  {
    id: "free-shipping",
    iconId: "shipping",
    title: "Free Shipping",
    description: "Free pan-India shipping on orders over ₹2,999.",
    href: ROUTES.search,
  },
  {
    id: "easy-returns",
    iconId: "returns",
    title: "Easy Returns",
    description: "10-day easy returns on eligible gear — hassle-free support when you need it.",
    href: ROUTES.accountOrders,
  },
  {
    id: "pay-your-way",
    iconId: "payments",
    title: "Pay Your Way",
    description: "Secure checkout via Razorpay · UPI · Cards · EMI.",
    href: ROUTES.checkout,
  },
  {
    id: "deals-on-deals",
    iconId: "deals",
    title: "Deals on Deals",
    description: "Exclusive savings on top brands — new offers added every week.",
    href: `${ROUTES.searchResults}?q=deals`,
  },
  {
    id: "price-match",
    iconId: "price-match",
    title: "Price Match Guarantee",
    description: "Found a better price? We'll match it on identical in-stock gear.",
    href: `mailto:${BRAND.email}?subject=Price%20Match%20Request`,
  },
  {
    id: "earn-points",
    iconId: "rewards",
    title: "Earn Points",
    description: "Collect reward points on every purchase and redeem on your next order.",
    href: ROUTES.account,
  },
  {
    id: "gear-support",
    iconId: "support",
    title: "Gear Support",
    description: `Get advice from real musicians — ${BRAND.email} or ${BRAND.phoneDisplay}.`,
    href: `mailto:${BRAND.email}`,
  },
  {
    id: "open-box",
    iconId: "open-box",
    title: "Open Box",
    description: "Save on B-Stock and open-box gear, inspected and ready to play.",
    href: `${ROUTES.searchResults}?q=open-box`,
  },
];
