import { Suspense } from "react";
import HtmlSection from "@/components/vibe/HtmlSection";
import CheckoutSuccessContent from "@/components/checkout/CheckoutSuccessContent";

export default function CheckoutSuccessPage() {
  return (
    <>
      <HtmlSection file="header" />
      <main className="homepage-wrapper" id="main-content">
        <Suspense fallback={<p style={{ padding: 24 }}>Loading...</p>}>
          <CheckoutSuccessContent />
        </Suspense>
      </main>
      <HtmlSection file="footer" />
    </>
  );
}
