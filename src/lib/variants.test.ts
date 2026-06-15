import { describe, expect, it } from "vitest";
import {
  buildVariantLabel,
  findVariantBySelection,
  generateVariantSku,
  normalizeVariants,
} from "@/lib/variants";

describe("variants", () => {
  it("builds labels from attributes", () => {
    expect(
      buildVariantLabel([
        { type: "color", name: "Color", value: "Sunburst" },
        { type: "size", name: "Size", value: "Large" },
      ])
    ).toBe("Sunburst / Large");
  });

  it("auto-generates unique variant SKUs", () => {
    const existing = new Set(["VM-00001", "VM-00001-SUN"]);
    const sku = generateVariantSku(
      "VM-00001",
      [{ type: "color", name: "Color", value: "Sunburst" }],
      existing
    );
    expect(sku).toBe("VM-00001-SUNBURST");
  });

  it("finds variants by attribute selection", () => {
    const variants = normalizeVariants(
      [
        {
          id: "var-1",
          attributes: [
            { type: "color", name: "Color", value: "Black" },
            { type: "size", name: "Size", value: "M" },
          ],
          price: 1000,
          stock: 5,
        },
        {
          id: "var-2",
          attributes: [
            { type: "color", name: "Color", value: "White" },
            { type: "size", name: "Size", value: "L" },
          ],
          price: 1100,
          stock: 2,
        },
      ],
      "VM-00002",
      1000,
      10
    );

    const match = findVariantBySelection(variants, {
      "color:Color": "White",
      "size:Size": "L",
    });

    expect(match?.id).toBe("var-2");
    expect(match?.price).toBe(1100);
  });
});
