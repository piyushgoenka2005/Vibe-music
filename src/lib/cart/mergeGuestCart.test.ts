import { describe, expect, it } from "vitest";
import { mergeCartItems } from "./mergeGuestCart";
import type { CartItem } from "@/store/cartStore";

function makeItem(lineId: string, quantity: number, name?: string): CartItem {
  return {
    lineId,
    productId: `prod_${lineId}`,
    name: name ?? `Product ${lineId}`,
    brand: "Test",
    quantity,
    price: 999,
    image: undefined,
    gstRate: 18,
  } as unknown as CartItem;
}

describe("mergeCartItems", () => {
  it("returns incoming items when existing is empty", () => {
    const incoming = [makeItem("a", 2), makeItem("b", 1)];
    const result = mergeCartItems([], incoming);
    expect(result).toHaveLength(2);
    expect(result[0]!.lineId).toBe("a");
    expect(result[0]!.quantity).toBe(2);
  });

  it("returns existing items when incoming is empty", () => {
    const existing = [makeItem("a", 3)];
    const result = mergeCartItems(existing, []);
    expect(result).toHaveLength(1);
    expect(result[0]!.quantity).toBe(3);
  });

  it("adds new items from incoming to existing", () => {
    const existing = [makeItem("a", 1)];
    const incoming = [makeItem("b", 2)];
    const result = mergeCartItems(existing, incoming);
    expect(result).toHaveLength(2);
  });

  it("sums quantities for matching lineIds", () => {
    const existing = [makeItem("a", 2)];
    const incoming = [makeItem("a", 3)];
    const result = mergeCartItems(existing, incoming);
    expect(result).toHaveLength(1);
    expect(result[0]!.quantity).toBe(5);
  });

  it("caps quantity at 99 for matching items", () => {
    const existing = [makeItem("a", 80)];
    const incoming = [makeItem("a", 30)];
    const result = mergeCartItems(existing, incoming);
    expect(result[0]!.quantity).toBe(99);
  });

  it("preserves original item properties when merging", () => {
    const existing = [makeItem("a", 1, "Original Name")];
    const incoming = [makeItem("a", 1, "New Name")];
    const result = mergeCartItems(existing, incoming);
    expect(result[0]!.name).toBe("Original Name");
  });

  it("handles complex merge with mixed items", () => {
    const existing = [makeItem("a", 1), makeItem("b", 2)];
    const incoming = [makeItem("b", 1), makeItem("c", 3)];
    const result = mergeCartItems(existing, incoming);
    expect(result).toHaveLength(3);
    const itemA = result.find((i) => i.lineId === "a");
    const itemB = result.find((i) => i.lineId === "b");
    const itemC = result.find((i) => i.lineId === "c");
    expect(itemA!.quantity).toBe(1);
    expect(itemB!.quantity).toBe(3);
    expect(itemC!.quantity).toBe(3);
  });

  it("does not mutate the existing array", () => {
    const existing = [makeItem("a", 1)];
    const incoming = [makeItem("a", 2)];
    mergeCartItems(existing, incoming);
    expect(existing[0]!.quantity).toBe(1);
  });
});
