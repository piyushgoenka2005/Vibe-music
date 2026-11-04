import { describe, expect, it } from "vitest";
import { buildProductMetadata } from "@/lib/seo/productMetadata";
import type { ProductDetail } from "@/types/product";

const product = {
  id: "prod-1",
  slug: "gibraltar-snare-stand",
  name: "Gibraltar Snare Stand",
  brand: "GIBRALTAR",
  brandSlug: "gibraltar",
  category: "Drums & Percussion",
  categorySlug: "drums-percussion",
  subcategory: "DRUM HARDWARE",
  price: 4999,
  imageColor: "#ccc",
  image: "https://cdn.vibemusic.in/products/snare.webp",
  images: [
    {
      id: "img-1",
      alt: "Snare stand",
      color: "#ccc",
      src: "https://cdn.vibemusic.in/products/snare.webp",
    },
  ],
  description: "Professional snare stand",
  availability: "in-stock",
  condition: "new",
  rating: 4.5,
  reviewCount: 3,
  sku: "GIB-001",
  msrp: null,
  salePrice: null,
  specs: [],
  inTheBox: [],
  videos: [],
  variants: [],
  reviews: [],
  qa: [],
  frequentlyBoughtTogether: [],
  similarProductIds: [],
  relatedProductIds: [],
} satisfies ProductDetail;

describe("buildProductMetadata", () => {
  it("sets product Open Graph extensions for Meta catalog previews", () => {
    const metadata = buildProductMetadata(product);
    expect(metadata.alternates?.canonical).toBe(
      "https://vibemusic.in/product/gibraltar-snare-stand",
    );
    expect(metadata.other?.["product:price:amount"]).toBe("4999");
    expect(metadata.other?.["product:brand"]).toBe("GIBRALTAR");
    expect(metadata.openGraph?.images?.[0]?.url).toContain("snare.webp");
  });

  it("truncates long raw description at word boundary without cutting mid-word", () => {
    const longDesc =
      "This is a premium acoustic guitar engineered with solid sitka spruce top and mahogany back and sides providing unmatched resonance and deep projection for stage performance.";
    const metadata = buildProductMetadata({
      ...product,
      description: longDesc,
      metaDescription: undefined,
    });
    expect(metadata.description?.length).toBeLessThanOrEqual(156);
    expect(metadata.description).not.toContain("performa…");
    expect(metadata.description?.endsWith("…")).toBe(true);
  });
});
