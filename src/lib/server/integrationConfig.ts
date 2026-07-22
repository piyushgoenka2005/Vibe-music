import { isSmtpConfigured } from "@/lib/server/email/smtpConfig";
import { isPostgresConfigured } from "@/lib/db/postgresConfig";
import { isGoogleAuthConfigured } from "@/lib/auth/google-config";
import { isRazorpayConfigured, isDemoPaymentsAllowed } from "@/lib/server/env";
import {
  isClientAnalyticsConfigured,
  isServerAnalyticsConfigured,
} from "@/lib/analytics/config";
import { isGooglePlacesConfigured } from "@/lib/server/googlePlaces";

export type IntegrationStatus = "ok" | "missing" | "partial";
export type IntegrationTier = "required" | "recommended" | "optional";

export interface IntegrationCheckItem {
  key: string;
  label: string;
  status: IntegrationStatus;
  tier: IntegrationTier;
  detail: string;
}

export interface IntegrationChecks {
  database: IntegrationStatus;
  auth: IntegrationStatus;
  smtp: IntegrationStatus;
  razorpay: IntegrationStatus;
  razorpayWebhook: IntegrationStatus;
  cdn: IntegrationStatus;
  upstash: IntegrationStatus;
  googleOAuth: IntegrationStatus;
  places: IntegrationStatus;
  invoicePdf: IntegrationStatus;
  guestOrderSecret: IntegrationStatus;
  analyticsClient: IntegrationStatus;
  analyticsServer: IntegrationStatus;
}

function configured(...values: Array<string | undefined>): IntegrationStatus {
  return values.every((value) => Boolean(value?.trim())) ? "ok" : "missing";
}

function secretWithMinLength(
  value: string | undefined,
  minLength: number
): IntegrationStatus {
  const trimmed = value?.trim() ?? "";
  if (!trimmed) return "missing";
  if (trimmed.length < minLength) return "partial";
  return "ok";
}

function invoicePdfStatus(): IntegrationStatus {
  const server = process.env.INVOICE_PDF_ENABLED === "true";
  const client = process.env.NEXT_PUBLIC_INVOICE_PDF_ENABLED === "true";
  if (server && client) return "ok";
  if (server || client) return "partial";
  return "missing";
}

export function getIntegrationChecks(): IntegrationChecks {
  return {
    database: isPostgresConfigured() ? "ok" : "missing",
    auth: secretWithMinLength(process.env.AUTH_SECRET, 32),
    smtp: isSmtpConfigured() ? "ok" : "missing",
    razorpay: isRazorpayConfigured() &&
      Boolean(
        process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID?.trim() ||
          process.env.RAZORPAY_KEY_ID?.trim()
      )
      ? "ok"
      : "missing",
    razorpayWebhook: configured(process.env.RAZORPAY_WEBHOOK_SECRET),
    cdn: configured(
      process.env.CDN_STORAGE_ROOT,
      process.env.CDN_PUBLIC_BASE_URL
    ),
    upstash: configured(
      process.env.UPSTASH_REDIS_REST_URL,
      process.env.UPSTASH_REDIS_REST_TOKEN
    ),
    googleOAuth: isGoogleAuthConfigured() ? "ok" : "missing",
    places: isGooglePlacesConfigured() ? "ok" : "missing",
    invoicePdf: invoicePdfStatus(),
    guestOrderSecret: secretWithMinLength(
      process.env.GUEST_ORDER_ACCESS_SECRET,
      32
    ),
    analyticsClient: isClientAnalyticsConfigured() ? "ok" : "missing",
    analyticsServer: isServerAnalyticsConfigured()
      ? "ok"
      : isClientAnalyticsConfigured()
        ? "partial"
        : "missing",
  };
}

/** Admin-facing matrix — no secret values, only ok/missing/partial. */
export function getOpsStatusReport(): {
  environment: string;
  demoPaymentsAllowed: boolean;
  items: IntegrationCheckItem[];
} {
  const checks = getIntegrationChecks();

  const items: IntegrationCheckItem[] = [
    {
      key: "database",
      label: "PostgreSQL",
      status: checks.database,
      tier: "required",
      detail: "DATABASE_URL — catalog, orders, auth sessions",
    },
    {
      key: "auth",
      label: "Auth.js secret",
      status: checks.auth,
      tier: "required",
      detail: "AUTH_SECRET (min 32 chars — shorter values show as partial)",
    },
    {
      key: "guestOrderSecret",
      label: "Guest order / invoice tokens",
      status: checks.guestOrderSecret,
      tier: "required",
      detail: "GUEST_ORDER_ACCESS_SECRET (min 32 chars — shorter values show as partial)",
    },
    {
      key: "razorpay",
      label: "Razorpay keys",
      status: checks.razorpay,
      tier: "required",
      detail: "RAZORPAY_KEY_ID / SECRET + NEXT_PUBLIC_RAZORPAY_KEY_ID",
    },
    {
      key: "razorpayWebhook",
      label: "Razorpay webhook",
      status: checks.razorpayWebhook,
      tier: "required",
      detail: "RAZORPAY_WEBHOOK_SECRET — payment status updates",
    },
    {
      key: "smtp",
      label: "Transactional email",
      status: checks.smtp,
      tier: "required",
      detail: "SMTP_* or RESEND_API_KEY — see docs/ops/SMTP.md",
    },
    {
      key: "cdn",
      label: "CDN uploads",
      status: checks.cdn,
      tier: "recommended",
      detail: "CDN_STORAGE_ROOT + CDN_PUBLIC_BASE_URL",
    },
    {
      key: "upstash",
      label: "Upstash Redis",
      status: checks.upstash,
      tier: "recommended",
      detail: "Distributed rate limits across PM2 workers",
    },
    {
      key: "googleOAuth",
      label: "Google sign-in",
      status: checks.googleOAuth,
      tier: "optional",
      detail: "AUTH_GOOGLE_ID + AUTH_GOOGLE_SECRET",
    },
    {
      key: "places",
      label: "Address autocomplete",
      status: checks.places,
      tier: "optional",
      detail:
        "GOOGLE_PLACES_API_KEY (aliases: GOOGLE_MAPS_API_KEY, NEXT_PUBLIC_GOOGLE_*_API_KEY) — manual address always works",
    },
    {
      key: "invoicePdf",
      label: "Invoice PDF download",
      status: checks.invoicePdf,
      tier: "optional",
      detail:
        "Set BOTH INVOICE_PDF_ENABLED and NEXT_PUBLIC_INVOICE_PDF_ENABLED after installing Chromium",
    },
    {
      key: "analyticsClient",
      label: "Google Analytics (client)",
      status: checks.analyticsClient,
      tier: "recommended",
      detail: "NEXT_PUBLIC_GA_MEASUREMENT_ID and/or NEXT_PUBLIC_GTM_ID",
    },
    {
      key: "analyticsServer",
      label: "Google Analytics (server purchases)",
      status: checks.analyticsServer,
      tier: "recommended",
      detail:
        "GA_MEASUREMENT_API_SECRET — Measurement Protocol for purchase dedupe when clients block scripts",
    },
  ];

  return {
    environment: process.env.NODE_ENV ?? "development",
    demoPaymentsAllowed: isDemoPaymentsAllowed(),
    items,
  };
}
