/**
 * Integration tests — require DATABASE_URL (Postgres). Skipped when unset.
 * CI: validate.yml Postgres service.
 */
import { afterAll, describe, expect, it } from "vitest";
import { prisma } from "@/lib/db/prisma";
import { createOrGetPaymentLog } from "@/lib/server/paymentLogRepository";

const hasDatabase = Boolean(process.env.DATABASE_URL?.trim());
const describeIntegration = hasDatabase ? describe : describe.skip;

describeIntegration("paymentLogRepository integration", () => {
  const eventId = `evt_integration_${Date.now()}`;
  const payload = { payment: { entity: { id: "pay_test", order_id: "order_test" } } };

  afterAll(async () => {
    await prisma.paymentLog.deleteMany({ where: { razorpayEventId: eventId } });
  });

  it("dedupes webhook events by razorpayEventId (replay 5× → one row)", async () => {
    const results = [];
    for (let attempt = 0; attempt < 5; attempt += 1) {
      results.push(
        await createOrGetPaymentLog({
          razorpayEventId: eventId,
          eventType: "payment.captured",
          payload,
          razorpayOrderId: "order_test",
          razorpayPaymentId: "pay_test",
        }),
      );
    }

    expect(results[0]?.isNew).toBe(true);
    for (let i = 1; i < results.length; i += 1) {
      expect(results[i]?.isNew).toBe(false);
      expect(results[i]?.log.razorpayEventId).toBe(eventId);
    }

    const count = await prisma.paymentLog.count({ where: { razorpayEventId: eventId } });
    expect(count).toBe(1);
  });
});
