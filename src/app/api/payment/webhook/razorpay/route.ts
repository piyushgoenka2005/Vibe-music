import { NextResponse } from "next/server";
import {
  getRazorpayWebhookSecret,
  verifyRazorpayWebhookSignature,
} from "@/lib/razorpay/signature";
import { processRazorpayWebhook } from "@/lib/server/razorpayWebhookService";

export const runtime = "nodejs";

function isRetryableError(error: unknown): boolean {
  if (!(error instanceof Error)) return true;
  const message = error.message.toLowerCase();
  if (message.includes("not found")) return false;
  if (message.includes("mismatch")) return false;
  if (message.includes("invalid")) return false;
  return true;
}

export async function POST(request: Request) {
  const signature = request.headers.get("x-razorpay-signature");
  const eventId = request.headers.get("x-razorpay-event-id");

  if (!signature) {
    return NextResponse.json(
      { error: "Missing X-Razorpay-Signature header" },
      { status: 400 }
    );
  }

  if (!eventId) {
    return NextResponse.json(
      { error: "Missing X-Razorpay-Event-Id header" },
      { status: 400 }
    );
  }

  let rawBody: string;
  try {
    rawBody = await request.text();
  } catch {
    return NextResponse.json({ error: "Unable to read request body" }, { status: 400 });
  }

  let webhookSecret: string;
  try {
    webhookSecret = getRazorpayWebhookSecret();
  } catch (error) {
    console.error("[razorpay-webhook] Configuration error:", error);
    return NextResponse.json(
      { error: "Webhook secret not configured" },
      { status: 500 }
    );
  }

  const isValid = verifyRazorpayWebhookSignature(rawBody, signature, webhookSecret);
  if (!isValid) {
    return NextResponse.json({ error: "Invalid webhook signature" }, { status: 400 });
  }

  let body: { event?: string; payload?: Record<string, unknown> };
  try {
    body = JSON.parse(rawBody) as { event?: string; payload?: Record<string, unknown> };
  } catch {
    return NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 });
  }

  const eventType = body.event;
  if (!eventType) {
    return NextResponse.json({ error: "Missing event type" }, { status: 400 });
  }

  const payload = body.payload ?? {};

  try {
    const result = await processRazorpayWebhook({
      eventId,
      eventType,
      payload,
    });

    return NextResponse.json({
      ok: true,
      eventId: result.eventId,
      eventType: result.eventType,
      orderId: result.orderId,
      skipped: result.skipped,
      message: result.message,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Webhook processing failed";

    console.error("[razorpay-webhook] Processing error:", {
      eventId,
      eventType,
      message,
    });

    const status = isRetryableError(error) ? 500 : 422;
    return NextResponse.json({ error: message, eventId }, { status });
  }
}
