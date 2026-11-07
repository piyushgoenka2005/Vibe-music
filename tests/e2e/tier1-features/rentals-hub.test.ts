import { describe, it, expect } from "vitest";
import {
  calculateRentalLine,
  calculateRentalTotals,
  getUnitRate,
} from "@/lib/rental/pricingEngine";
import { countAvailableUnits } from "@/lib/rental/availabilityEngine";
import { computeDurationUnits } from "@/lib/rental/durationUtils";
import { sampleRentalProducts } from "../fixtures/catalog-fixtures";
import { rentalQuoteSchema } from "@/lib/validations/rental";

describe("Tier 1: Rentals Hub & Booking Flow", () => {
  const rentalItem = sampleRentalProducts[0]; // Yamaha P-125 Digital Piano

  it("retrieves unit rates correctly for all duration types", () => {
    expect(getUnitRate(rentalItem, "hourly")).toBe(150);
    expect(getUnitRate(rentalItem, "daily")).toBe(1200);
    expect(getUnitRate(rentalItem, "weekly")).toBe(5000);
    expect(getUnitRate(rentalItem, "monthly")).toBe(15000);
  });

  it("computes duration units accurately across date ranges", () => {
    const start = "2026-12-01T10:00:00Z";
    const endDaily = "2026-12-04T10:00:00Z"; // 3 days
    const days = computeDurationUnits("daily", start, endDaily);
    expect(days).toBe(3);

    const endWeekly = "2026-12-15T10:00:00Z"; // 14 days = 2 weeks
    const weeks = computeDurationUnits("weekly", start, endWeekly);
    expect(weeks).toBe(2);
  });

  it("calculates rental line pricing with deposit and delivery fees", () => {
    const start = "2026-12-01T10:00:00Z";
    const end = "2026-12-08T10:00:00Z"; // 1 week

    const line = calculateRentalLine({
      product: rentalItem,
      quantity: 1,
      durationType: "weekly",
      startAt: start,
      endAt: end,
      fulfillment: "delivery",
    });

    expect(line.durationUnits).toBe(1);
    expect(line.unitRate).toBe(5000);
    expect(line.lineSubtotal).toBe(5000);
    expect(line.depositAmount).toBe(10000);
    expect(line.deliveryFee).toBe(600);
    expect(line.pickupFee).toBe(0);
  });

  it("computes rental booking grand totals with GST and refundable deposit", () => {
    const start = "2026-12-01T10:00:00Z";
    const end = "2026-12-04T10:00:00Z"; // 3 days

    const line = calculateRentalLine({
      product: rentalItem,
      quantity: 1,
      durationType: "daily",
      startAt: start,
      endAt: end,
      fulfillment: "delivery",
    });

    const totals = calculateRentalTotals({
      lines: [line],
      gstRate: 18,
    });

    expect(totals.subtotal).toBe(1200 * 3); // 3600
    expect(totals.depositAmount).toBe(10000);
    expect(totals.deliveryFee).toBe(600);
    // Total = subtotal (3600) + GST on subtotal & delivery + deposit (10000)
    expect(totals.totalGst).toBeGreaterThan(0);
    expect(totals.total).toBeGreaterThan(13600);
  });

  it("evaluates inventory availability against overlapping locks and maintenance buffer", () => {
    const ctx = {
      product: {
        ...rentalItem,
        totalUnits: 3,
      },
      locks: [
        {
          id: "lock-1",
          unitId: "u-1",
          startAt: "2026-12-05T00:00:00Z",
          endAt: "2026-12-10T00:00:00Z",
          status: "confirmed" as const,
        },
      ],
      blocks: [],
      now: "2026-12-01T00:00:00Z",
    };

    // Range overlapping lock: available units = 3 - 1 = 2
    const availableOverlapping = countAvailableUnits(
      ctx,
      "2026-12-06T00:00:00Z",
      "2026-12-08T00:00:00Z",
    );
    expect(availableOverlapping).toBe(2);

    // Range with no overlap: all 3 units available
    const availableNonOverlapping = countAvailableUnits(
      ctx,
      "2026-12-15T00:00:00Z",
      "2026-12-20T00:00:00Z",
    );
    expect(availableNonOverlapping).toBe(3);
  });

  it("validates rental quote and inquiry schema", () => {
    const validQuote = {
      productId: rentalItem.id,
      quantity: 1,
      durationType: "daily" as const,
      startAt: "2026-12-10T00:00:00Z",
      endAt: "2026-12-15T00:00:00Z",
      fulfillment: "delivery" as const,
    };

    const result = rentalQuoteSchema.safeParse(validQuote);
    expect(result.success).toBe(true);

    // Missing productId and productSlug rejected
    const invalidQuote = {
      ...validQuote,
      productId: undefined,
      productSlug: undefined,
    };
    expect(rentalQuoteSchema.safeParse(invalidQuote).success).toBe(false);
  });
});
