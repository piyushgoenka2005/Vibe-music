import { describe, expect, it } from "vitest";
import { assertRazorpayAmountMatchesOrder } from "@/lib/server/paymentAmountVerification";

describe("assertRazorpayAmountMatchesOrder", () => {
  it("accepts matching Razorpay amount in paise", () => {
    expect(() => assertRazorpayAmountMatchesOrder({ total: 1999.5 }, 199950)).not.toThrow();
  });

  it("rejects underpayment", () => {
    expect(() => assertRazorpayAmountMatchesOrder({ total: 5000 }, 100)).toThrow(
      /Payment amount mismatch/,
    );
  });

  it("rejects invalid amounts", () => {
    expect(() => assertRazorpayAmountMatchesOrder({ total: 5000 }, 0)).toThrow(
      /Invalid Razorpay payment amount/,
    );
  });
});
