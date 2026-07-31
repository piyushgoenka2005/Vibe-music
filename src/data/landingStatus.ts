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
    status: "Warehouses across India",
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
    href: ROUTES.page("shipping"),
  },
  {
    icon: "shield" as const,
    title: "Genuine products",
    desc: "Authorized brands, verified stock",
    status: "Verified",
    tone: "success" as StatusTone,
    href: ROUTES.page("terms"),
  },
  {
    icon: "return" as const,
    title: "Easy returns",
    desc: "Hassle-free support when you need it",
    status: "7-day window",
    tone: "info" as StatusTone,
    href: ROUTES.page("returns"),
  },
  {
    icon: "headphones" as const,
    title: "Expert advice",
    desc: "Real musicians on our support team",
    status: "Email support",
    tone: "info" as StatusTone,
    href: ROUTES.contact,
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
    title: "Secure checkout",
    desc: "Pay with UPI, cards, and net banking at checkout",
    status: "Available",
    tone: "info" as StatusTone,
    href: ROUTES.checkout,
    cta: "Go to checkout",
  },
  {
    icon: "clock" as const,
    title: "In-stock dispatch",
    desc: "Priced, in-stock gear ships from our warehouses",
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

export const LANDING_SOCIAL_PROOF = {
  rating: "4.8",
  ratingScale: "5",
  detail: "customer reviews on product pages",
  musicians: "India-wide",
  cities: "Pan-India",
  brands: "Authorized",
} as const;

export const LANDING_LOCATIONS = [
  {
    city: "Delhi",
    status: "Open",
    tone: "live" as StatusTone,
    accent: "#1e3a8a",
    image: "/images/locations/delhi.jpg",
  },
  {
    city: "Kolkata",
    status: "Open",
    tone: "live" as StatusTone,
    accent: "#0f766e",
    image: "/images/locations/kolkata.jpg",
  },
  {
    city: "Nagpur",
    status: "Open",
    tone: "live" as StatusTone,
    accent: "#9a3412",
    image: "/images/locations/nagpur.jpg",
  },
  {
    city: "North East",
    status: "Partner hub",
    tone: "info" as StatusTone,
    accent: "#5b21b6",
    image: "/images/locations/north-east.jpg",
  },
  {
    city: "Mumbai",
    status: "Flagship",
    tone: "success" as StatusTone,
    accent: "#1253ed",
    image: "/images/locations/mumbai.jpg",
  },
] as const;
