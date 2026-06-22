import { Suspense } from "react";
import CheckoutPageContent from "@/components/checkout/CheckoutPageContent";

export default function CheckoutPage() {
  return (
    <main className="storefront-page storefront-page--subtle">
      <Suspense fallback={null}>
        <CheckoutPageContent />
      </Suspense>
    </main>
  );
}
