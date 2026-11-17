import "server-only";

import Razorpay from "razorpay";
import { assertLiveRazorpayKeys } from "@/lib/server/env";
import { logPayment, logPaymentError } from "@/lib/server/paymentDiagnostics";
import { withTimeout } from "@/lib/server/platform/withTimeout";

export interface CreateRazorpayOrderInput {
  amountPaise: number;
  currency?: string;
  receipt: string;
  notes?: Record<string, string>;
}

export interface RazorpayOrderResult {
  id: string;
  amount: number;
  currency: string;
  status?: string;
  receipt?: string;
}

function getRazorpayCredentials(): { keyId: string; keySecret: string } {
  assertLiveRazorpayKeys();

  const keyId = (process.env.RAZORPAY_KEY_ID || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID)?.trim();
  const keySecret = process.env.RAZORPAY_KEY_SECRET?.trim();

  if (!keyId || !keySecret) {
    if (process.env.NODE_ENV === "test") {
      return { keyId: keyId || "rzp_test_mock", keySecret: keySecret || "mock_secret" };
    }
    throw new Error("Missing Razorpay env vars: RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET");
  }

  return { keyId, keySecret };
}

let prewarmPromise: Promise<void> | null = null;

/**
 * Pre-warms the TCP connection and TLS session to Razorpay's API server.
 * Calling this when a buyer enters the checkout funnel eliminates cold
 * TLS handshake latency (~150-300ms) from the order creation path.
 */
export function prewarmRazorpayConnection(): void {
  if (process.env.NODE_ENV === "test") return;
  if (prewarmPromise) return;

  prewarmPromise = (async () => {
    try {
      const res = await fetch("https://api.razorpay.com/v1/orders", {
        method: "GET",
        headers: {
          Connection: "keep-alive",
          Accept: "application/json",
        },
        signal: AbortSignal.timeout(3000),
      }).catch(() => null);
      if (res) {
        // Drain response body so undici / Node HTTP agent keeps the socket open in the keep-alive pool
        await res.text().catch(() => null);
      }
    } catch {
      // Non-blocking prewarm
    } finally {
      // Re-warm periodically if checkout remains active
      const timer = setTimeout(() => {
        prewarmPromise = null;
      }, 45_000);
      timer?.unref?.();
    }
  })();
}

/**
 * Creates a Razorpay payment order.
 *
 * In production/runtime: Uses direct HTTP fetch with persistent keep-alive and strict abort signal first.
 * Persistent keep-alive eliminates cold TCP/TLS handshakes to Razorpay edge servers (~150-300ms saving).
 *
 * In test environment: Uses Razorpay SDK directly to respect unit test mocks (`vi.mock("razorpay")`).
 */
