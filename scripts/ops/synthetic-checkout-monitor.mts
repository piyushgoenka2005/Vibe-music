#!/usr/bin/env npx tsx
/**
 * Synthetic checkout path monitor (Phase 6 / L-26).
 * Exercises storefront checkout APIs without placing a real charge.
 *
 * Usage:
 *   VERIFY_BASE_URL=https://vibemusic.in npm run monitor:checkout
 *   VERIFY_BASE_URL=http://127.0.0.1:3000 npm run monitor:checkout
 */
const BASE_URL = (process.env.VERIFY_BASE_URL ?? "https://vibemusic.in").replace(/\/$/, "");

type Check = { name: string; ok: boolean; detail: string };

async function get(path: string): Promise<{ status: number; body: unknown; text: string }> {
  const response = await fetch(`${BASE_URL}${path}`, { cache: "no-store" });
  const text = await response.text();
  try {
    return { status: response.status, body: JSON.parse(text) as unknown, text };
  } catch {
    return { status: response.status, body: text.slice(0, 200), text };
  }
}

async function post(path: string, data: unknown): Promise<{ status: number; body: unknown }> {
  const response = await fetch(`${BASE_URL}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Origin: BASE_URL },
    body: JSON.stringify(data),
    cache: "no-store",
  });
  const text = await response.text();
  try {
    return { status: response.status, body: JSON.parse(text) as unknown };
  } catch {
    return { status: response.status, body: text.slice(0, 200) };
  }
}

function record(checks: Check[], name: string, ok: boolean, detail: string): void {
  checks.push({ name, ok, detail });
}

const checks: Check[] = [];

{
  const { status, body } = await get("/api/health");
  const data = body as { status?: string };
  record(checks, "health", status === 200 && data.status === "healthy", `HTTP ${status}`);
}

{
  const { status, body } = await get("/api/checkout/capabilities");
  const data = body as { paymentMethods?: string[]; onlinePaymentsAvailable?: boolean };
  const methods = data.paymentMethods ?? [];
  record(
    checks,
    "checkout-capabilities",
    status === 200 && data.onlinePaymentsAvailable === true && methods.includes("razorpay"),
    `HTTP ${status} methods=${JSON.stringify(methods)}`,
  );
}

{
  const { status, text } = await get("/checkout");
  record(
    checks,
    "checkout-page",
    status === 200 && /checkout/i.test(text),
    `HTTP ${status}`,
  );
}

{
  const { status } = await post("/api/payment/create-order", {
    items: [],
    email: "monitor@vibemusic.test",
    paymentMethod: "razorpay",
    shippingAddress: {
      name: "Monitor",
      line1: "1 Test St",
      city: "Mumbai",
      state: "Maharashtra",
      postalCode: "400001",
      country: "IN",
    },
  });
  record(checks, "reject-empty-cart", status >= 400, `HTTP ${status} (expected 4xx)`);
}

{
  const { status, body } = await post("/api/payment/create-order", {
    items: [{ productId: "monitor-tamper", quantity: 1, price: 1, gstRate: 18 }],
    email: "monitor@vibemusic.test",
    paymentMethod: "razorpay",
    shippingAddress: {
      name: "Monitor",
      phone: "9876543210",
      line1: "1 Test St",
      city: "Mumbai",
      state: "Maharashtra",
      postalCode: "400001",
      country: "IN",
    },
  });
  const err = (body as { error?: string }).error;
  record(
    checks,
    "reject-tampered-price",
    status === 400 && Boolean(err),
    `HTTP ${status} error=${String(err ?? "").slice(0, 60)}`,
  );
}

{
  const { status } = await post("/api/coupons/validate", {
    code: "MONITOR_INVALID_COUPON",
    subtotal: 5000,
  });
  record(checks, "reject-invalid-coupon", [400, 404, 422].includes(status), `HTTP ${status}`);
}

{
  const { status, body } = await get("/api/products?limit=1");
  const products = (body as { products?: unknown[] }).products ?? [];
  record(checks, "catalog-sample", status === 200 && products.length > 0, `HTTP ${status}`);
}

console.log(`\nSynthetic checkout monitor — ${BASE_URL}\n`);
for (const check of checks) {
  console.log(`${check.ok ? "OK  " : "FAIL"}  ${check.name.padEnd(22)} ${check.detail}`);
}

const failed = checks.filter((c) => !c.ok);
if (failed.length) {
  console.log(`\n${failed.length} check(s) failed.\n`);
  process.exit(1);
}

console.log("\nSynthetic checkout monitor PASSED.\n");
