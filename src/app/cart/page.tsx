import type { Metadata } from "next";
import CartPage from "@/components/cart/CartPage";
import { BRAND } from "@/lib/brand";

export const metadata: Metadata = {
  title: `Cart | ${BRAND.name}`,
  description: "Review items in your cart before checkout.",
  alternates: { canonical: "/cart" },
  robots: { index: false, follow: true },
};

export default function CartRoute() {
  return (
    <main className="storefront-page">
      <CartPage />
    </main>
  );
}
