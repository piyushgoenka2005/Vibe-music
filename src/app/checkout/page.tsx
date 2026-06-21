import dynamic from "next/dynamic";
import { Suspense } from "react";

const CheckoutPageContent = dynamic(
  () => import("@/components/checkout/CheckoutPageContent"),
  { loading: () => <p className="storefront-loading">Loading checkout…</p> }
);

export default function CheckoutPage() {
  return (
    <main className="storefront-page storefront-page--subtle">
      <Suspense fallback={<p className="storefront-loading">Loading checkout…</p>}>
        <CheckoutPageContent />
      </Suspense>
    </main>
  );
}
