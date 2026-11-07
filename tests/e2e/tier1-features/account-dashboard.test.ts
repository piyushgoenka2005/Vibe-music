import { describe, it, expect } from "vitest";
import { buildOrderTimeline } from "@/components/account/orderTimeline";
import { sampleOrders } from "../fixtures/catalog-fixtures";
import { accountWishlistPutSchema } from "@/lib/validations/checkout";
import { addressInputSchema } from "@/lib/validations/address";
import type { Order } from "@/types/order";
import type { PublicShipmentTracking } from "@/types/shipment";

describe("Tier 1: Customer Account Dashboard & Order Tracking", () => {
  const baseOrder = sampleOrders[0];

  it("constructs correct timeline steps for newly placed and processing order", () => {
    const processingOrder: Order = {
      ...baseOrder,
      status: "processing",
      paymentStatus: "paid",
      invoice: {
        id: "inv-101",
        orderId: baseOrder.id,
        invoiceNumber: "INV-2026-101",
        createdAt: new Date().toISOString(),
      } as unknown as Order["invoice"],
    };

    const timeline = buildOrderTimeline(processingOrder, null);

    // Timeline should include standard steps
    const stepIds = timeline.map((s) => s.id);
    expect(stepIds).toContain("placed");
    expect(stepIds).toContain("payment_confirmed");
    expect(stepIds).toContain("packed");
    expect(stepIds).toContain("shipped");
    expect(stepIds).toContain("delivered");

    // "placed", "payment_confirmed", and "packed" should be complete for processing order
    const placedStep = timeline.find((s) => s.id === "placed");
    const paymentStep = timeline.find((s) => s.id === "payment_confirmed");
    const packedStep = timeline.find((s) => s.id === "packed");
    expect(placedStep?.state).toBe("complete");
    expect(paymentStep?.state).toBe("complete");
    expect(packedStep?.state).toBe("complete");

    // "shipped" is current active stage pending dispatch
    const shippedStep = timeline.find((s) => s.id === "shipped");
    expect(shippedStep?.state).toBe("current");

    // "delivered" should be upcoming
    const deliveredStep = timeline.find((s) => s.id === "delivered");
    expect(deliveredStep?.state).toBe("upcoming");
  });

  it("advances order timeline when shipment is in transit and delivered", () => {
    const shippedOrder: Order = {
      ...baseOrder,
      status: "shipped",
      paymentStatus: "paid",
      invoice: {
        id: "inv-101",
        orderId: baseOrder.id,
        invoiceNumber: "INV-2026-101",
        createdAt: new Date().toISOString(),
      } as unknown as Order["invoice"],
    };

    const inTransitShipment: PublicShipmentTracking = {
      status: "in_transit",
      carrierName: "Blue Dart",
      trackingNumber: "BD987654321IN",
      shippedAt: "2026-11-02T14:30:00Z",
      events: [
        {
          status: "picked_up",
          description: "Shipment received at hub",
          location: "Bengaluru",
          occurredAt: "2026-11-02T10:00:00Z",
        },
        {
          status: "in_transit",
          description: "In transit to destination facility",
          location: "Hyderabad",
          occurredAt: "2026-11-03T08:00:00Z",
        },
      ],
    };

    const timeline = buildOrderTimeline(shippedOrder, inTransitShipment);
    const shippedStep = timeline.find((s) => s.id === "shipped");
    expect(shippedStep?.state).toBe("complete");
    expect(shippedStep?.occurredAt).toBe("2026-11-02T14:30:00Z");

    // Test delivered status
    const deliveredOrder: Order = {
      ...baseOrder,
      status: "delivered",
      paymentStatus: "paid",
      invoice: {
        id: "inv-101",
        orderId: baseOrder.id,
        invoiceNumber: "INV-2026-101",
        createdAt: new Date().toISOString(),
      } as unknown as Order["invoice"],
    };
    const deliveredShipment: PublicShipmentTracking = {
      ...inTransitShipment,
      status: "delivered",
      deliveredAt: "2026-11-04T16:00:00Z",
    };

    const deliveredTimeline = buildOrderTimeline(deliveredOrder, deliveredShipment);
    const deliveredStep = deliveredTimeline.find((s) => s.id === "delivered");
    expect(deliveredStep?.state).toBe("complete");
    expect(deliveredStep?.occurredAt).toBe("2026-11-04T16:00:00Z");
  });

  it("handles cancelled and refunded orders with special timeline state", () => {
    const cancelledOrder: Order = {
      ...baseOrder,
      status: "cancelled",
      paymentStatus: "refunded",
    };

    const timeline = buildOrderTimeline(cancelledOrder, null);
    const cancelledStep = timeline.find((s) => s.id === "cancelled");
    expect(cancelledStep).toBeDefined();
    expect(cancelledStep?.state).toBe("current");
    expect(cancelledStep?.label).toBe("Cancelled");
  });

  it("validates address management schema for customer address book", () => {
    const validAddress = {
      fullName: "Aarav Sharma",
      addressLine1: "Flat 402, Nirvana Heights",
      addressLine2: "Indiranagar",
      city: "Bengaluru",
      state: "Karnataka",
      postalCode: "560038",
      phone: "9876543210",
      isDefault: true,
    };

    const result = addressInputSchema.safeParse(validAddress);
    expect(result.success).toBe(true);

    const invalidAddress = {
      ...validAddress,
      postalCode: "123", // too short, PIN must be 6 digits
    };
    expect(addressInputSchema.safeParse(invalidAddress).success).toBe(false);
  });

  it("validates customer wishlist sync schema", () => {
    const wishlistPayload = {
      items: [
        {
          productId: "prod-fender-strat",
          slug: "fender-player-stratocaster",
          name: "Fender Player Stratocaster Electric Guitar",
          brand: "Fender",
          price: 68500,
          imageColor: "#e5a158",
          image: "/images/products/strat-sunburst.jpg",
          addedAt: Date.now(),
        },
      ],
    };

    const result = accountWishlistPutSchema.safeParse(wishlistPayload);
    expect(result.success).toBe(true);
  });
});
