import type { Metadata } from "next";
import ProgramLandingPage from "@/components/programs/ProgramLandingPage";
import { BRAND } from "@/lib/brand";
import { ROUTES } from "@/lib/routes";
import "@/styles/storefront-pages.css";
import "@/styles/program-landing.css";

export const metadata: Metadata = {
  title: "Payments & Financing",
  description:
    "How to pay at Vibe Music — UPI, cards, net banking via Razorpay, and cash on delivery where available. No separate EMI product is live online yet.",
};

export default function FinancingPage() {
  return (
    <main className="storefront-page storefront-page--subtle">
      <ProgramLandingPage
        eyebrow={BRAND.financingName}
        title="Pay your way at checkout"
        subtitle="Online checkout supports UPI, cards, and net banking through Razorpay, plus cash on delivery when that option is offered for your order."
        statusNote="A dedicated EMI calculator, store card, or buy-now-pay-later product is not live on vibemusic.in yet. Bank EMI may still appear inside Razorpay for eligible cards when your bank offers it."
        highlights={[
          "Secure Razorpay checkout for UPI, cards, and net banking",
          "Cash on delivery available on supported orders",
          "No separate Vibe Music Card or in-house installment plan online today",
          "Large-order payment plans — ask our team before you place the order",
        ]}
        actions={[
          {
            href: ROUTES.checkout,
            label: "Go to checkout",
            primary: true,
          },
          {
            href: ROUTES.cart,
            label: "View cart",
          },
          {
            href: `${ROUTES.contact}?subject=${encodeURIComponent("Payment plan enquiry")}`,
            label: "Ask about payment plans",
          },
        ]}
      />
    </main>
  );
}
