import { isSmtpConfigured } from "@/lib/server/email/smtpConfig";
import { isPostgresConfigured } from "@/lib/db/postgresConfig";

export type IntegrationStatus = "ok" | "missing";

export interface IntegrationChecks {
  database: IntegrationStatus;
  auth: IntegrationStatus;
  smtp: IntegrationStatus;
  razorpay: IntegrationStatus;
  razorpayWebhook: IntegrationStatus;
  cdn: IntegrationStatus;
  upstash: IntegrationStatus;
}

function configured(...values: Array<string | undefined>): IntegrationStatus {
  return values.every((value) => Boolean(value?.trim())) ? "ok" : "missing";
}

export function getIntegrationChecks(): IntegrationChecks {
  return {
    database: isPostgresConfigured() ? "ok" : "missing",
    auth: configured(process.env.AUTH_SECRET),
    smtp: isSmtpConfigured() ? "ok" : "missing",
    razorpay: configured(
      process.env.RAZORPAY_KEY_ID,
      process.env.RAZORPAY_KEY_SECRET,
      process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID ?? process.env.RAZORPAY_KEY_ID
    ),
    razorpayWebhook: configured(process.env.RAZORPAY_WEBHOOK_SECRET),
    cdn: configured(
      process.env.CDN_STORAGE_ROOT,
      process.env.CDN_PUBLIC_BASE_URL
    ),
    upstash: configured(
      process.env.UPSTASH_REDIS_REST_URL,
      process.env.UPSTASH_REDIS_REST_TOKEN
    ),
  };
}
