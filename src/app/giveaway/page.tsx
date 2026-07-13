import type { Metadata } from "next";
import ProgramLandingPage from "@/components/programs/ProgramLandingPage";
import { ROUTES } from "@/lib/routes";
import "@/styles/storefront-pages.css";
import "@/styles/program-landing.css";

export const metadata: Metadata = {
  title: "Promotions & Giveaways",
  description:
    "Current Vibe Music promotions and contests. When no giveaway is active, browse deals and new arrivals instead.",
};

export default function GiveawayPage() {
  return (
    <main className="storefront-page storefront-page--subtle">
      <ProgramLandingPage
        eyebrow="Promotions"
        title="Giveaways & contests"
        subtitle="We run occasional gear giveaways and partner promotions. There is no active contest entry form on the site right now."
        statusNote="No live giveaway is open for entries. Past campaign creatives on the homepage may still appear while we refresh assets — they do not mean a contest is running."
        highlights={[
          "When a giveaway launches, entry rules and deadlines will be published here",
          "Until then, shop current deals and in-stock gear at catalog prices",
          "Contact us if a partner promo code or store contest brought you here",
        ]}
        actions={[
          {
            href: ROUTES.deals,
            label: "Browse deals",
            primary: true,
          },
          {
            href: ROUTES.search,
            label: "Shop the catalog",
          },
          {
            href: `${ROUTES.contact}?subject=${encodeURIComponent("Giveaway / promo enquiry")}`,
            label: "Ask about promotions",
          },
        ]}
      />
    </main>
  );
}
