import type { Metadata } from "next";
import Link from "next/link";
import ProductCard from "@/components/common/ProductCard";
import ProgramLandingPage from "@/components/programs/ProgramLandingPage";
import StorefrontBackButton from "@/components/layout/StorefrontBackButton";
import { searchProducts } from "@/lib/server/productRepository";
import { withServerPageError } from "@/lib/serverPageError";
import { ROUTES, categoryPath } from "@/lib/routes";
import "@/styles/storefront-pages.css";
import "@/styles/program-landing.css";
import "@/components/category/category.css";

export const metadata: Metadata = {
  title: "Used & Open-Box Gear",
  description:
    "Inspected used and open-box instruments from Vibe Music. Browse current stock or enquire about upcoming arrivals.",
};

export const dynamic = "force-dynamic";

export default async function UsedGearPage() {
  return withServerPageError(async () => {
    const products = await searchProducts({
      conditions: ["used", "open-box"],
    });

    if (products.length === 0) {
      return (
        <main className="storefront-page storefront-page--subtle">
          <ProgramLandingPage
            eyebrow="Programs"
            title="Used & open-box gear"
            subtitle="Quality-checked instruments and pro audio for players who want more value without gambling on condition."
            statusNote="No used or open-box SKUs are listed right now. We do not invent placeholder “used” search results — enquire below or browse new gear."
            highlights={[
              "Every piece is inspected by Vibe Music before it ships",
              "Clear condition notes when a listing goes live",
              "Same returns window as new gear where the listing allows",
              "Ask us about trade-ins and upcoming open-box arrivals",
              "Admins can list stock with condition Used or Open box — it appears here automatically",
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

    return (
      <main className="storefront-page storefront-page--subtle used-gear-page">
        <div className="storefront-page__inner used-gear-page__inner">
          <header className="storefront-page__header">
            <StorefrontBackButton />
            <p className="storefront-page__eyebrow">Programs</p>
            <h1 className="storefront-page__title">Used &amp; open-box gear</h1>
            <p className="storefront-page__subtitle">
              {products.length} inspected listing{products.length === 1 ? "" : "s"} ready to browse.
              Condition is shown on each card.
            </p>
            <p className="storefront-page__meta">
              Looking for something else?{" "}
              <Link
                href={`${ROUTES.contact}?subject=${encodeURIComponent("Used / open-box enquiry")}`}
              >
                Enquire about upcoming arrivals
              </Link>
              .
            </p>
          </header>

          <div className="used-gear-page__grid" role="list">
            {products.map((product, index) => (
              <div key={product.id} role="listitem" className="used-gear-page__grid-item">
                <ProductCard product={product} view="grid" eager={index < 4} />
              </div>
            ))}
          </div>
        </div>
      </main>
    );
  }, "Used Gear");
}
