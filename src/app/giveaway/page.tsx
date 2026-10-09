import type { Metadata } from "next";
import GiveawayContestRulesSection from "@/components/giveaway/GiveawayContestRulesSection";
import GiveawayHubPage from "@/components/giveaway/GiveawayHubPage";
import "@/styles/storefront-pages.css";
import "@/styles/giveaway.css";

export const metadata: Metadata = {
  title: "Promotions & Giveaways",
  description:
    "Enter live Vibe Music gear giveaways. Refer friends and share on social for bonus entries.",
};

export default function GiveawayPage() {
  return (
    <main className="storefront-page giveaway-page">
      <header className="giveaway-hero">
        <p className="rentals-hero__eyebrow">Promotions</p>
        <h1 className="rentals-hero__title">Giveaways & contests</h1>
        <p className="rentals-hero__subtitle">
          Enter live gear giveaways, earn bonus entries with referrals and social shares, and track
          your entries from your account.
        </p>
      </header>
      <GiveawayContestRulesSection />
      <GiveawayHubPage />
    </main>
  );
}
