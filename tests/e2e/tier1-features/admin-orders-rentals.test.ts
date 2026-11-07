import { describe, it, expect } from "vitest";
import { adminOrderStatusSchema, adminInventoryAdjustSchema } from "@/lib/validations/admin";
import { escapeCsvCell, toCsv } from "@/lib/api/csv";
import { adminRentalStatusSchema } from "@/lib/validations/admin-rental";
import { sampleOrders } from "../fixtures/catalog-fixtures";

describe("Tier 1: Admin Orders & Rentals Management (Features 16 & 23)", () => {
  it("validates admin order status update transitions", () => {
    // Valid transitions
    const validStatuses = [
      "pending",
      "confirmed",
      "processing",
      "shipped",
      "delivered",
      "cancelled",
      "refunded",
    ];

    for (const status of validStatuses) {
      const result = adminOrderStatusSchema.safeParse({
        status,
        note: `Status updated to ${status} by admin`,
      });
      expect(result.success).toBe(true);
    }

    // Invalid status string rejected
    const invalidResult = adminOrderStatusSchema.safeParse({
      status: "unknown_status",
    });
    expect(invalidResult.success).toBe(false);
  });

  it("escapes CSV cells against commas, quotes, and spreadsheet formula injection (Feature 16)", () => {
    // Escaping commas
    expect(escapeCsvCell("Fender, Gibson, Ibanez")).toBe('"Fender, Gibson, Ibanez"');

    // Escaping double quotes (RFC 4180 doubling)
    expect(escapeCsvCell('14" Snare Drum')).toBe('"14"" Snare Drum"');

    // Escaping spreadsheet formula injection triggers (=, +, -, @)
    expect(escapeCsvCell("=SUM(A1:A10)")).toBe('"=SUM(A1:A10)"');
    expect(escapeCsvCell("+123456")).toBe('"+123456"');
    expect(escapeCsvCell("-500")).toBe('"-500"');
    expect(escapeCsvCell("@admin")).toBe('"@admin"');

    // Standard alphanumeric text unchanged
    expect(escapeCsvCell("ORD-101")).toBe("ORD-101");
  });

  it("serializes filtered orders to CSV with headers and row data (Feature 16)", () => {
    const headers = [
      "Order ID",
      "Date",
      "Customer Name",
      "Email",
      "Status",
      "Payment Status",
      "Total (INR)",
    ];

    const rows = sampleOrders.map((o) => [
      o.id,
      o.createdAt,
      o.shippingAddress?.name ?? "",
      o.email,
      o.status,
      o.paymentStatus,
      o.total,
    ]);

    const csvOutput = toCsv(headers, rows);
    expect(csvOutput).toContain(
      "Order ID,Date,Customer Name,Email,Status,Payment Status,Total (INR)\n",
    );
    expect(csvOutput).toContain("ord-test-101");
    expect(csvOutput).toContain("customer@vibemusic.in");
    expect(csvOutput).toContain("68500");
  });

  it("validates inventory adjustment schema with audit reason", () => {
    const validAdjustment = {
      productId: "prod-fender-strat",
      newQuantity: 25,
      reason: "Physical inventory audit count correction",
    };
    expect(adminInventoryAdjustSchema.safeParse(validAdjustment).success).toBe(true);

    // Negative quantity rejected
    const negativeAdj = {
      ...validAdjustment,
      newQuantity: -5,
    };
    expect(adminInventoryAdjustSchema.safeParse(negativeAdj).success).toBe(false);
  });

  it("validates admin rental booking status transitions (Feature 23)", () => {
    const validBookingUpdates = [
      { status: "confirmed" as const, note: "Identity verified, deposit payment cleared" },
      { status: "cancelled" as const, note: "Requested gear unavailable for chosen dates" },
      {
        status: "completed" as const,
        note: "Gear returned in excellent condition, deposit refund initiated",
      },
    ];

    for (const update of validBookingUpdates) {
      const result = adminRentalStatusSchema.safeParse(update);
      expect(result.success).toBe(true);
    }
  });
});
