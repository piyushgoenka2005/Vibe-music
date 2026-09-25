import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import DealProductCard from "@/components/homepage/DealProductCard";

describe("DealProductCard (L-12)", () => {
  it("renders HomepageProductImage with responsive sizes", () => {
    const html = renderToStaticMarkup(
      <DealProductCard
        slotPosition={1}
        item={{
          id: "p1",
          name: "Studio Monitor",
          brand: "Adeon",
          slug: "adeon-studio-monitor",
          price: 12000,
          href: "/product/adeon-studio-monitor",
          image: "/images/test.jpg",
          imageAlt: "Adeon studio monitor",
          rating: 4.5,
          reviewCount: 12,
        }}
      />,
    );
    expect(html).toContain("homepage-deals-card__img");
    expect(html).toMatch(/sizes="\(max-width: 767px\) 46vw, 280px"/);
  });
});
