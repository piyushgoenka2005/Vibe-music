/**
 * Razorpay + payment ops readiness (F-14) — no new charge.
 * Checks env, optional Razorpay API reachability, and recent paid orders in DB.
 *
 * Usage:
 *   npx tsx --env-file=.env.local scripts/ops/verify-razorpay-ops.mts
 *   npx tsx --env-file=.env scripts/ops/verify-razorpay-ops.mts
 */

import { PrismaClient } from "@prisma/client";

type Check = { name: string; ok: boolean; detail: string; blocking: boolean };

const checks: Check[] = [];

function envPresent(name: string): boolean {
  return Boolean(process.env[name]?.trim());
}

function mask(value: string | undefined): string {
  if (!value) return "(missing)";
  if (value.length <= 8) return "***";
  return `${value.slice(0, 4)}…${value.slice(-4)}`;
}

const demoAllowed =
  process.env.ALLOW_DEMO_PAYMENTS === "true" ||
  process.env.ALLOW_DEMO_PAYMENTS === "1";

const keyId = process.env.RAZORPAY_KEY_ID?.trim();
const keySecret = process.env.RAZORPAY_KEY_SECRET?.trim();
const isProdRuntime = process.env.NODE_ENV === "production";
const isLiveKey = Boolean(keyId?.startsWith("rzp_live"));

checks.push({
  name: "RAZORPAY_KEY_ID",
  ok: envPresent("RAZORPAY_KEY_ID"),
  detail: mask(process.env.RAZORPAY_KEY_ID),
  blocking: true,
});
checks.push({
  name: "RAZORPAY_KEY_SECRET",
  ok: envPresent("RAZORPAY_KEY_SECRET"),
  detail: envPresent("RAZORPAY_KEY_SECRET") ? "set" : "missing",
  blocking: true,
});
checks.push({
  name: "NEXT_PUBLIC_RAZORPAY_KEY_ID",
  ok: envPresent("NEXT_PUBLIC_RAZORPAY_KEY_ID"),
  detail: mask(process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID),
  blocking: true,
});

checks.push({
  name: "RAZORPAY_WEBHOOK_SECRET",
  ok: envPresent("RAZORPAY_WEBHOOK_SECRET"),
  detail: envPresent("RAZORPAY_WEBHOOK_SECRET")
    ? "set"
    : isLiveKey || isProdRuntime
      ? "missing — required for live webhooks"
      : "missing (ok for local test keys; set on VPS)",
  blocking: !envPresent("RAZORPAY_WEBHOOK_SECRET") && (isLiveKey || isProdRuntime),
});
checks.push({
  name: "ALLOW_DEMO_PAYMENTS",
  ok: !demoAllowed || process.env.NODE_ENV !== "production",
  detail: demoAllowed ? "true (must be false in production)" : "false",
  blocking: process.env.NODE_ENV === "production" && demoAllowed,
});
checks.push({
  name: "key_id_match",
  ok:
    !envPresent("RAZORPAY_KEY_ID") ||
    !envPresent("NEXT_PUBLIC_RAZORPAY_KEY_ID") ||
    process.env.RAZORPAY_KEY_ID === process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
  detail:
    process.env.RAZORPAY_KEY_ID === process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID
      ? "public key matches secret key id"
      : "mismatch between RAZORPAY_KEY_ID and NEXT_PUBLIC_RAZORPAY_KEY_ID",
  blocking: true,
});

if (keyId && keySecret) {
  try {
    const auth = Buffer.from(`${keyId}:${keySecret}`).toString("base64");
    const response = await fetch(
      "https://api.razorpay.com/v1/orders?count=1",
      {
        headers: { Authorization: `Basic ${auth}` },
      }
    );
    const ok = response.ok;
    checks.push({
      name: "razorpay_api",
      ok,
      detail: ok
        ? `HTTP ${response.status} — credentials accepted`
        : `HTTP ${response.status} — check live/test keys`,
      blocking: true,
    });

    const capturedRes = await fetch(
      "https://api.razorpay.com/v1/payments?count=1&status=captured",
      { headers: { Authorization: `Basic ${auth}` } }
    );
    const capturedJson = (await capturedRes.json()) as {
      count?: number;
      items?: unknown[];
    };
    const capturedOk =
      capturedRes.ok &&
      ((capturedJson.count ?? 0) > 0 || (capturedJson.items?.length ?? 0) > 0);
    checks.push({
      name: "razorpay_captured_history",
      ok: capturedOk,
      detail: capturedOk
        ? "merchant account has captured payment(s) — gateway proven live"
        : "no captured payments on Razorpay account yet",
      blocking: false,
    });
  } catch (error) {
    checks.push({
      name: "razorpay_api",
      ok: false,
      detail: error instanceof Error ? error.message : String(error),
      blocking: true,
    });
  }
}

if (envPresent("DATABASE_URL")) {
  const prisma = new PrismaClient();
  try {
    const paidCount = await prisma.order.count({
      where: { paymentStatus: "paid" },
    });
    const recentPaid = await prisma.order.findFirst({
      where: { paymentStatus: "paid" },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        createdAt: true,
        razorpayPaymentId: true,
        paymentSource: true,
      },
    });
    checks.push({
      name: "paid_orders_db",
      ok: paidCount > 0,
      detail:
        paidCount > 0
          ? `${paidCount} paid order(s); latest=${recentPaid?.id ?? "?"} source=${recentPaid?.paymentSource ?? "?"} paymentId=${recentPaid?.razorpayPaymentId ? "set" : "missing"}`
          : "0 paid orders — place one live Razorpay order to close F-14",
      blocking: false,
    });

    const webhookEvents = await prisma.paymentLog.count({
      where: {
        OR: [
          { eventType: { contains: "payment" } },
          { status: { contains: "processed" } },
        ],
      },
    });

    checks.push({
      name: "webhook_activity",
      ok: webhookEvents > 0 || paidCount > 0,
      detail:
        webhookEvents > 0
          ? `${webhookEvents} payment_log row(s)`
          : paidCount > 0
            ? "paid orders exist (no payment_logs yet — confirm webhook URL in Razorpay dashboard)"
            : "no payment_logs yet — confirm Razorpay dashboard webhook → /api/payment/webhook/razorpay",
      blocking: false,
    });
  } catch (error) {
    checks.push({
      name: "database",
      ok: false,
      detail: error instanceof Error ? error.message : String(error),
      blocking: false,
    });
  } finally {
    await prisma.$disconnect();
  }
} else {
  checks.push({
    name: "DATABASE_URL",
    ok: false,
    detail: "missing — skip paid-order probe",
    blocking: false,
  });
}

console.log("\nVibe Music — Razorpay ops readiness (no charge)\n");
for (const check of checks) {
  const mark = check.ok ? "OK  " : check.blocking ? "FAIL" : "WARN";
  console.log(`${mark}  ${check.name.padEnd(28)} ${check.detail}`);
}

const failed = checks.filter((c) => !c.ok && c.blocking);
const warn = checks.filter((c) => !c.ok && !c.blocking);

console.log(`
If paid_orders_db is still WARN, run on VPS:
  npm run verify:f14-payment-proof
Then re-run: npm run verify:razorpay-ops
`);

if (failed.length > 0) {
  console.log(`${failed.length} blocking check(s) failed.\n`);
  process.exit(1);
}

console.log(
  warn.length === 0
    ? "All Razorpay ops checks passed (including at least one paid order).\n"
    : `Credentials OK. ${warn.length} non-blocking warning(s).\n`
);
process.exit(0);
