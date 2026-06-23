import "@/components/checkout/checkout.css";

export default function CheckoutLoading() {
  return (
    <main className="storefront-page storefront-page--subtle" aria-busy="true">
      <div className="checkout-page">
        <div className="checkout-skeleton checkout-skeleton--title" />
        <div className="checkout-grid">
          <div className="checkout-panel">
            <div className="checkout-skeleton checkout-skeleton--line" />
            <div className="checkout-skeleton checkout-skeleton--field" />
            <div className="checkout-skeleton checkout-skeleton--field" />
            <div className="checkout-skeleton checkout-skeleton--field" />
          </div>
          <aside className="checkout-summary">
            <div className="checkout-skeleton checkout-skeleton--line" />
            <div className="checkout-skeleton checkout-skeleton--line" />
            <div className="checkout-skeleton checkout-skeleton--total" />
          </aside>
        </div>
      </div>
    </main>
  );
}
