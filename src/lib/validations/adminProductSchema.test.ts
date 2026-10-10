import { describe, expect, it } from "vitest";
import { ADMIN_PRODUCT_SKU_MAX_LENGTH, adminProductSchema } from "@/lib/validations/admin";

describe("adminProductSchema", () => {
  it("accepts long SKUs and guitar showcase spec values", () => {
    const parsed = adminProductSchema.partial().parse({
      sku: "HZ STMP-X (Mint Green Finish)",
      guitarSpecs: {
        Controls: "1 Volume, 1 Tone, Coil-Split",
        "Tuners & Hardware": "Locking Tuners, Chrome",
        Bridge: "Floyd Rose / Tremolo",
      },
      metaTitle: "Optional SEO title",
      metaDescription: "Optional SEO description",
    });

    expect(parsed.sku).toBe("HZ STMP-X (Mint Green Finish)");
    expect(parsed.guitarSpecs?.Controls).toContain("Coil-Split");
  });

  it("rejects SKUs over the configured max length", () => {
    const tooLong = "x".repeat(ADMIN_PRODUCT_SKU_MAX_LENGTH + 1);
    const result = adminProductSchema.partial().safeParse({ sku: tooLong });
    expect(result.success).toBe(false);
  });
});
