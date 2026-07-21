import { describe, expect, it } from "vitest";
import {
  canListingQuickAdd,
  listingQuickAddAriaLabel,
  listingQuickAddLabel,
  shouldNavigateForVariants,
} from "@/lib/product/listingQuickAdd";

describe("listingQuickAdd", () => {
  it("allows quick add for in-stock purchasable singles", () => {
    expect(
      canListingQuickAdd({ availability: "in-stock", price: 1200 })
    ).toBe(true);
    expect(shouldNavigateForVariants({ requiresVariantSelection: false })).toBe(
      false
    );
    expect(
      listingQuickAddLabel({
        availability: "in-stock",
        price: 1200,
        requiresVariantSelection: false,
      })
    ).toBe("Add to cart");
  });

  it("routes multi-variant products to PDP", () => {
    expect(
      shouldNavigateForVariants({ requiresVariantSelection: true })
    ).toBe(true);
    expect(
      listingQuickAddLabel({
        availability: "in-stock",
        price: 1200,
        requiresVariantSelection: true,
      })
    ).toBe("Choose options");
    expect(
      listingQuickAddAriaLabel({
        name: "Strat",
        requiresVariantSelection: true,
      })
    ).toBe("Choose options for Strat");
  });

  it("blocks quick add for out of stock or enquiry pricing", () => {
    expect(
      canListingQuickAdd({ availability: "out-of-stock", price: 1200 })
    ).toBe(false);
    expect(canListingQuickAdd({ availability: "in-stock", price: 0 })).toBe(
      false
    );
    expect(
      listingQuickAddLabel({
        availability: "out-of-stock",
        price: 1200,
        requiresVariantSelection: false,
      })
    ).toBe("Out of stock");
  });
});
