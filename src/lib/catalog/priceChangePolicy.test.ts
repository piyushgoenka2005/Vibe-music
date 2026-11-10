import { describe, expect, it } from "vitest";
import { evaluatePriceChangeGuard } from "./priceChangePolicy";

describe("evaluatePriceChangeGuard", () => {
  it("allows modest price updates", () => {
    expect(
      evaluatePriceChangeGuard({
        sku: "VM-1",
        previousPrice: 10_000,
        nextPrice: 9_500,
        mrp: 12_000,
      }).allowed,
    ).toBe(true);
  });

  it("blocks extreme discounts", () => {
    const result = evaluatePriceChangeGuard({
      sku: "VM-1",
      previousPrice: 80_000,
      nextPrice: 37_000,
      mrp: 95_000,
    });
    expect(result.allowed).toBe(false);
    if (!result.allowed) {
      expect(result.requiresApproval).toBe(true);
    }
  });

  it("can be bypassed for emergency ops", () => {
    expect(
      evaluatePriceChangeGuard(
        {
          sku: "VM-1",
          previousPrice: 80_000,
          nextPrice: 37_000,
          mrp: 95_000,
        },
        { allowLargeChanges: true },
      ).allowed,
    ).toBe(true);
  });

  it("allows super_admin and admin to make large changes without manager approval", () => {
    expect(
      evaluatePriceChangeGuard(
        {
          sku: "VM-1",
          previousPrice: 80_000,
          nextPrice: 37_000, // > 60% discount
          mrp: 95_000,
        },
        { role: "super_admin" },
      ).allowed,
    ).toBe(true);

    expect(
      evaluatePriceChangeGuard(
        {
          sku: "VM-1",
          previousPrice: 80_000,
          nextPrice: 37_000,
          mrp: 95_000,
        },
        { role: "admin" },
      ).allowed,
    ).toBe(true);
  });

  it("allows privileged admins to set price to 0 for Coming Soon products", () => {
    expect(
      evaluatePriceChangeGuard(
        {
          sku: "VM-1",
          previousPrice: 10_000,
          nextPrice: 0,
          mrp: 12_000,
        },
        { role: "admin" },
      ).allowed,
    ).toBe(true);

    expect(
      evaluatePriceChangeGuard(
        {
          sku: "VM-1",
          previousPrice: 10_000,
          nextPrice: 0,
          mrp: 12_000,
        },
        { role: "super_admin" },
      ).allowed,
    ).toBe(true);
  });

  it("rejects negative prices even for privileged admins", () => {
    const result = evaluatePriceChangeGuard(
      {
        sku: "VM-1",
        previousPrice: 10_000,
        nextPrice: -500,
        mrp: 12_000,
      },
      { role: "admin" },
    );
    expect(result.allowed).toBe(false);
    if (!result.allowed) {
      expect(result.reason).toContain("non-negative");
    }
  });

  it("rejects negative MRP even for privileged admins", () => {
    const result = evaluatePriceChangeGuard(
      {
        sku: "VM-1",
        previousPrice: 10_000,
        nextPrice: 9_000,
        mrp: -500,
      },
      { role: "admin" },
    );
    expect(result.allowed).toBe(false);
    if (!result.allowed) {
      expect(result.reason).toContain("MRP must be a non-negative number.");
    }
  });

  it("rejects sale price exceeding MRP even for privileged admins", () => {
    const result = evaluatePriceChangeGuard(
      {
        sku: "VM-1",
        previousPrice: 10_000,
        nextPrice: 15_000,
        mrp: 12_000,
      },
      { role: "admin" },
    );
    expect(result.allowed).toBe(false);
    if (!result.allowed) {
      expect(result.reason).toContain("Sale price cannot exceed MRP.");
    }
  });

  it("requires manager approval for 0 price when unprivileged", () => {
    const result = evaluatePriceChangeGuard({
      sku: "VM-1",
      previousPrice: 10_000,
      nextPrice: 0,
      mrp: 12_000,
    });
    expect(result.allowed).toBe(false);
    if (!result.allowed) {
      expect(result.requiresApproval).toBe(true);
    }
  });
});
