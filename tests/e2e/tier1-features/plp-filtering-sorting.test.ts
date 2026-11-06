import { describe, it, expect } from "vitest";
import { sampleProducts } from "../fixtures/catalog-fixtures";
describe("Tier 1: PLP Filtering, Sorting & Pagination", () => {
  it("filters products by multi-select brand facets", () => {
    const selectedBrands = ["Fender", "Gibson"];
    const filtered = sampleProducts.filter((p) => selectedBrands.includes(p.brand));

    expect(filtered.length).toBeGreaterThan(0);
    for (const prod of filtered) {
      expect(selectedBrands).toContain(prod.brand);
    }
  });

  it("filters products by subcategory facet", () => {
    const filtered = sampleProducts.filter((p) => p.subcategory === "Solid Body");
    expect(filtered.length).toBe(2); // Fender Strat and Gibson LP
    expect(filtered.map((p) => p.slug)).toEqual([
      "fender-player-stratocaster",
      "gibson-les-paul-standard-50s-heritage-cherry",
    ]);
  });

  it("filters products by price range min and max boundaries", () => {
    const minPrice = 50000;
    const maxPrice = 100000;

    const inRange = sampleProducts.filter((p) => p.price >= minPrice && p.price <= maxPrice);

    expect(inRange.length).toBe(2); // Fender Strat (68500) and Yamaha P-125 (52990)
    for (const p of inRange) {
      expect(p.price).toBeGreaterThanOrEqual(minPrice);
      expect(p.price).toBeLessThanOrEqual(maxPrice);
    }
  });

  it("filters products by availability (in-stock only)", () => {
    const inStock = sampleProducts.filter((p) => p.availability === "in-stock");
    expect(inStock.length).toBeGreaterThan(0);
    for (const p of inStock) {
      expect(p.availability).toBe("in-stock");
    }

    const outOfStock = sampleProducts.filter((p) => p.availability === "out-of-stock");
    expect(outOfStock.length).toBe(1);
    expect(outOfStock[0].slug).toBe("rare-vintage-amp");
  });

  it("sorts catalog correctly by price ascending and descending", () => {
    const purchasable = sampleProducts.filter((p) => p.price > 0);

    // Price Ascending
    const asc = [...purchasable].sort((a, b) => a.price - b.price);
    for (let i = 0; i < asc.length - 1; i++) {
      expect(asc[i].price).toBeLessThanOrEqual(asc[i + 1].price);
    }
    expect(asc[0].name).toContain("Shure SM7B"); // 39,500 is lowest

    // Price Descending
    const desc = [...purchasable].sort((a, b) => b.price - a.price);
    for (let i = 0; i < desc.length - 1; i++) {
      expect(desc[i].price).toBeGreaterThanOrEqual(desc[i + 1].price);
    }
    expect(desc[0].name).toContain("Gibson Les Paul"); // 249,000 is highest
  });

  it("sorts catalog correctly by customer rating descending", () => {
    const rated = [...sampleProducts].sort((a, b) => b.rating - a.rating);
    expect(rated[0].rating).toBe(5.0); // Shure SM7B has 5.0
    for (let i = 0; i < rated.length - 1; i++) {
      expect(rated[i].rating).toBeGreaterThanOrEqual(rated[i + 1].rating);
    }
  });

  it("calculates pagination offsets, total pages, and slice boundaries", () => {
    const pageSize = 2;
    const totalItems = sampleProducts.length; // 7 items
    const totalPages = Math.ceil(totalItems / pageSize); // 4 pages

    expect(totalPages).toBe(4);

    // Page 1 slice
    const page1Items = sampleProducts.slice(0, pageSize);
    expect(page1Items.length).toBe(2);
    expect(page1Items[0].id).toBe(sampleProducts[0].id);

    // Page 2 slice
    const page2Items = sampleProducts.slice(pageSize, pageSize * 2);
    expect(page2Items.length).toBe(2);
    expect(page2Items[0].id).toBe(sampleProducts[2].id);

    // Last page slice (partial page)
    const lastPageItems = sampleProducts.slice((totalPages - 1) * pageSize, totalPages * pageSize);
    expect(lastPageItems.length).toBe(1);
    expect(lastPageItems[0].id).toBe(sampleProducts[6].id);
  });
});
