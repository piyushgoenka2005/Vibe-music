import type { Metadata } from "next";
import GiveawayHubPage from "@/components/giveaway/GiveawayHubPage";
import "@/styles/storefront-pages.css";
import "@/styles/giveaway.css";

export const metadata: Metadata = {
  title: "Promotions & Giveaways",
  description:
    "Enter live Vibe Music gear giveaways. Refer friends and share on social for bonus entries.",
};

export default function GiveawayPage() {
  return <GiveawayHubPage />;
}
