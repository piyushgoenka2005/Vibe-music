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
          price: 12000,
          href: "/product/adeon-studio-monitor",
          image: "/images/test.jpg",
        }}
      />,
    );
    expect(html).toContain("homepage-deals-card__img");
    expect(html).toMatch(/sizes="\(max-width: 767px\) 46vw, 280px"/);
  });
});
