import { describe, expect, it } from "vitest";
import {
  isInvoiceGenerated,
  isPaymentVerified,
  isPlacedOrder,
  orderNeedsPlacementRefresh,
} from "@/lib/orderPlacement";
import type { Order } from "@/types/order";

function baseOrder(
  overrides: Partial<Pick<Order, "paymentStatus" | "invoice" | "status">>
): Pick<Order, "paymentStatus" | "invoice" | "status"> {
  return {
    paymentStatus: "pending",
    invoice: undefined,
    status: "pending",
    ...overrides,
  };
}

describe("orderPlacement", () => {
  it("treats unpaid Razorpay orders as not placed even with legacy invoice data", () => {
    expect(
      isPlacedOrder(
        baseOrder({
          paymentStatus: "pending",
          invoice: { invoiceNumber: "INV-LEGACY-1" } as Order["invoice"],
        })
      )
    ).toBe(false);
  });

  it("requires both verified payment and invoice for online orders", () => {
    expect(isPlacedOrder(baseOrder({ paymentStatus: "paid" }))).toBe(false);
    expect(
      isPlacedOrder(
        baseOrder({
          paymentStatus: "paid",
          invoice: { invoiceNumber: "INV-1" } as Order["invoice"],
        })
      )
    ).toBe(true);
  });

  it("treats COD as placed once invoice is issued", () => {
    expect(
      isPlacedOrder(
        baseOrder({
          paymentStatus: "cod_pending",
          invoice: { invoiceNumber: "INV-COD-1" } as Order["invoice"],
        })
      )
    ).toBe(true);
  });

  it("keeps refunded orders visible when invoice exists", () => {
    expect(
      isPlacedOrder(
        baseOrder({
          paymentStatus: "refunded",
          invoice: { invoiceNumber: "INV-REF-1" } as Order["invoice"],
        })
      )
    ).toBe(true);
  });

  it("exposes payment and invoice helpers", () => {
    expect(isPaymentVerified(baseOrder({ paymentStatus: "pending" }))).toBe(false);
    expect(isPaymentVerified(baseOrder({ paymentStatus: "paid" }))).toBe(true);
    expect(isInvoiceGenerated(baseOrder({ invoice: undefined }))).toBe(false);
    expect(
      isInvoiceGenerated(
        baseOrder({ invoice: { invoiceNumber: "INV-2" } as Order["invoice"] })
      )
    ).toBe(true);
  });

  it("polls placement refresh until paid and invoiced", () => {
    expect(
      orderNeedsPlacementRefresh(
        baseOrder({ paymentStatus: "pending", invoice: undefined })
      )
    ).toBe(true);
    expect(
      orderNeedsPlacementRefresh(
        baseOrder({
          paymentStatus: "paid",
          invoice: { invoiceNumber: "INV-3" } as Order["invoice"],
        })
      )
    ).toBe(false);
    expect(
      orderNeedsPlacementRefresh(
        baseOrder({ paymentStatus: "failed", status: "cancelled" })
      )
    ).toBe(false);
  });
});
