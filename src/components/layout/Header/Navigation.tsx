import Link from "next/link";
import { ChevronDown } from "lucide-react";
import { NAV_ITEMS } from "@/lib/constants";
import { ROUTES } from "@/lib/routes";

const NAV_HREFS: Record<string, string> = {
  "Shop By Category": ROUTES.search,
  "What's New": `${ROUTES.searchResults}?q=new`,
  Deals: `${ROUTES.searchResults}?q=deals`,
  "Used Gear": `${ROUTES.searchResults}?q=used`,
  Rentals: `${ROUTES.search}?q=rentals`,
  "Articles & Videos": `${ROUTES.search}?q=articles`,
  "Product Support": `${ROUTES.search}?q=support`,
  Giveaway: `${ROUTES.search}?q=giveaway`,
};

export default function Navigation() {
  return (
    <nav className="cat-nav">
      <div className="container">
        {NAV_ITEMS.map((item) => (
          <Link key={item} href={NAV_HREFS[item] ?? ROUTES.search}>
            {item}
            {item === "Shop By Category" ? (
              <ChevronDown size={10} strokeWidth={3} />
            ) : null}
          </Link>
        ))}
      </div>
    </nav>
  );
}
