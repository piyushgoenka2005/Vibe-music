import type { Metadata } from "next";
import { Suspense } from "react";
import CheckoutPageContent from "@/components/checkout/CheckoutPageContent";
import { BRAND } from "@/lib/brand";

export const metadata: Metadata = {
  title: `Checkout | ${BRAND.name}`,
  description: "Complete your order with secure online payment.",
  alternates: { canonical: "/checkout" },
  robots: { index: false, follow: false },
};

export default function CheckoutPage() {
  return (
    <main className="storefront-page storefront-page--subtle">
      <Suspense fallback={null}>
        <CheckoutPageContent />
      </Suspense>
    </main>
  );
}
