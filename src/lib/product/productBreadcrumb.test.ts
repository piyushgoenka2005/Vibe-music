import { describe, expect, it } from "vitest";
import { buildProductBreadcrumb, formatSubcategoryLabel } from "@/lib/product/productBreadcrumb";

describe("buildProductBreadcrumb", () => {
  it("builds Home / Category / Subcategory / Product", () => {
    const items = buildProductBreadcrumb({
      name: "AVUS Linage 5B Hickory Drumsticks - Natural",
      category: "Drums & Percussion",
      categorySlug: "drums-percussion",
      subcategory: "Drum Stick",
    });
    expect(items).toEqual([
      { label: "Home", href: "/" },
      { label: "Drums & Percussion", href: "/category/drums-percussion" },
      { label: "Drum Stick", href: "/category/drums-percussion?subcat=drum-stick" },
      { label: "AVUS Linage 5B Hickory Drumsticks - Natural" },
    ]);
  });

  it("links the subcategory to the slug the category filter matches on", () => {
    const items = buildProductBreadcrumb({
      name: "AVUS NEO GOLD Drumsticks",
      category: "Drums & Percussion",
      categorySlug: "drums-percussion",
      subcategory: "Drumsticks / Designer Drumsticks / Professional Percussion Sticks",
    });
    expect(items[2]).toEqual({
      label: "Drumsticks",
      href: "/category/drums-percussion?subcat=drumsticks-designer-drumsticks-professional-percussion-sticks",
    });
  });

  it("falls back when admin data is missing the category slug or subcategory", () => {
    const items = buildProductBreadcrumb({
      name: "Nord Stage 4",
      category: "Keyboards & Synthesizers",
      categorySlug: "",
      subcategory: "",
    });
    expect(items).toEqual([
      { label: "Home", href: "/" },
      { label: "Keyboards & Synthesizers", href: "/category/keyboards-synthesizers" },
      { label: "Nord Stage 4" },
    ]);
  });

  it("derives the category label from the slug when the name is empty", () => {
    const items = buildProductBreadcrumb({
      name: "Mixer",
      category: "",
      categorySlug: "dj-equipment",
      subcategory: "Audio Mixer",
    });
    expect(items[1]).toEqual({ label: "Dj Equipment", href: "/category/dj-equipment" });
  });
});

describe("formatSubcategoryLabel", () => {
  it("title-cases all-caps values", () => {
    expect(formatSubcategoryLabel("GUITAR AMPLIFIER")).toBe("Guitar Amplifier");
  });

  it("keeps mixed-case values as entered", () => {
    expect(formatSubcategoryLabel("Stage Piano")).toBe("Stage Piano");
  });
});
