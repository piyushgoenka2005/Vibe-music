import type { Metadata } from "next";
import { Suspense } from "react";
import GiveawayVerifyPage from "@/components/giveaway/GiveawayVerifyPage";
import "@/styles/storefront-pages.css";
import "@/styles/giveaway.css";

export const metadata: Metadata = {
  title: "Verify giveaway entry",
  description: "Verify your email for Vibe Music giveaway entry.",
};

export default function GiveawayVerifyRoute() {
  return (
    <Suspense fallback={<main className="storefront-page giveaway-page"><p>Loading…</p></main>}>
      <GiveawayVerifyPage />
    </Suspense>
  );
}
