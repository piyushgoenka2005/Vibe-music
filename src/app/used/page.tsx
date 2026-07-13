import type { Metadata } from "next";
import ProgramLandingPage from "@/components/programs/ProgramLandingPage";
import { ROUTES, categoryPath } from "@/lib/routes";
import "@/styles/storefront-pages.css";
import "@/styles/program-landing.css";

export const metadata: Metadata = {
  title: "Used & Open-Box Gear",
  description:
    "Inspected used and open-box instruments from Vibe Music. Browse current stock or enquire about upcoming arrivals.",
};

export default function UsedGearPage() {
  return (
    <main className="storefront-page storefront-page--subtle">
      <ProgramLandingPage
        eyebrow="Programs"
        title="Used & open-box gear"
        subtitle="Quality-checked instruments and pro audio for players who want more value without gambling on condition."
        statusNote="Used and open-box inventory is limited and changes often. We do not list placeholder “used” search results when nothing is in stock — enquire or browse new gear below."
        highlights={[
          "Every piece is inspected by Vibe Music before it ships",
          "Clear condition notes when a listing goes live",
          "Same returns window as new gear where the listing allows",
          "Ask us about trade-ins and upcoming open-box arrivals",
        ]}
        actions={[
          {
            href: `${ROUTES.contact}?subject=${encodeURIComponent("Used / open-box enquiry")}`,
            label: "Enquire about used gear",
            primary: true,
          },
          {
            href: categoryPath("guitars"),
            label: "Browse guitars",
          },
          {
            href: ROUTES.deals,
            label: "View deals",
          },
          {
            href: ROUTES.search,
            label: "Search the catalog",
          },
        ]}
      />
    </main>
  );
}
