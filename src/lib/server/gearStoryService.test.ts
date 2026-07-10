import { describe, expect, it } from "vitest";
import { buildStaticGearStories } from "@/lib/server/gearStoryService";

describe("gearStoryService", () => {
  it("marks missing catalog products as out-of-stock placeholders", async () => {
    const section = await buildStaticGearStories(
      Array.from({ length: 6 }, () => undefined)
    );

    expect(section.stories.length).toBeGreaterThan(0);
    for (const story of section.stories) {
      expect(story.price).toBe(0);
      expect(story.availability).toBe("out-of-stock");
    }
  });

  it("uses live catalog pricing when products are active", async () => {
    const section = await buildStaticGearStories([
      {
        id: "seed-product-1",
        slug: "test-guitar",
        name: "Test Guitar",
        brand: "Fender",
        brandSlug: "fender",
        category: "guitars",
        categorySlug: "guitars",
        subcategory: "",
        price: 24999,
        originalPrice: 29999,
        discountPercentage: 17,
        rating: 4.5,
        reviewCount: 12,
        stock: 5,
        sku: "TEST-001",
        status: "active",
        featured: false,
        trending: false,
        newArrival: false,
        availability: "in-stock",
        condition: "new",
        description: "Test product",
        image: "/images/guitar-1.webp",
        images: ["/images/guitar-1.webp"],
        imageColor: "#eee",
        specifications: {},
        createdAt: "2026-01-01T00:00:00.000Z",
        updatedAt: "2026-01-01T00:00:00.000Z",
        detail: undefined,
      },
    ]);

    const linked = section.stories[0];
    expect(linked.price).toBe(24999);
    expect(linked.availability).toBe("in-stock");
  });
});
