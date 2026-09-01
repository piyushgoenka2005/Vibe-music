import { describe, expect, it } from "vitest";
import { formatCheckoutError } from "./checkoutErrors";

describe("formatCheckoutError", () => {
  it("wraps database connection errors", () => {
    expect(formatCheckoutError(new Error("DATABASE_URL is missing"))).toBe(
      "Checkout is temporarily unavailable. Please try again in a few minutes."
    );
    expect(
      formatCheckoutError(new Error("Can't reach database host"))
    ).toContain("temporarily unavailable");
    expect(
      formatCheckoutError(new Error("connection refused to db"))
    ).toContain("temporarily unavailable");
  });

  it("wraps Razorpay config errors", () => {
    expect(
      formatCheckoutError(new Error("Missing Razorpay env vars"))
    ).toBe("Online payments are not configured yet. Please contact support.");
    expect(
      formatCheckoutError(new Error("RAZORPAY_KEY not set"))
    ).toContain("not configured yet");
  });

  it("wraps Razorpay auth errors", () => {
    expect(
      formatCheckoutError(
        new Error("authentication failed for Razorpay API")
      )
    ).toBe(
      "Payment gateway authentication failed. Check Razorpay keys on the server."
    );
    expect(
      formatCheckoutError(new Error("bad auth for razorpay key"))
    ).toContain("authentication failed");
  });

  it("wraps Google/database auth errors", () => {
    expect(formatCheckoutError(new Error("UNAUTHENTICATED"))).toBe(
      "Server database authentication failed. Please contact support."
    );
    expect(
      formatCheckoutError(new Error("invalid_grant from firebase"))
    ).toContain("authentication failed");
  });

  it("passes through stock errors", () => {
    expect(
      formatCheckoutError(new Error("Insufficient stock for Widget"))
    ).toBe("Insufficient stock for Widget");
  });

  it("wraps payment signature errors", () => {
    expect(
      formatCheckoutError(new Error("Invalid payment signature"))
    ).toBe(
      "Payment verification failed. If you were charged, contact support with your payment ID."
    );
  });

  it("passes through product unavailable errors", () => {
    expect(
      formatCheckoutError(new Error("Product foo unavailable"))
    ).toBe("Product foo unavailable");
    expect(
      formatCheckoutError(new Error("variant unavailable"))
    ).toBe("variant unavailable");
  });

  it("handles string errors", () => {
    expect(formatCheckoutError("something broke")).toBe(
      "Unable to complete checkout. Please try again."
    );
  });

  it("handles Razorpay error objects with description", () => {
    // extractErrorMessage pulls error.description
    expect(
      formatCheckoutError({
        error: { description: "authentication failed for razorpay" },
      })
    ).toBe(
      "Payment gateway authentication failed. Check Razorpay keys on the server."
    );
  });

  it("handles Razorpay error objects with nested reason", () => {
    expect(
      formatCheckoutError({
        error: { reason: "bad auth for razorpay key" },
      })
    ).toBe(
      "Payment gateway authentication failed. Check Razorpay keys on the server."
    );
  });

  it("returns generic message for unknown errors", () => {
    expect(formatCheckoutError(new Error("weird unknown issue"))).toBe(
      "Unable to complete checkout. Please try again."
    );
    expect(formatCheckoutError(null)).toBe(
      "Unable to complete checkout. Please try again."
    );
    expect(formatCheckoutError(42)).toBe(
      "Unable to complete checkout. Please try again."
    );
  });
});
