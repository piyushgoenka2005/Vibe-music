import HtmlSection from "@/components/sweetwater/HtmlSection";

export default function CheckoutPage() {
  return (
    <>
      <HtmlSection file="header" />
      <main className="homepage-wrapper" id="main-content">
        <section className="personalization-widgets">
          <h2 className="personalization-widgets__greeting">Checkout</h2>
        </section>
      </main>
      <HtmlSection file="footer" />
    </>
  );
}
