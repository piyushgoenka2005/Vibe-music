import { describe, expect, it } from "vitest";
import {
  getAvailableStock,
  isLowStock,
  isOutOfStock,
  stockToAvailability,
  validateAvailability,
} from "@/lib/inventory/stockMath";

describe("getAvailableStock", () => {
  it("returns stock minus reserved", () => {
    expect(getAvailableStock(100, 20)).toBe(80);
  });

  it("never returns negative values", () => {
    expect(getAvailableStock(5, 10)).toBe(0);
  });
});

describe("validateAvailability", () => {
  const snapshots = new Map([
    [
      "p1",
      { name: "Guitar", stock: 10, reservedStock: 3, status: "active" },
    ],
    [
      "p2",
      { name: "Drum", stock: 0, reservedStock: 0, status: "active" },
    ],
    [
      "p3",
      { name: "Draft", stock: 50, reservedStock: 0, status: "draft" },
    ],
  ]);

  it("returns no errors when stock is sufficient", () => {
    const errors = validateAvailability(
      [{ productId: "p1", name: "Guitar", quantity: 5 }],
      snapshots
    );
    expect(errors).toHaveLength(0);
  });

  it("flags insufficient available stock", () => {
    const errors = validateAvailability(
      [{ productId: "p1", name: "Guitar", quantity: 8 }],
      snapshots
    );
    expect(errors).toHaveLength(1);
    expect(errors[0].available).toBe(7);
  });

  it("flags out of stock products", () => {
    const errors = validateAvailability(
      [{ productId: "p2", name: "Drum", quantity: 1 }],
      snapshots
    );
    expect(errors).toHaveLength(1);
    expect(errors[0].available).toBe(0);
  });

  it("flags inactive products", () => {
    const errors = validateAvailability(
      [{ productId: "p3", name: "Draft", quantity: 1 }],
      snapshots
    );
    expect(errors).toHaveLength(1);
  });

  it("flags missing products", () => {
    const errors = validateAvailability(
      [{ productId: "missing", name: "Unknown", quantity: 1 }],
      snapshots
    );
    expect(errors).toHaveLength(1);
  });
});

describe("low stock detection", () => {
  it("detects low stock based on available quantity", () => {
    expect(isLowStock(12, 2, 10)).toBe(true);
    expect(isLowStock(12, 0, 10)).toBe(false);
    expect(isOutOfStock(5, 5)).toBe(true);
  });
});

describe("stockToAvailability", () => {
  it("maps quantities to availability states", () => {
    expect(stockToAvailability(20, 0)).toBe("in-stock");
    expect(stockToAvailability(6, 2)).toBe("limited");
    expect(stockToAvailability(3, 3)).toBe("out-of-stock");
  });
});
