#!/usr/bin/env node
/**
 * Ensure Razorpay webhook exists for vibemusic.in and RAZORPAY_WEBHOOK_SECRET is set on the VPS.
 * Run on the server: node scripts/ops/setup/ensure-razorpay-webhook-vps.mjs
 * Does not print secrets.
 */
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { applyMergedEnvToProcess } from "../load-merged-env.mjs";

const WEBHOOK_URL = "https://vibemusic.in/api/payment/webhook/razorpay";
const REQUIRED_EVENTS = [
  "payment.authorized",
  "payment.captured",
  "payment.failed",
  "refund.created",
  "refund.processed",
];

function upsertEnv(file, key, value) {
  const filePath = path.join(process.cwd(), file);
  let content = fs.existsSync(filePath) ? fs.readFileSync(filePath, "utf8") : "";
  const line = `${key}=${value}`;
  const pattern = new RegExp(`^${key}=.*$`, "m");
  content = pattern.test(content)
    ? content.replace(pattern, line)
    : `${content.trimEnd()}\n${line}\n`;
  fs.writeFileSync(filePath, content);
}

applyMergedEnvToProcess();

const keyId = process.env.RAZORPAY_KEY_ID?.trim();
const keySecret = process.env.RAZORPAY_KEY_SECRET?.trim();
const existingSecret = process.env.RAZORPAY_WEBHOOK_SECRET?.trim();

if (!keyId || !keySecret) {
  console.error("RAZORPAY_KEY_ID / RAZORPAY_KEY_SECRET missing");
  process.exit(1);
}

if (!keyId.startsWith("rzp_live_")) {
  console.error("Production requires live Razorpay keys");
  process.exit(1);
}

if (existingSecret && existingSecret.length >= 8) {
  console.log("RAZORPAY_WEBHOOK_SECRET already set — skipping");
  process.exit(0);
}

const auth = Buffer.from(`${keyId}:${keySecret}`).toString("base64");

async function razorpay(pathname, init = {}) {
  const response = await fetch(`https://api.razorpay.com${pathname}`, {
    ...init,
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/json",
      ...(init.headers ?? {}),
    },
  });
  const text = await response.text();
  let body;
  try {
    body = text ? JSON.parse(text) : {};
  } catch {
    body = { raw: text };
  }
  if (!response.ok) {
    throw new Error(`${pathname} ${response.status}: ${body.error?.description ?? text}`);
  }
  return body;
}

function buildEventsMap(raw) {
  const events =
    raw && typeof raw === "object" && !Array.isArray(raw)
      ? { ...raw }
      : Array.isArray(raw)
        ? Object.fromEntries(raw.filter((name) => typeof name === "string").map((name) => [name, true]))
        : {};
  for (const name of REQUIRED_EVENTS) {
    events[name] = true;
  }
  return events;
}

const secret = crypto.randomBytes(24).toString("hex");
const list = await razorpay("/v1/webhooks");
const items = Array.isArray(list.items) ? list.items : [];
const match = items.find((item) => String(item.url ?? "").includes("vibemusic.in"));

let events = buildEventsMap(null);
if (match?.id) {
  const detail = await razorpay(`/v1/webhooks/${match.id}`);
  events = buildEventsMap(detail.events ?? match.events);
}

if (match?.id) {
  await razorpay(`/v1/webhooks/${match.id}`, {
    method: "PUT",
    body: JSON.stringify({
      url: WEBHOOK_URL,
      secret,
      active: true,
      events,
    }),
  });
  console.log(`Updated Razorpay webhook ${match.id}`);
} else {
  await razorpay("/v1/webhooks", {
    method: "POST",
    body: JSON.stringify({
      url: WEBHOOK_URL,
      secret,
      active: true,
      events: buildEventsMap(null),
    }),
  });
  console.log("Created Razorpay webhook for vibemusic.in");
}

upsertEnv(".env", "RAZORPAY_WEBHOOK_SECRET", secret);
upsertEnv("deploy/ops-secrets.env", "RAZORPAY_WEBHOOK_SECRET", secret);
console.log("RAZORPAY_WEBHOOK_SECRET saved to .env and deploy/ops-secrets.env");
