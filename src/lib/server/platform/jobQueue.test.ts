import { afterEach, describe, expect, it, vi } from "vitest";

const queueAdd = vi.fn(async () => undefined);
const processWebhook = vi.fn(async () => ({
  eventId: "evt_1",
  eventType: "payment.captured",
  orderId: "ord_1",
  skipped: false,
  message: "processed",
}));

vi.mock("bullmq", () => ({
  Queue: vi.fn(() => ({ add: queueAdd })),
  Worker: vi.fn(),
}));

vi.mock("ioredis", () => ({
  default: vi.fn(() => ({})),
}));

vi.mock("@/lib/server/razorpayWebhookService", () => ({
  processRazorpayWebhook: processWebhook,
}));

import { closeJobQueue, enqueueRazorpayWebhook, isJobQueueEnabled } from "@/lib/server/jobQueue";

describe("jobQueue", () => {
  afterEach(async () => {
    await closeJobQueue().catch(() => undefined);
    vi.clearAllMocks();
    delete process.env.REDIS_URL;
  });

  it("is disabled without REDIS_URL", () => {
    expect(isJobQueueEnabled()).toBe(false);
  });

  it("processes webhooks inline when queue is disabled", async () => {
    const outcome = await enqueueRazorpayWebhook({
      eventId: "evt_inline",
      eventType: "payment.captured",
      payload: {},
    });

    expect(outcome.mode).toBe("sync");
    expect(processWebhook).toHaveBeenCalledOnce();
    expect(queueAdd).not.toHaveBeenCalled();
  });

  it("enqueues webhooks when REDIS_URL is set", async () => {
    process.env.REDIS_URL = "redis://localhost:6379";

    const outcome = await enqueueRazorpayWebhook({
      eventId: "evt_queued",
      eventType: "payment.captured",
      payload: { payment: { entity: { id: "pay_1" } } },
    });

    expect(outcome.mode).toBe("queued");
    expect(queueAdd).toHaveBeenCalled();
    expect(processWebhook).not.toHaveBeenCalled();
  });
});
