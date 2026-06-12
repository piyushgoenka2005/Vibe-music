import HtmlSection from "@/components/vibe/HtmlSection";
import CheckoutPageContent from "@/components/checkout/CheckoutPageContent";

export default function CheckoutPage() {
  return (
    <>
      <HtmlSection file="header" />
      <main className="homepage-wrapper" id="main-content">
        <CheckoutPageContent />
      </main>
      <HtmlSection file="footer" />
    </>
  );
}
