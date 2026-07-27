/**
 * F-14 payment path proof (no customer card UI).
 * Creates an ops-only order, posts a signed payment.captured webhook to the
 * local app, and verifies paid status + payment_log.
 *
 * Usage on VPS:
 *   npx tsx --env-file=.env.local scripts/ops/close-f14-payment-proof.mts
 */
import crypto from "node:crypto";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const BASE = process.env.PROOF_BASE_URL ?? "http://127.0.0.1:3000";

function loadRequired(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`Missing ${name}`);
  return value;
}

async function main() {
  const webhookSecret = loadRequired("RAZORPAY_WEBHOOK_SECRET");
  const keyId = loadRequired("RAZORPAY_KEY_ID");
  const keySecret = loadRequired("RAZORPAY_KEY_SECRET");

  const stamp = Date.now();
  const orderId = `OPS-${stamp}`;
  const now = new Date().toISOString();

  const auth = Buffer.from(`${keyId}:${keySecret}`).toString("base64");
  const rpOrderRes = await fetch("https://api.razorpay.com/v1/orders", {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      amount: 100,
      currency: "INR",
      receipt: orderId.slice(0, 40),
      notes: { orderId, purpose: "f14-ops-signoff" },
    }),
  });
  const rpOrder = (await rpOrderRes.json()) as {
    id?: string;
    error?: { description?: string };
  };
  if (!rpOrderRes.ok || !rpOrder.id) {
    throw new Error(
      `Razorpay order create failed: ${rpOrderRes.status} ${JSON.stringify(rpOrder)}`
    );
  }

  const paymentId = `pay_ops_${stamp}`;
  const eventId = `evt_ops_${stamp}`;

  await prisma.order.create({
    data: {
      id: orderId,
      email: "ops-signoff@vibemusic.in",
      customerName: "F14 Ops Signoff",
      customerPhone: "9999999999",
      isGuestOrder: true,
      status: "pending",
      paymentStatus: "pending",
      paymentMethod: "razorpay",
      subtotal: 1,
      couponDiscount: 0,
      shippingCharge: 0,
      platformFee: 0,
      totalGst: 0,
      cgst: 0,
      sgst: 0,
      igst: 0,
      total: 1,
      items: [
        {
          productId: "ops-signoff",
          name: "F14 Ops Signoff Line",
          quantity: 1,
          price: 1,
          gstRate: 0,
        },
      ],
      shippingAddress: {
        name: "F14 Ops",
        line1: "Ops Desk",
        city: "Mumbai",
        state: "MH",
        pincode: "400001",
        phone: "9999999999",
        email: "ops-signoff@vibemusic.in",
      },
      razorpayOrderId: rpOrder.id,
      inventoryStatus: "fulfilled",
      createdAt: now,
      updatedAt: now,
    },
  });

  const payload = {
    event: "payment.captured",
    payload: {
      payment: {
        entity: {
          id: paymentId,
          order_id: rpOrder.id,
          status: "captured",
          amount: 100,
          notes: { orderId, purpose: "f14-ops-signoff" },
        },
      },
    },
  };
  const rawBody = JSON.stringify(payload);
  const signature = crypto
    .createHmac("sha256", webhookSecret)
    .update(rawBody)
    .digest("hex");

  const webhookRes = await fetch(`${BASE}/api/payment/webhook/razorpay`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Razorpay-Signature": signature,
      "X-Razorpay-Event-Id": eventId,
    },
    body: rawBody,
  });
  const webhookBody = await webhookRes.text();
  if (!webhookRes.ok) {
    throw new Error(`Webhook failed: ${webhookRes.status} ${webhookBody}`);
  }

  const order = await prisma.order.findUnique({ where: { id: orderId } });
  const logs = await prisma.paymentLog.count({
    where: {
      OR: [
        { eventType: { contains: "payment" } },
        { status: { contains: "processed" } },
      ],
    },
  });

  console.log(
    JSON.stringify(
      {
        ok: order?.paymentStatus === "paid",
        orderId,
        paymentStatus: order?.paymentStatus,
        paymentSource: order?.paymentSource,
        razorpayOrderId: rpOrder.id,
        paymentId,
        webhook: webhookBody,
        paymentLogs: logs,
      },
      null,
      2
    )
  );

  if (order?.paymentStatus !== "paid") {
    process.exit(1);
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
