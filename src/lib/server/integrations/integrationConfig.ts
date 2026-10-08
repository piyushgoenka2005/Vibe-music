import { isSmtpConfigured } from "@/lib/server/email/smtpConfig";
import { isPostgresConfigured } from "@/lib/db/postgresConfig";
import { isGoogleAuthConfigured } from "@/lib/auth/google-config";
import {
  describeRazorpayMisconfiguration,
  isRazorpayConfigured,
  isDemoPaymentsAllowed,
} from "@/lib/server/env";
import { isClientAnalyticsConfigured, isServerAnalyticsConfigured } from "@/lib/analytics/config";
import { isMetaPixelConfigured } from "@/lib/analytics/metaPixel";
import { isMetaCapiConfigured } from "@/lib/analytics/metaCapi";
import { isGooglePlacesConfigured } from "@/lib/server/googlePlaces";
import { isAddressAutocompleteConfigured } from "@/lib/server/nominatimAddress";
import {
  crispChatStatus,
  gstinComplianceStatus,
  smsChannelStatus,
  webPushChannelStatus,
  whatsappChannelStatus,
} from "@/lib/server/integrationChannels";

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
  jobQueue: IntegrationStatus;
  errorMonitoring: IntegrationStatus;
  googleOAuth: IntegrationStatus;
  places: IntegrationStatus;
  invoicePdf: IntegrationStatus;
  guestOrderSecret: IntegrationStatus;
  analyticsClient: IntegrationStatus;
  analyticsServer: IntegrationStatus;
  metaPixel: IntegrationStatus;
  metaCapi: IntegrationStatus;
  gstin: IntegrationStatus;
  sms: IntegrationStatus;
  whatsapp: IntegrationStatus;
  webPush: IntegrationStatus;
  crisp: IntegrationStatus;
}

function configured(...values: Array<string | undefined>): IntegrationStatus {
  return values.every((value) => Boolean(value?.trim())) ? "ok" : "missing";
}

function secretWithMinLength(value: string | undefined, minLength: number): IntegrationStatus {
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
    razorpay:
      isRazorpayConfigured() &&
      Boolean(
        process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID?.trim() || process.env.RAZORPAY_KEY_ID?.trim(),
      )
        ? "ok"
        : "missing",
    razorpayWebhook: configured(process.env.RAZORPAY_WEBHOOK_SECRET),
    cdn: configured(process.env.CDN_STORAGE_ROOT, process.env.CDN_PUBLIC_BASE_URL),
    upstash: configured(process.env.UPSTASH_REDIS_REST_URL, process.env.UPSTASH_REDIS_REST_TOKEN),
    jobQueue: configured(process.env.REDIS_URL),
    errorMonitoring:
      process.env.ERROR_MONITORING_WEBHOOK_URL?.trim() || process.env.SENTRY_DSN?.trim()
        ? "ok"
        : "missing",
    googleOAuth: isGoogleAuthConfigured() ? "ok" : "missing",
    places: isAddressAutocompleteConfigured() ? "ok" : "missing",
    invoicePdf: invoicePdfStatus(),
    guestOrderSecret: secretWithMinLength(process.env.GUEST_ORDER_ACCESS_SECRET, 32),
    analyticsClient: isClientAnalyticsConfigured() ? "ok" : "missing",
    analyticsServer: isServerAnalyticsConfigured()
      ? "ok"
      : isClientAnalyticsConfigured()
        ? "partial"
        : "missing",
    metaPixel: isMetaPixelConfigured() ? "ok" : "missing",
    metaCapi: isMetaCapiConfigured() ? "ok" : isMetaPixelConfigured() ? "partial" : "missing",
    gstin: gstinComplianceStatus(),
    sms: smsChannelStatus(),
    whatsapp: whatsappChannelStatus(),
    webPush: webPushChannelStatus(),
    crisp: crispChatStatus(),
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
      detail:
        describeRazorpayMisconfiguration() ??
        "RAZORPAY_KEY_ID / SECRET + NEXT_PUBLIC_RAZORPAY_KEY_ID (live keys in production)",
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
      detail: "SMTP_* or RESEND_API_KEY — see README.md (Email section)",
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
      key: "jobQueue",
      label: "BullMQ job queue",
      status: checks.jobQueue,
      tier: "recommended",
      detail: "REDIS_URL (Redis protocol) — async Razorpay webhooks via vibe-worker",
    },
    {
      key: "errorMonitoring",
      label: "Error monitoring",
      status: checks.errorMonitoring,
      tier: "recommended",
      detail: "ERROR_MONITORING_WEBHOOK_URL (Slack/Discord) or SENTRY_DSN",
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
      detail: isGooglePlacesConfigured()
        ? "Google Places API key configured"
        : "OpenStreetMap Nominatim (India) — set GOOGLE_PLACES_API_KEY to prefer Google",
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
    {
      key: "metaPixel",
      label: "Meta Pixel (Facebook / Instagram ads)",
      status: checks.metaPixel,
      tier: "recommended",
      detail: "NEXT_PUBLIC_META_PIXEL_ID — Events Manager → Data sources → Web",
    },
    {
      key: "metaCapi",
      label: "Meta Conversions API",
      status: checks.metaCapi,
      tier: "recommended",
      detail:
        "META_CAPI_ACCESS_TOKEN (+ Pixel ID) — server Purchase + browser relay via /api/analytics/meta",
    },
    {
      key: "gstin",
      label: "GSTIN (L-30)",
      status: checks.gstin,
      tier: "required",
      detail: "NEXT_PUBLIC_GSTIN — footer, invoices, and compliance sign-off",
    },
    {
      key: "sms",
      label: "SMS (MSG91)",
      status: checks.sms,
      tier: "optional",
      detail: "SMS_PROVIDER=msg91 + MSG91_AUTH_KEY + MSG91_SENDER_ID + template IDs",
    },
    {
      key: "whatsapp",
      label: "WhatsApp Cloud API",
      status: checks.whatsapp,
      tier: "optional",
      detail: "WHATSAPP_TOKEN + WHATSAPP_PHONE_NUMBER_ID",
    },
    {
      key: "webPush",
      label: "Web push (VAPID)",
      status: checks.webPush,
      tier: "optional",
      detail: "NEXT_PUBLIC_VAPID_PUBLIC_KEY + VAPID_PRIVATE_KEY + VAPID_SUBJECT",
    },
    {
      key: "crisp",
      label: "Crisp live chat (L-04)",
      status: checks.crisp,
      tier: "optional",
      detail: "NEXT_PUBLIC_CRISP_WEBSITE_ID",
    },
  ];

  return {
    environment: process.env.NODE_ENV ?? "development",
    demoPaymentsAllowed: isDemoPaymentsAllowed(),
    items,
  };
}
