import { describe, expect, it } from "vitest";
import {
  formatOrderId,
  formatOrderIdDisplay,
  getOrderYear,
  isStructuredOrderId,
  ORDER_ID_SEQUENCE_START,
  parseStructuredOrderId,
} from "@/lib/orderId";

describe("orderId", () => {
  it("formats the first order id for a year", () => {
    expect(formatOrderId(ORDER_ID_SEQUENCE_START, 2026)).toBe("005001-2026");
  });

  it("adds a hash prefix for display", () => {
    expect(formatOrderIdDisplay("005001-2026")).toBe("#005001-2026");
  });

  it("parses structured order ids", () => {
    expect(parseStructuredOrderId("005001-2026")).toEqual({
      sequence: 5001,
      year: 2026,
    });
  });

  it("detects structured order ids", () => {
    expect(isStructuredOrderId("005001-2026")).toBe(true);
    expect(isStructuredOrderId("abc123")).toBe(false);
  });

  it("uses the Asia/Kolkata calendar year", () => {
    const year = getOrderYear(new Date("2026-12-31T20:00:00.000Z"));
    expect(year).toBe(2027);
  });
});
