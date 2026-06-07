import HtmlSection from "@/components/vibe/HtmlSection";
import CartPage from "@/components/cart/CartPage";

export default function CartRoute() {
  return (
    <>
      <HtmlSection file="header" />
      <main className="homepage-wrapper" id="main-content">
        <CartPage />
      </main>
      <HtmlSection file="footer" />
    </>
  );
}