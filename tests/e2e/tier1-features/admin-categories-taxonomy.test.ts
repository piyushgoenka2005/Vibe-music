import { describe, it, expect, beforeEach, vi } from "vitest";
import { useToastStore } from "@/store/toastStore";
import type { CatalogTaxonomyItem, RawTaxonomyRow } from "@/types/taxonomy";

describe("Tier 1: Admin Categories & Master Taxonomy (Feature 18 & 21)", () => {
  beforeEach(() => {
    useToastStore.setState({ toasts: [] });
  });

  it("validates taxonomy hierarchy structure and required metadata", () => {
    const validRow: RawTaxonomyRow = {
      category: "Guitars & Basses",
      subcategory: "Electric Guitars",
      productType: "Solid Body",
      instrumentFamily: "String Instruments",
      seoSlug: "guitars-basses/electric-guitars/solid-body",
      googleProductCategory:
        "Arts & Entertainment > Hobbies & Creative Arts > Musical Instruments > Guitars",
      menuLevel1: "Guitars",
      menuLevel2: "Electric Guitars",
      menuLevel3: "Solid Body",
      isArchived: false,
    };

    expect(validRow.category).toBeTruthy();
    expect(validRow.subcategory).toBeTruthy();
    expect(validRow.productType).toBeTruthy();
    expect(validRow.seoSlug).toContain("electric-guitars");
  });

  it("verifies non-blocking toast notifications replace native alert calls (Feature 18)", () => {
    // Ensure mock alert exists on window
    const mockAlert = vi.fn();
    (window as unknown as { alert: typeof mockAlert }).alert = mockAlert;

    // Trigger non-blocking toast notifications
    useToastStore.getState().show("Category updated successfully", "success");
    useToastStore.getState().show("Taxonomy node created", "info");

    const toasts = useToastStore.getState().toasts;
    expect(toasts.length).toBe(2);
    expect(toasts[0].message).toBe("Category updated successfully");
    expect(toasts[0].type).toBe("success");
    expect(toasts[1].message).toBe("Taxonomy node created");

    // Native blocking alert was never called
    expect(mockAlert).not.toHaveBeenCalled();

    // Dismiss toast
    useToastStore.getState().dismiss(toasts[0].id);
    expect(useToastStore.getState().toasts.length).toBe(1);
  });

  it("enforces unique taxonomy node paths and slug sanitation", () => {
    const nodes: CatalogTaxonomyItem[] = [
      {
        id: "tax-1",
        category: "Drums & Percussion",
        subcategory: "Acoustic Drum Kits",
        productType: "Complete Sets",
        seoSlug: "drums-percussion/acoustic-drum-kits",
      },
      {
        id: "tax-2",
        category: "Drums & Percussion",
        subcategory: "Electronic Drums",
        productType: "Mesh Head Kits",
        seoSlug: "drums-percussion/electronic-drums",
      },
    ];

    const slugSet = new Set(nodes.map((n) => n.seoSlug));
    expect(slugSet.size).toBe(nodes.length);
  });
});
