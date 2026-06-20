import { Suspense } from "react";
import CheckoutPageContent from "@/components/checkout/CheckoutPageContent";

function CheckoutLoading() {
  return <p className="storefront-loading">Loading checkout…</p>;
}

export default function CheckoutPage() {
  return (
    <main className="storefront-page storefront-page--subtle">
      <Suspense fallback={<CheckoutLoading />}>
        <CheckoutPageContent />
      </Suspense>
    </main>
  );
}
