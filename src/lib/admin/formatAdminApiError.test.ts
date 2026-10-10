import { describe, expect, it } from "vitest";
import { formatAdminApiError } from "@/lib/admin/formatAdminApiError";

describe("formatAdminApiError", () => {
  it("joins Zod issue paths", () => {
    expect(
      formatAdminApiError({
        error: "Too big",
        issues: [{ path: "sku", message: "Too big: expected string to have <=20 characters" }],
      }),
    ).toBe("sku: Too big: expected string to have <=20 characters");
  });

  it("falls back to error string", () => {
    expect(formatAdminApiError({ error: "Product not found" })).toBe("Product not found");
  });
});
