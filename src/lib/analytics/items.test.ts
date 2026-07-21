import { describe, expect, it } from "vitest";
import {
  cartLineToGa4Item,
  cartLinesToGa4Items,
  orderToGa4Items,
  productToGa4Item,
  sumLineValue,
} from "@/lib/analytics/items";
import type { Order } from "@/types/order";

describe("analytics items", () => {
  it("maps product to GA4 item", () => {
    expect(
      productToGa4Item({
        id: "p1",
        name: "Strat",
        brand: "Fender",
        category: "Guitars",
        price: 45000,
        slug: "strat",
      })
    ).toEqual({
      item_id: "p1",
      item_name: "Strat",
      item_brand: "Fender",
      item_category: "Guitars",
      item_variant: undefined,
      price: 45000,
      quantity: 1,
      index: undefined,
    });
  });

  it("maps cart lines and totals", () => {
    const lines = [
      {
        productId: "p1",
        name: "Cable",
        price: 500,
        quantity: 2,
      },
    ];
    expect(sumLineValue(lines)).toBe(1000);
    expect(cartLinesToGa4Items(lines)).toHaveLength(1);
    expect(cartLineToGa4Item(lines[0]!).quantity).toBe(2);
  });

  it("maps order lines", () => {
    const order = {
      id: "ord_1",
      items: [
        {
          productId: "p1",
          name: "Pedal",
          quantity: 1,
          price: 1200,
          gstRate: 18,
          taxableAmount: 1200,
          gstAmount: 216,
          cgst: 108,
          sgst: 108,
          igst: 0,
        },
      ],
    } as Order;

    expect(orderToGa4Items(order)[0]?.item_id).toBe("p1");
  });
});