export async function createRazorpayOrder(
  input: CreateRazorpayOrderInput,
  options?: { forceDirectFetch?: boolean },
): Promise<RazorpayOrderResult> {
  const { keyId, keySecret } = getRazorpayCredentials();
  const currency = input.currency || "INR";
  const safeReceipt = (input.receipt || "").trim().slice(0, 40);

  // In test environment, defer to the Razorpay SDK by default so tests with `vi.mock("razorpay")` work as intended,
  // unless explicitly forced to test direct HTTP fetch.
  if (
    process.env.NODE_ENV === "test" &&
    !options?.forceDirectFetch &&
    process.env.TEST_RAZORPAY_DIRECT_FETCH !== "true"
  ) {
    const sdk = new Razorpay({ key_id: keyId, key_secret: keySecret });
    const sdkOrder = (await sdk.orders.create({
      amount: Math.round(input.amountPaise),
      currency,
      receipt: safeReceipt || undefined,
      notes: input.notes,
    })) as { id: string; amount?: number; currency?: string; status?: string; receipt?: string };

    return {
      id: sdkOrder.id,
      amount: sdkOrder.amount ?? input.amountPaise,
      currency: sdkOrder.currency ?? currency,
      status: sdkOrder.status,
      receipt: sdkOrder.receipt ?? safeReceipt,
    };
  }

  // 1. Direct native fetch (preferred: 100-300ms, immune to keep-alive socket deadlocks)
  const auth = Buffer.from(`${keyId}:${keySecret}`).toString("base64");
  const requestPayload = JSON.stringify({
    amount: Math.round(input.amountPaise),
    currency,
    receipt: safeReceipt || undefined,
    notes: input.notes,
  });

  const sendDirectFetch = async (timeoutMs: number): Promise<RazorpayOrderResult> => {
    const response = await fetch("https://api.razorpay.com/v1/orders", {
      method: "POST",
      headers: {
        Authorization: `Basic ${auth}`,
        "Content-Type": "application/json",
        Connection: "keep-alive",
      },
      body: requestPayload,
      signal: AbortSignal.timeout(timeoutMs),
    });

    const body = (await response.json().catch(() => null)) as {
      id?: string;
      amount?: number;
      currency?: string;
      status?: string;
      receipt?: string;
      error?: { description?: string; reason?: string; field?: string };
      message?: string;
    } | null;

    if (!response.ok) {
      const description =
        body?.error?.description ||
        body?.error?.reason ||
        body?.message ||
        `HTTP ${response.status} from Razorpay`;
      logPaymentError(new Error(description), {
        step: "razorpayClient.fetch.nonOk",
        status: response.status,
      });
      throw new Error(`Razorpay: ${description}`);
    }

    if (!body?.id) {
      throw new Error("Razorpay returned empty order id");
    }

    return {
      id: body.id,
      amount: body.amount ?? input.amountPaise,
      currency: body.currency ?? currency,
      status: body.status,
      receipt: body.receipt ?? safeReceipt,
    };
  };

  try {
    let result: RazorpayOrderResult;
    try {
      result = await sendDirectFetch(6000);
    } catch (firstAttemptError) {
      const msg =
        firstAttemptError instanceof Error ? firstAttemptError.message : String(firstAttemptError);
      if (msg.startsWith("Razorpay:")) {
        throw firstAttemptError;
      }
      logPaymentError(firstAttemptError, {
        step: "razorpayClient.fetch.retry",
        message: msg,
      });
      result = await sendDirectFetch(5000);
    }

    logPayment("Razorpay order created via direct API", {
      orderId: result.id,
      receipt: safeReceipt,
    });

    return result;
  } catch (fetchError) {
    const errorMsg = fetchError instanceof Error ? fetchError.message : String(fetchError);

    // If Razorpay explicitly returned an error (e.g. 400 Bad Request, invalid amount), don't retry with SDK
    if (errorMsg.startsWith("Razorpay:")) {
      throw fetchError;
    }

    logPaymentError(fetchError, {
      step: "razorpayClient.fetch.fallback",
      message: errorMsg,
    });

    // 2. Fallback to fresh Razorpay SDK instance
    const freshSdk = new Razorpay({ key_id: keyId, key_secret: keySecret });
    const sdkOrder = (await withTimeout(
      freshSdk.orders.create({
        amount: Math.round(input.amountPaise),
        currency,
        receipt: safeReceipt || undefined,
        notes: input.notes,
      }),
      6000,
      "Razorpay SDK order.create",
    )) as { id: string; amount: number; currency: string; status?: string; receipt?: string };

    logPayment("Razorpay order created via SDK fallback", {
      orderId: sdkOrder.id,
      receipt: safeReceipt,
    });

    return {
      id: sdkOrder.id,
      amount: sdkOrder.amount,
      currency: sdkOrder.currency,
      status: sdkOrder.status,
      receipt: sdkOrder.receipt ?? safeReceipt,
    };
  }
}

/**
 * Fetches an existing Razorpay order by id.
 */
export async function fetchRazorpayOrder(
  razorpayOrderId: string,
  options?: { forceDirectFetch?: boolean },
): Promise<RazorpayOrderResult> {
  const { keyId, keySecret } = getRazorpayCredentials();

  if (
    process.env.NODE_ENV === "test" &&
    !options?.forceDirectFetch &&
    process.env.TEST_RAZORPAY_DIRECT_FETCH !== "true"
  ) {
    const sdk = new Razorpay({ key_id: keyId, key_secret: keySecret });
    const sdkOrder = (await sdk.orders.fetch(razorpayOrderId)) as {
      id: string;
      amount?: number;
      currency?: string;
      status?: string;
      receipt?: string;
    };
    return {
      id: sdkOrder.id,
      amount: sdkOrder.amount ?? 0,
      currency: sdkOrder.currency ?? "INR",
      status: sdkOrder.status,
      receipt: sdkOrder.receipt,
    };
  }

  try {
    const auth = Buffer.from(`${keyId}:${keySecret}`).toString("base64");
    const response = await fetch(
      `https://api.razorpay.com/v1/orders/${encodeURIComponent(razorpayOrderId)}`,
      {
        method: "GET",
        headers: {
          Authorization: `Basic ${auth}`,
          Connection: "keep-alive",
        },
        signal: AbortSignal.timeout(6000),
      },
    );

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error(`Razorpay order not found: ${razorpayOrderId}`);
      }
      throw new Error(`Razorpay fetch order HTTP ${response.status}`);
    }

    const data = (await response.json()) as {
      id: string;
      amount: number;
      currency: string;
      status?: string;
      receipt?: string;
    };
    return {
      id: data.id,
      amount: data.amount,
      currency: data.currency,
      status: data.status,
      receipt: data.receipt,
    };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    if (errorMsg.includes("Razorpay order not found")) {
      throw error;
    }
    logPaymentError(error, {
      step: "razorpayClient.fetchOrder.fallback",
      message: errorMsg,
      orderId: razorpayOrderId,
    });

    const freshSdk = new Razorpay({ key_id: keyId, key_secret: keySecret });
    const sdkOrder = (await withTimeout(
      freshSdk.orders.fetch(razorpayOrderId),
      6000,
      "Razorpay SDK order.fetch",
    )) as { id: string; amount: number; currency: string; status?: string; receipt?: string };

    return {
      id: sdkOrder.id,
      amount: sdkOrder.amount,
      currency: sdkOrder.currency,
      status: sdkOrder.status,
      receipt: sdkOrder.receipt,
    };
  }
}
