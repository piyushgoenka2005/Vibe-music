import { describe, expect, it } from "vitest";
import {
  computeDurationUnits,
  rentalRangesOverlap,
  validateDurationBounds,
} from "@/lib/rental/durationUtils";
import {
  calculateLateFee,
  calculateRentalLine,
  calculateRentalTotals,
  getUnitRate,
} from "@/lib/rental/pricingEngine";
import { countAvailableUnits, isProductAvailable } from "@/lib/rental/availabilityEngine";
import type { RentalProduct } from "@/types/rental";

const baseProduct: RentalProduct = {
  id: "p1",
  slug: "test",
  name: "Test",
  categoryId: "c1",
  description: "",
  image: "",
  images: [],
  specifications: {},
  status: "active",
  totalUnits: 2,
  availableUnits: 2,
  reservedUnits: 0,
  minDurationHours: 4,
  maxDurationDays: 30,
  depositAmount: 1000,
  hourlyRate: 50,
  dailyRate: 400,
  weeklyRate: 2000,
  monthlyRate: 7000,
  pickupAvailable: true,
  deliveryAvailable: true,
  deliveryFee: 100,
  pickupFee: 0,
  lateFeePerDay: 200,
  damagePolicy: "",
  termsText: "",
  agreementText: "",
  featured: false,
  createdAt: "",
  updatedAt: "",
};

describe("rental duration utils", () => {
  it("computes daily units", () => {
    const units = computeDurationUnits(
      "daily",
      "2026-07-14T10:00:00.000Z",
      "2026-07-16T10:00:00.000Z"
    );
    expect(units).toBe(2);
  });

  it("detects overlapping ranges", () => {
    expect(
      rentalRangesOverlap(
        "2026-07-14T10:00:00.000Z",
        "2026-07-15T10:00:00.000Z",
        "2026-07-15T09:00:00.000Z",
        "2026-07-16T10:00:00.000Z"
      )
    ).toBe(true);
  });

  it("validates min duration", () => {
    expect(() =>
      validateDurationBounds({
        durationType: "hourly",
        startAt: "2026-07-14T10:00:00.000Z",
        endAt: "2026-07-14T11:00:00.000Z",
        minDurationHours: 4,
        maxDurationDays: 30,
      })
    ).toThrow(/Minimum rental duration/);
  });
});

describe("rental pricing engine", () => {
  it("returns configured unit rate", () => {
    expect(getUnitRate(baseProduct, "daily")).toBe(400);
  });

  it("calculates line totals with deposit", () => {
    const line = calculateRentalLine({
      product: baseProduct,
      quantity: 1,
      durationType: "daily",
      startAt: "2026-07-14T10:00:00.000Z",
      endAt: "2026-07-15T10:00:00.000Z",
      fulfillment: "pickup",
    });
    expect(line.lineSubtotal).toBe(400);
    expect(line.depositAmount).toBe(1000);
  });

  it("aggregates booking totals", () => {
    const totals = calculateRentalTotals({
      lines: [
        {
          lineSubtotal: 400,
          depositAmount: 1000,
          deliveryFee: 0,
          pickupFee: 0,
        },
      ],
    });
    expect(totals.total).toBe(1400);
  });

  it("calculates late fees", () => {
    const fee = calculateLateFee({
      lateFeePerDay: 200,
      dueAt: "2026-07-14T10:00:00.000Z",
      returnedAt: "2026-07-16T10:00:00.000Z",
    });
    expect(fee).toBe(400);
  });
});

describe("rental availability engine", () => {
  it("reports availability without locks", () => {
    const available = countAvailableUnits(
      { product: baseProduct, locks: [], blocks: [] },
      "2026-07-20T10:00:00.000Z",
      "2026-07-21T10:00:00.000Z"
    );
    expect(available).toBe(2);
  });

  it("blocks when lock consumes inventory", () => {
    const available = isProductAvailable(
      {
        product: baseProduct,
        locks: [
          {
            id: "l1",
            unitId: null,
            productId: "p1",
            bookingId: "b1",
            startAt: "2026-07-20T00:00:00.000Z",
            endAt: "2026-07-22T00:00:00.000Z",
            status: "confirmed",
            expiresAt: null,
            createdAt: "",
          },
          {
            id: "l2",
            unitId: null,
            productId: "p1",
            bookingId: "b2",
            startAt: "2026-07-20T00:00:00.000Z",
            endAt: "2026-07-22T00:00:00.000Z",
            status: "confirmed",
            expiresAt: null,
            createdAt: "",
          },
        ],
        blocks: [],
      },
      "2026-07-20T10:00:00.000Z",
      "2026-07-21T10:00:00.000Z",
      1
    );
    expect(available).toBe(false);
  });
});
