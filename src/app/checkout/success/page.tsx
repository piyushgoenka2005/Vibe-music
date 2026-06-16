import { Suspense } from "react";
import CheckoutSuccessContent from "@/components/checkout/CheckoutSuccessContent";

export default function CheckoutSuccessPage() {
  return (
    <main className="storefront-page storefront-page--subtle" id="main-content">
      <Suspense fallback={<p className="storefront-loading">Loading...</p>}>
        <CheckoutSuccessContent />
      </Suspense>
    </main>
  );
}
