import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/server/paymentLogRepository", () => ({
  createOrGetPaymentLog: vi.fn(),
  updatePaymentLogStatus: vi.fn(),
}));

vi.mock("@/lib/server/orderPaymentService", () => ({
  completeOrderPayment: vi.fn(),
  failOrderPayment: vi.fn(),
  findOrderByRazorpayOrderId: vi.fn(),
  findOrderByRazorpayPaymentId: vi.fn(),
  refundOrderPayment: vi.fn(),
}));

import { processRazorpayWebhook } from "@/lib/server/razorpayWebhookService";
import { createOrGetPaymentLog, updatePaymentLogStatus } from "@/lib/server/paymentLogRepository";

describe("processRazorpayWebhook", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(createOrGetPaymentLog).mockResolvedValue({
      log: {
        status: "pending",
        orderId: null,
        attemptCount: 0,
      },
      isNew: true,
    } as unknown as Awaited<ReturnType<typeof createOrGetPaymentLog>>);
    vi.mocked(updatePaymentLogStatus).mockResolvedValue(undefined);
  });

  it("skips unhandled event types", async () => {
    const result = await processRazorpayWebhook({
      eventId: "evt_unknown",
      eventType: "payment.authorized",
      payload: {},
    });

    expect(result.skipped).toBe(true);
    expect(result.message).toBe("Unhandled event type");
    expect(updatePaymentLogStatus).toHaveBeenCalled();
  });

  it("dedupes already processed events", async () => {
    vi.mocked(createOrGetPaymentLog).mockResolvedValue({
      log: {
        status: "processed",
        orderId: "ord_1",
        attemptCount: 1,
      },
      isNew: false,
    } as unknown as Awaited<ReturnType<typeof createOrGetPaymentLog>>);

    const result = await processRazorpayWebhook({
      eventId: "evt_dup",
      eventType: "payment.captured",
      payload: {},
    });

    expect(result.skipped).toBe(true);
    expect(result.orderId).toBe("ord_1");
  });
});
