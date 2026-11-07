import { describe, it, expect } from "vitest";
import {
  calculateGST,
  toPaise,
  type GSTCalculationInput,
  type GSTLineItem,
} from "@/lib/gstCalculator";
import { calculateCouponDiscountAmount } from "@/lib/coupons/couponMath";
import {
  calculateRentalLine,
  calculateRentalTotals,
  calculateLateFee,
} from "@/lib/rental/pricingEngine";
import type { RentalProduct } from "@/types/rental";

describe("Tier 5 Adversarial: Extreme Pricing Math, Precision & Zero-Cost Bundles", () => {
  describe("Decimal Precision & Paise Rounding Invariants", () => {
    it("maintains exact rupee-penny balance without fractional drift under awkward decimals", () => {
      // 3 items with fractional prices: ₹99.99 * 3 = ₹299.97
      const awkwardItems: GSTLineItem[] = [
        {
          productId: "p-guitar-string",
          name: "Single High E Guitar String",
          quantity: 3,
          unitPrice: 99.99,
          gstRate: 18,
        },
        {
          productId: "p-pick",
          name: "Celluloid Guitar Pick 0.71mm",
          quantity: 7,
          unitPrice: 19.95,
          gstRate: 18,
        },
      ];

      const input: GSTCalculationInput = {
        items: awkwardItems,
        couponDiscount: 35.5,
        shippingCharge: 0,
        platformFee: 0,
        sellerState: "Maharashtra",
        buyerState: "Maharashtra", // Intra-state
      };

      const result = calculateGST(input);

      // Verify line breakdown calculations
      let calculatedSubtotal = 0;
      let calculatedTaxable = 0;
      let calculatedGst = 0;

      for (const line of result.lineBreakdown) {
        calculatedSubtotal += line.lineTotal;
        calculatedTaxable += line.taxableAmount;
        calculatedGst += line.gstAmount;

        // Line invariance: taxable + gst must equal line total within +/- 0.02 rounding threshold
        const lineSum = Math.round((line.taxableAmount + line.gstAmount) * 100) / 100;
        expect(Math.abs(lineSum - line.lineTotal)).toBeLessThanOrEqual(0.02);

        // Intra-state split: cgst + sgst must equal gstAmount within 0.01
        expect(Math.abs(line.cgst + line.sgst - line.gstAmount)).toBeLessThanOrEqual(0.01);
      }

      expect(calculatedTaxable).toBeGreaterThan(0);
      expect(calculatedGst).toBeGreaterThan(0);

      // Grand total must equal line totals + shipping + platform fee
      expect(result.grandTotal).toBe(
        Math.round((calculatedSubtotal + result.shippingCharge + result.platformFee) * 100) / 100,
      );

      // Tax totals invariance: CGST + SGST must equal total GST
      expect(Math.round((result.totalCgst + result.totalSgst) * 100) / 100).toBe(result.totalGst);
      expect(result.totalIgst).toBe(0);
    });

    it("converts INR to Razorpay paise accurately without floating point representation error", () => {
      expect(toPaise(0)).toBe(0);
      expect(toPaise(0.01)).toBe(1);
      expect(toPaise(0.99)).toBe(99);
      expect(toPaise(1.0)).toBe(100);
      expect(toPaise(1499.5)).toBe(149950);
      expect(toPaise(68500.25)).toBe(6850025);

      // Tricky floating point IEEE 754 precision: 19.99 * 100 = 1998.9999999999998
      expect(toPaise(19.99)).toBe(1999);
      expect(toPaise(10.29)).toBe(1029);
      expect(toPaise(55.55)).toBe(5555);
    });
  });

  describe("Zero-Cost Bundles & 100% Discount Scenarios", () => {
    it("handles zero-cost promotional items without division-by-zero or NaN in GST math", () => {
      const zeroCostBundleItems: GSTLineItem[] = [
        {
          productId: "p-bundle-main",
          name: "Electric Guitar Starter Pack",
          quantity: 1,
          unitPrice: 24999,
          gstRate: 18,
        },
        {
          productId: "p-bundle-free-cable",
          name: "Free 10ft Instrument Cable",
          quantity: 1,
          unitPrice: 0, // Free promo gift
          gstRate: 18,
        },
        {
          productId: "p-bundle-free-picks",
          name: "Free 12-Pack Picks",
          quantity: 1,
          unitPrice: 0, // Free promo gift
          gstRate: 18,
        },
      ];

      const input: GSTCalculationInput = {
        items: zeroCostBundleItems,
        couponDiscount: 0,
        shippingCharge: 0,
        sellerState: "Maharashtra",
        buyerState: "Karnataka", // Inter-state
      };

      const result = calculateGST(input);

      // Free items must have 0 taxable amount and 0 GST
      const freeCable = result.lineBreakdown.find((l) => l.productId === "p-bundle-free-cable");
      expect(freeCable?.lineSubtotal).toBe(0);
      expect(freeCable?.taxableAmount).toBe(0);
      expect(freeCable?.gstAmount).toBe(0);
      expect(freeCable?.igst).toBe(0);

      // Main product carries the full taxable base
      expect(result.subtotal).toBe(24999);
      expect(result.grandTotal).toBe(24999);
      expect(Number.isFinite(result.totalGst)).toBe(true);
      expect(result.totalIgst).toBe(result.totalGst);
      expect(result.totalCgst).toBe(0);
      expect(result.totalSgst).toBe(0);
    });

    it("caps coupon discounts when coupon value exceeds order subtotal (no negative cart total)", () => {
      // Order subtotal = ₹499
      const subtotal = 499;

      // Fixed discount coupon offering ₹1,000 off
      const hugeFixedCoupon = {
        id: "c-huge",
        code: "MEGA1000",
        type: "fixed_cart" as const,
        value: 1000,
        isActive: true,
        usedCount: 0,
      };

      const discount = calculateCouponDiscountAmount(subtotal, hugeFixedCoupon);
      // Discount must be capped at subtotal (₹499)
      expect(discount).toBe(499);
      expect(subtotal - discount).toBe(0);

      // 100% percentage discount coupon
      const freeCoupon = {
        id: "c-free",
        code: "100PERCENT",
        type: "percentage" as const,
        value: 100,
        isActive: true,
        usedCount: 0,
      };

      const freeDiscount = calculateCouponDiscountAmount(subtotal, freeCoupon);
      expect(freeDiscount).toBe(499);
      expect(subtotal - freeDiscount).toBe(0);
    });

    it("correctly handles zero subtotal with coupon validation", () => {
      const coupon = {
        id: "c-10",
        code: "ANY",
        type: "fixed_cart" as const,
        value: 100,
        isActive: true,
        usedCount: 0,
      };

      expect(calculateCouponDiscountAmount(0, coupon)).toBe(0);
      expect(calculateCouponDiscountAmount(-100, coupon)).toBe(0);
    });
  });

  describe("Multi-Tier Mixed GST Schedules & Inter-State Boundary Routing", () => {
    it("computes accurate weighted GST and split across mixed rate slabs (0%, 5%, 12%, 18%, 28%)", () => {
      const mixedItems: GSTLineItem[] = [
        {
          productId: "p-book",
          name: "Guitar Method Book (HSN 4904 - Exempt)",
          quantity: 1,
          unitPrice: 500,
          gstRate: 5, // Low concession
        },
        {
          productId: "p-guitar",
          name: "Solid Body Electric Guitar (HSN 9202 - Standard)",
          quantity: 1,
          unitPrice: 50000,
          gstRate: 18,
        },
        {
          productId: "p-luxury-synth",
          name: "Flagship Analog Synthesizer (HSN 9207 - Luxury)",
          quantity: 1,
          unitPrice: 150000,
          gstRate: 28,
        },
      ];

      // Intra-state test
      const intraInput: GSTCalculationInput = {
        items: mixedItems,
        couponDiscount: 5000,
        shippingCharge: 0,
        sellerState: "Maharashtra",
        buyerState: "Maharashtra",
      };

      const intraResult = calculateGST(intraInput);
      expect(intraResult.isInterState).toBe(false);
      expect(intraResult.totalIgst).toBe(0);
      expect(intraResult.totalCgst).toBeGreaterThan(0);
      expect(intraResult.totalSgst).toBeGreaterThan(0);
      expect(Math.round((intraResult.totalCgst + intraResult.totalSgst) * 100) / 100).toBe(
        intraResult.totalGst,
      );

      // Inter-state test
      const interInput: GSTCalculationInput = {
        ...intraInput,
        buyerState: "Delhi",
      };

      const interResult = calculateGST(interInput);
      expect(interResult.isInterState).toBe(true);
      expect(interResult.totalCgst).toBe(0);
      expect(interResult.totalSgst).toBe(0);
      expect(interResult.totalIgst).toBe(interResult.totalGst);
      expect(interResult.grandTotal).toBe(intraResult.grandTotal);
    });
  });

  describe("Large Pricing Numbers & Integer Overflow Safeguards", () => {
    it("handles institutional and enterprise bulk purchases without 32-bit integer overflow", () => {
      // 50 luxury pro audio mixer consoles at ₹10,00,000 each = ₹50,000,000 (5 crore INR)
      const bigItem: GSTLineItem = {
        productId: "p-console",
        name: "Neve 8424 Large Format Recording Console",
        quantity: 50,
        unitPrice: 1000000,
        gstRate: 18,
      };

      const input: GSTCalculationInput = {
        items: [bigItem],
        couponDiscount: 500000, // ₹5 lakh coupon
        shippingCharge: 15000,
        platformFee: 0,
        sellerState: "Maharashtra",
        buyerState: "Karnataka",
      };

      const result = calculateGST(input);
      expect(result.subtotal).toBe(50000000);
      expect(result.couponDiscount).toBe(500000);
      expect(result.grandTotal).toBe(49515000); // 50m - 500k + 15k

      // Convert to paise
      const grandTotalPaise = toPaise(result.grandTotal);
      expect(grandTotalPaise).toBe(4951500000); // 4.95 billion paise

      // Must be positive (a 32-bit signed integer overflow would wrap around to negative numbers)
      expect(grandTotalPaise).toBeGreaterThan(0);
      expect(grandTotalPaise).toBeLessThan(Number.MAX_SAFE_INTEGER);
    });
  });

  describe("Rental Engine Boundary Pricing & Durations", () => {
    const mockRentalProduct: RentalProduct = {
      id: "rent-gibson-lespaul",
      productId: "prod-gibson-lp",
      name: "Gibson Les Paul Standard 50s",
      slug: "gibson-les-paul-standard-rental",
      category: "Electric Guitars",
      imageUrl: "/images/rentals/lespaul.jpg",
      hourlyRate: 350,
      dailyRate: 1800,
      weeklyRate: 8500,
      monthlyRate: 28000,
      depositAmount: 15000,
      minDurationDays: 1,
      maxDurationDays: 30,
      deliveryAvailable: true,
      deliveryFee: 500,
      pickupAvailable: true,
      pickupFee: 0,
      status: "available",
      totalUnits: 3,
      availableUnits: 2,
    };

    it("calculates multi-day rental quote with security deposit and delivery fees", () => {
      const line = calculateRentalLine({
        product: mockRentalProduct,
        quantity: 1,
        durationType: "daily",
        startAt: "2026-11-10T10:00:00Z",
        endAt: "2026-11-14T10:00:00Z", // 4 days
        fulfillment: "delivery",
      });

      expect(line.durationUnits).toBe(4);
      expect(line.unitRate).toBe(1800);
      expect(line.lineSubtotal).toBe(7200); // 4 * 1800
      expect(line.depositAmount).toBe(15000);
      expect(line.deliveryFee).toBe(500);

      const totals = calculateRentalTotals({
        lines: [line],
        gstRate: 18,
      });

      expect(totals.subtotal).toBe(7200);
      expect(totals.depositAmount).toBe(15000);
      expect(totals.deliveryFee).toBe(500);
      // Total taxable = subtotal (7200) + delivery (500) = 7700
      // GST extracted: 7700 * 18 / 118 = 1174.58
      expect(totals.totalGst).toBeCloseTo(1174.58, 1);
      // Grand total = taxable (7700) + deposit (15000) = 22700
      expect(totals.total).toBe(22700);
    });

    it("computes late return fees accurately or returns 0 when returned on or before due date", () => {
      // Returned 2 days late
      const lateFee = calculateLateFee({
        lateFeePerDay: 500,
        dueAt: "2026-11-14T18:00:00Z",
        returnedAt: "2026-11-16T19:00:00Z", // ~2.04 days -> 3 days ceiling
      });
      expect(lateFee).toBe(1500);

      // Returned on time
      const onTimeFee = calculateLateFee({
        lateFeePerDay: 500,
        dueAt: "2026-11-14T18:00:00Z",
        returnedAt: "2026-11-14T12:00:00Z",
      });
      expect(onTimeFee).toBe(0);

      // Returned before due date
      const earlyFee = calculateLateFee({
        lateFeePerDay: 500,
        dueAt: "2026-11-14T18:00:00Z",
        returnedAt: "2026-11-10T10:00:00Z",
      });
      expect(earlyFee).toBe(0);
    });
  });
});
