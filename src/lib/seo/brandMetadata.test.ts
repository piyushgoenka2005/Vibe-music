import { describe, expect, it } from "vitest";
import { buildBrandMetadata, resolveBrandOgImage } from "@/lib/seo/brandMetadata";
import type { BrandDirectoryGroup } from "@/types/brandDirectory";

const gibraltar: BrandDirectoryGroup = {
  id: "brand-gibraltar",
  name: "GIBRALTAR",
  slug: "gibraltar",
  productCount: 36,
  letter: "G",
  logoUrl: "/images/brands/gibraltar.png",
  products: [],
};

describe("brandMetadata", () => {
  it("builds canonical brand URLs and OG tags", () => {
    const metadata = buildBrandMetadata(gibraltar);
    expect(metadata.title).toBe("GIBRALTAR | Vibe Music");
    expect(metadata.alternates?.canonical).toBe("https://vibemusic.in/brands/gibraltar");
    expect(metadata.openGraph?.url).toBe("https://vibemusic.in/brands/gibraltar");
    expect(metadata.openGraph?.images?.[0]?.url).toContain("/images/brands/gibraltar.png");
  });

  it("resolves brand logo for social previews", () => {
    expect(resolveBrandOgImage(gibraltar)).toBe("https://vibemusic.in/images/brands/gibraltar.png");
  });
});
