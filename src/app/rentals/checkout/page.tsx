import type { Metadata } from "next";
import { Suspense } from "react";
import RentalCheckoutPageClient from "@/components/rentals/RentalCheckoutPageClient";
import "@/styles/rentals.css";

export const metadata: Metadata = {
  title: "Rental Checkout",
  description: "Complete your instrument rental booking at Vibe Music.",
};

export default function RentalCheckoutRoute() {
  return (
    <Suspense fallback={<main className="storefront-page rentals-page"><p>Loading checkout…</p></main>}>
      <RentalCheckoutPageClient />
    </Suspense>
  );
}
