import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/api/route-utils", async (importOriginal) => {
  const orig = await importOriginal<typeof import("@/lib/api/route-utils")>();
  return {
    ...orig,
    enforceRateLimit: vi.fn().mockResolvedValue(null),
    enforceMutationSecurity: vi.fn().mockReturnValue(null),
  };
});

vi.mock("@/lib/server/rentalBookingService", () => ({
  verifyRentalPayment: vi.fn(),
}));

import { POST } from "./route";
import { enforceMutationSecurity, enforceRateLimit } from "@/lib/api/route-utils";
import { verifyRentalPayment } from "@/lib/server/rentalBookingService";

function makeRequest(body: Record<string, unknown>, headers: Record<string, string> = {}): Request {
  return new Request("http://localhost/api/rentals/bookings/verify-payment", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Origin: "http://localhost:3000",
      ...headers,
    },
    body: JSON.stringify(body),
  });
}

describe("POST /api/rentals/bookings/verify-payment", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(enforceRateLimit).mockResolvedValue(null);
    vi.mocked(enforceMutationSecurity).mockReturnValue(null);
    vi.mocked(verifyRentalPayment).mockResolvedValue({
      id: "rental-1",
      status: "confirmed",
    } as Awaited<ReturnType<typeof verifyRentalPayment>>);
  });

  it("returns CSRF error when mutation security fails", async () => {
    vi.mocked(enforceMutationSecurity).mockReturnValue(
      new Response(JSON.stringify({ error: "Invalid origin" }), { status: 403 }),
    );

    const res = await POST(
      makeRequest({ bookingId: "rental-1", paymentId: "pay_1", signature: "sig" }),
    );
    expect(res.status).toBe(403);
    expect(verifyRentalPayment).not.toHaveBeenCalled();
  });

  it("rejects invalid payload", async () => {
    const res = await POST(makeRequest({ bookingId: "" }));
    expect(res.status).toBeGreaterThanOrEqual(400);
    expect(verifyRentalPayment).not.toHaveBeenCalled();
  });

  it("verifies rental payment with valid payload", async () => {
    const res = await POST(
      makeRequest({
        bookingId: "rental-1",
        razorpayPaymentId: "pay_test_1",
        razorpayOrderId: "order_test_1",
        razorpaySignature: "signature_test",
      }),
    );

    expect(res.status).toBe(200);
    expect(verifyRentalPayment).toHaveBeenCalled();
    const body = (await res.json()) as { booking?: { id?: string } };
    expect(body.booking?.id).toBe("rental-1");
  });
});
