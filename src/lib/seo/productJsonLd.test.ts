import { describe, expect, it } from "vitest";
import { buildProductJsonLd } from "@/lib/seo/productJsonLd";
import type { ProductDetail } from "@/types/product";

const sample = {
  id: "p1",
  slug: "test-guitar",
  name: "Test Guitar",
  brand: "Vibe",
  brandSlug: "vibe",
  category: "Guitars",
  categorySlug: "guitars",
  price: 25000,
  rating: 4.5,
  reviewCount: 12,
  availability: "in-stock",
  condition: "new",
  imageColor: "#ccc",
  image: "/images/guitar-1.webp",
  description: "A solid test instrument.",
  images: [{ id: "1", alt: "Test", color: "#ccc", src: "/images/guitar-1.webp" }],
  variants: [],
} as unknown as ProductDetail;

describe("buildProductJsonLd", () => {
  it("emits Product + Offer schema", () => {
    const json = buildProductJsonLd(sample);
    expect(json["@type"]).toBe("Product");
    expect(json.name).toBe("Test Guitar");
    expect((json.offers as { priceCurrency: string }).priceCurrency).toBe("INR");
    expect((json.offers as { price: number }).price).toBe(25000);
    expect(json.aggregateRating).toBeTruthy();
  });
});
