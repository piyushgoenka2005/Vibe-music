import type { Metadata } from "next";
import Link from "next/link";
import HtmlSection from "@/components/sweetwater/HtmlSection";
import CheckoutPageContent from "@/components/checkout/CheckoutPageContent";
import { ROUTES } from "@/lib/routes";
import { pageTitle } from "@/lib/site";
import "@/components/checkout/checkout.css";

export const metadata: Metadata = {
  title: pageTitle("Checkout"),
};

interface CheckoutPageProps {
  searchParams: Promise<{ success?: string }>;
}

export default async function CheckoutPage({ searchParams }: CheckoutPageProps) {
  const params = await searchParams;
  const successId = params.success;

  return (
    <>
      <main className="homepage-wrapper" id="main-content">
        {successId ? (
          <section className="checkout-success">
            <h1>Order confirmed</h1>
            <p>Thank you! Your order #{successId} has been placed.</p>
            <div style={{ display: "flex", gap: 12, justifyContent: "center", marginTop: 24 }}>
              <Link href={ROUTES.accountOrders} className="sw-btn sw-btn-blue">
                View orders
              </Link>
              <Link href={ROUTES.tracking} className="sw-btn">
                Track order
              </Link>
            </div>
          </section>
        ) : (
          <CheckoutPageContent />
        )}
      </main>
      <HtmlSection file="footer" />
    </>
  );
}
