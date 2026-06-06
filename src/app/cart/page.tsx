import HtmlSection from "@/components/sweetwater/HtmlSection";
import CartPage from "@/components/cart/CartPage";

export default function CartRoute() {
  return (
    <>
      <main className="homepage-wrapper" id="main-content">
        <CartPage />
      </main>
      <HtmlSection file="footer" />
    </>
  );
}