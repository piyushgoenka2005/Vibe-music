import type { Metadata } from "next";
import ProgramLandingPage from "@/components/programs/ProgramLandingPage";
import { WHY_SHOP_SECURE_PAYMENTS_SUBTITLE } from "@/data/trustSignals";
import { ROUTES } from "@/lib/routes";
import "@/styles/storefront-pages.css";
import "@/styles/program-landing.css";

export const metadata: Metadata = {
  title: "Payment Options",
  description:
    "Pay securely on Vibe Music with Razorpay — UPI, cards, net banking, and wallets. EMI enquiries welcome.",
};

export default function FinancingPage() {
  return (
    <main className="storefront-page storefront-page--subtle">
      <ProgramLandingPage
        eyebrow="Checkout"
        title="Payment options"
        subtitle="Checkout on vibemusic.in is powered by Razorpay — the same secure gateway trusted by leading Indian retailers."
        statusNote="The legacy Vibe Music Card financing program has been retired. Pay online at checkout, or contact us for bulk, institutional, or EMI options on select orders."
        highlights={[
          WHY_SHOP_SECURE_PAYMENTS_SUBTITLE,
          "Live Razorpay checkout with instant payment confirmation",
          "Order tracking and invoices emailed after payment",
          "GST-compliant invoices for business buyers",
          "Gear advisors can quote custom payment plans for large carts — just ask",
        ]}
        actions={[
          {
            href: ROUTES.checkout,
            label: "Go to checkout",
            primary: true,
          },
          {
            href: `${ROUTES.contact}?subject=${encodeURIComponent("EMI / bulk payment enquiry")}`,
            label: "Ask about EMI or bulk billing",
          },
          {
            href: ROUTES.page("terms"),
            label: "Terms & conditions",
          },
        ]}
      />
    </main>
  );
}
