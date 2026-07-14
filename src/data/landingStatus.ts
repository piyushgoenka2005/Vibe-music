import { ROUTES } from "@/lib/routes";

export type StatusTone = "live" | "success" | "info" | "neutral";

export const LANDING_STATS = [
  {
    value: "Curated",
    label: "Pro gear catalog",
    status: "Priced SKUs ready to buy",
    tone: "live" as StatusTone,
  },
  {
    value: "Fast",
    label: "Dispatch on in-stock",
    status: "Ships from Maharashtra",
    tone: "success" as StatusTone,
  },
  {
    value: "100%",
    label: "Genuine gear",
    status: "Brand verified",
    tone: "success" as StatusTone,
  },
  {
    value: "Mon–Sat",
    label: "Gear support",
    status: "Email within 1–2 days",
    tone: "info" as StatusTone,
  },
] as const;

export const LANDING_LIVE_TICKER = [
  "Store open — dispatching orders across India",
  "Free shipping on all orders",
  "Secure checkout via Razorpay · UPI · Cards",
  "Gear advisors reply by email Mon–Sat",
  "Track orders from your account after dispatch",
] as const;

export const LANDING_TRUST_ITEMS = [
  {
    icon: "truck" as const,
    title: "Fast delivery",
    desc: "Pan-India shipping on in-stock gear",
    status: "Active",
    tone: "success" as StatusTone,
  },
  {
    icon: "shield" as const,
    title: "Genuine products",
    desc: "Authorized brands, verified stock",
    status: "Verified",
    tone: "success" as StatusTone,
  },
  {
    icon: "return" as const,
    title: "Easy returns",
    desc: "Hassle-free support when you need it",
    status: "7-day window",
    tone: "info" as StatusTone,
  },
  {
    icon: "headphones" as const,
    title: "Expert advice",
    desc: "Real musicians on our support team",
    status: "Email support",
    tone: "info" as StatusTone,
  },
] as const;

export const LANDING_SERVICE_STATUS = [
  {
    icon: "package" as const,
    title: "Track your order",
    desc: "Shipment updates once your order is packed and dispatched",
    status: "Available",
    tone: "success" as StatusTone,
    href: ROUTES.trackOrder,
    cta: "Track now",
  },
  {
    icon: "credit-card" as const,
    title: "EMI & financing",
    desc: "Apply for installment options on eligible gear",
    status: "Available",
    tone: "info" as StatusTone,
    href: ROUTES.financing,
    cta: "Explore financing",
  },
  {
    icon: "clock" as const,
    title: "In-stock dispatch",
    desc: "Priced, in-stock gear ships from our Maharashtra warehouse",
    status: "On schedule",
    tone: "info" as StatusTone,
    href: ROUTES.search,
    cta: "Shop in-stock",
  },
  {
    icon: "message" as const,
    title: "Gear advisors",
    desc: "Talk to musicians before you buy — email Mon–Sat",
    status: "Email support",
    tone: "info" as StatusTone,
    href: ROUTES.contact,
    cta: "Get help",
  },
] as const;

/** Trust bar above footer — rating shown as product-page review average. */
export const LANDING_SOCIAL_PROOF = {
  rating: "4.8",
  ratingScale: "5",
  detail: "customer reviews on product pages",
  musicians: "India-wide",
  cities: "Pan-India",
  brands: "Authorized",
} as const;

/**
 * Delivery coverage — not claimed retail storefronts.
 * Visuals use brand accents (no missing location photo assets).
 */
export const LANDING_LOCATIONS = [
  {
    city: "Mumbai",
    status: "Dispatch hub",
    tone: "success" as StatusTone,
    accent: "#1253ed",
  },
  {
    city: "Maharashtra",
    status: "Warehouse",
    tone: "live" as StatusTone,
    accent: "#0e42be",
  },
  {
    city: "North & East",
    status: "We ship here",
    tone: "info" as StatusTone,
    accent: "#0f766e",
  },
  {
    city: "Pan-India",
    status: "Courier partners",
    tone: "info" as StatusTone,
    accent: "#5b21b6",
  },
] as const;
