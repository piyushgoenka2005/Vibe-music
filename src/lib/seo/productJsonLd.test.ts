import { describe, expect, it } from "vitest";
import { buildProductJsonLd, buildBreadcrumbListJsonLd } from "@/lib/seo/productJsonLd";
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

  it("emits BreadcrumbList schema with positional items", () => {
    const items = [
      { label: "Home", href: "/" },
      { label: "Cables", href: "/category/cables" },
      { label: "Instrument Cables", href: "/category/cables?subcat=instrument-cables" },
      { label: "HZ CBL12" },
    ];
    const json = buildBreadcrumbListJsonLd(items);
    expect(json["@type"]).toBe("BreadcrumbList");
    const elements = json.itemListElement as Array<{
      position: number;
      name: string;
      item: string;
    }>;
    expect(elements).toHaveLength(3);
    expect(elements[0].name).toBe("Home");
    expect(elements[0].position).toBe(1);
    expect(elements[1].name).toBe("Cables");
    expect(elements[1].position).toBe(2);
    expect(elements[2].name).toBe("Instrument Cables");
    expect(elements[2].position).toBe(3);
  });
});
