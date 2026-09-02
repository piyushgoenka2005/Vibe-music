import type { Metadata } from "next";
import { Suspense } from "react";
import CheckoutSuccessContent from "@/components/checkout/CheckoutSuccessContent";
import { BRAND } from "@/lib/brand";

export const metadata: Metadata = {
  title: `Order Confirmed | ${BRAND.name}`,
  description: "Your order has been placed successfully. Thank you for shopping with us.",
  robots: { index: false, follow: false },
};

export default function CheckoutSuccessPage() {
  return (
    <main className="storefront-page storefront-page--subtle">
      <Suspense fallback={<p className="storefront-loading">Loading...</p>}>
        <CheckoutSuccessContent />
      </Suspense>
    </main>
  );
}
