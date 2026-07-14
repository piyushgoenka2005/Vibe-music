import type { Metadata } from "next";
import { Suspense } from "react";
import GiveawaySuccessPage from "@/components/giveaway/GiveawaySuccessPage";
import "@/styles/storefront-pages.css";
import "@/styles/giveaway.css";

export const metadata: Metadata = {
  title: "Giveaway entry confirmed",
  description: "Your giveaway entry was submitted successfully.",
};

export default function GiveawaySuccessRoute() {
  return (
    <Suspense fallback={<main className="storefront-page giveaway-page"><p>Loading…</p></main>}>
      <GiveawaySuccessPage />
    </Suspense>
  );
}
