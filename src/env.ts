import { z } from "zod";

const publicEnvSchema = z.object({
  NEXT_PUBLIC_SITE_URL: z.string().url().optional(),
  NEXT_PUBLIC_RAZORPAY_KEY_ID: z.string().min(1).optional(),
  NEXT_PUBLIC_META_PIXEL_ID: z.string().min(1).optional(),
  NEXT_PUBLIC_GA_MEASUREMENT_ID: z.string().min(1).optional(),
  NEXT_PUBLIC_GTM_ID: z.string().min(1).optional(),
  NEXT_PUBLIC_CDN_PUBLIC_BASE_URL: z.string().min(1).optional(),
  NEXT_PUBLIC_ENABLE_PWA: z.enum(["true", "false"]).optional(),
  NEXT_PUBLIC_ENABLE_PAGE_LOAD_SPLASH: z.enum(["true", "false"]).optional(),
  NEXT_PUBLIC_ENABLE_SPLASH_CURSOR: z.enum(["true", "false"]).optional(),
  NEXT_PUBLIC_CRISP_WEBSITE_ID: z.string().min(1).optional(),
  NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION: z.string().min(1).optional(),
  NEXT_PUBLIC_META_DOMAIN_VERIFICATION: z.string().min(1).optional(),
  NEXT_PUBLIC_STORE_PHONE: z.string().min(1).optional(),
  NEXT_PUBLIC_GSTIN: z.string().min(1).optional(),
  NEXT_PUBLIC_VAPID_PUBLIC_KEY: z.string().min(1).optional(),
  NEXT_PUBLIC_WEB3FORMS_ACCESS_KEY: z.string().min(1).optional(),
  NEXT_PUBLIC_WEB_VITALS_ENDPOINT: z.string().min(1).optional(),
  NEXT_PUBLIC_INVOICE_PDF_ENABLED: z.enum(["true", "false"]).optional(),
});

const serverEnvSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  AUTH_SECRET: z.string().min(1).optional(),
  NEXTAUTH_SECRET: z.string().min(1).optional(),
  AUTH_URL: z.string().url().optional(),
  AUTH_GOOGLE_ID: z.string().min(1).optional(),
  AUTH_GOOGLE_SECRET: z.string().min(1).optional(),
  GOOGLE_CLIENT_ID: z.string().min(1).optional(),
  GOOGLE_CLIENT_SECRET: z.string().min(1).optional(),
  CDN_STORAGE_ROOT: z.string().min(1).optional(),
  CDN_PUBLIC_BASE_URL: z.string().url().optional(),
  RAZORPAY_KEY_ID: z.string().min(1).optional(),
  RAZORPAY_KEY_SECRET: z.string().min(1).optional(),
  RAZORPAY_WEBHOOK_SECRET: z.string().min(1).optional(),
  UPSTASH_REDIS_REST_URL: z.string().url().optional(),
  UPSTASH_REDIS_REST_TOKEN: z.string().min(1).optional(),
  REDIS_URL: z.string().min(1).optional(),
  SENTRY_DSN: z.string().url().optional(),
  ERROR_MONITORING_WEBHOOK_URL: z.string().url().optional(),
  SMTP_HOST: z.string().min(1).optional(),
  SMTP_PORT: z.string().min(1).optional(),
  SMTP_USER: z.string().min(1).optional(),
  SMTP_PASS: z.string().min(1).optional(),
  SMTP_SECURE: z.enum(["true", "false"]).optional(),
  SMTP_TLS_REJECT_UNAUTHORIZED: z.enum(["true", "false"]).optional(),
  SMTP_ADMIN_TO: z.string().email().optional(),
  ADMIN_NOTIFICATION_EMAIL: z.string().email().optional(),
  ADMIN_EMAILS: z.string().optional(),
  ADMIN_EMAIL: z.string().optional(),
  GUEST_ORDER_ACCESS_SECRET: z.string().min(1).optional(),
  INVOICE_ACCESS_SECRET: z.string().min(1).optional(),
  ALLOW_DEMO_PAYMENTS: z.enum(["true", "false"]).optional(),
  ALLOW_TEST_RAZORPAY: z.enum(["true", "false"]).optional(),
  METRICS_SCRAPE_TOKEN: z.string().min(1).optional(),
  GOOGLE_PLACES_API_KEY: z.string().min(1).optional(),
  DATABASE_URL: z.string().min(1).optional(),
  RESEND_API_KEY: z.string().min(1).optional(),
  META_CAPI_ACCESS_TOKEN: z.string().min(1).optional(),
  META_TEST_EVENT_CODE: z.string().min(1).optional(),
  GA_MEASUREMENT_API_SECRET: z.string().min(1).optional(),
  GA_MEASUREMENT_ID: z.string().min(1).optional(),
  GTM_ID: z.string().min(1).optional(),
  VAPID_PRIVATE_KEY: z.string().min(1).optional(),
  VAPID_SUBJECT: z.string().min(1).optional(),
  STORE_GSTIN: z.string().min(1).optional(),
  STORE_PHONE: z.string().min(1).optional(),
  SMS_PROVIDER: z.string().min(1).optional(),
  MSG91_AUTH_KEY: z.string().min(1).optional(),
  MSG91_SENDER_ID: z.string().min(1).optional(),
  WHATSAPP_TOKEN: z.string().min(1).optional(),
  WHATSAPP_PHONE_NUMBER_ID: z.string().min(1).optional(),
  ALLOW_LARGE_PRICE_CHANGES: z.string().min(1).optional(),
  ALLOW_JSON_CATALOG_FALLBACK: z.string().min(1).optional(),
  E2E_TEST_MODE: z.enum(["true", "false"]).optional(),
});

const productionRequiredSchema = z.object({
  NEXT_PUBLIC_SITE_URL: z.string().url(),
  AUTH_SECRET: z.string().min(32),
  DATABASE_URL: z.string().min(1),
  NEXT_PUBLIC_RAZORPAY_KEY_ID: z.string().min(1),
  RAZORPAY_KEY_ID: z.string().min(1),
  RAZORPAY_KEY_SECRET: z.string().min(1),
  RAZORPAY_WEBHOOK_SECRET: z.string().min(1),
  GUEST_ORDER_ACCESS_SECRET: z.string().min(32),
  SMTP_HOST: z.string().min(1),
  SMTP_USER: z.string().min(1),
  SMTP_PASS: z.string().min(1),
  UPSTASH_REDIS_REST_URL: z.string().url(),
  UPSTASH_REDIS_REST_TOKEN: z.string().min(1),
  SENTRY_DSN: z.string().url().optional(),
});

export type PublicEnv = z.infer<typeof publicEnvSchema>;
export type ServerEnv = z.infer<typeof serverEnvSchema>;

let validated = false;

/** Next.js sets this during `next build`; skip strict production checks until runtime. */
function isProductionBuildPhase(): boolean {
  return (
    process.env.NEXT_PHASE === "phase-production-build" ||
    process.env.NEXT_PRIVATE_BUILD_WORKER === "1"
  );
}

/** Treat blank env values as unset — `.env.local` often has `KEY=` placeholders. */
function envValue(value: string | undefined): string | undefined {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

function formatZodErrors(error: z.ZodError): string {
  return error.issues
    .map((issue) => `${issue.path.join(".") || "env"}: ${issue.message}`)
    .join("; ");
}

export function validateEnv(): void {
  if (validated) return;

  const publicResult = publicEnvSchema.safeParse({
    NEXT_PUBLIC_SITE_URL: envValue(process.env.NEXT_PUBLIC_SITE_URL),
    NEXT_PUBLIC_RAZORPAY_KEY_ID: envValue(process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID),
    NEXT_PUBLIC_META_PIXEL_ID: envValue(process.env.NEXT_PUBLIC_META_PIXEL_ID),
    NEXT_PUBLIC_GA_MEASUREMENT_ID: envValue(process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID),
    NEXT_PUBLIC_GTM_ID: envValue(process.env.NEXT_PUBLIC_GTM_ID),
    NEXT_PUBLIC_CDN_PUBLIC_BASE_URL: envValue(process.env.NEXT_PUBLIC_CDN_PUBLIC_BASE_URL),
    NEXT_PUBLIC_ENABLE_PWA: envValue(process.env.NEXT_PUBLIC_ENABLE_PWA) as
      "true" | "false" | undefined,
    NEXT_PUBLIC_ENABLE_PAGE_LOAD_SPLASH: envValue(
      process.env.NEXT_PUBLIC_ENABLE_PAGE_LOAD_SPLASH,
    ) as "true" | "false" | undefined,
    NEXT_PUBLIC_ENABLE_SPLASH_CURSOR: envValue(process.env.NEXT_PUBLIC_ENABLE_SPLASH_CURSOR) as
      "true" | "false" | undefined,
    NEXT_PUBLIC_CRISP_WEBSITE_ID: envValue(process.env.NEXT_PUBLIC_CRISP_WEBSITE_ID),
    NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION: envValue(
      process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION,
    ),
    NEXT_PUBLIC_META_DOMAIN_VERIFICATION: envValue(
      process.env.NEXT_PUBLIC_META_DOMAIN_VERIFICATION,
    ),
    NEXT_PUBLIC_STORE_PHONE: envValue(process.env.NEXT_PUBLIC_STORE_PHONE),
    NEXT_PUBLIC_GSTIN: envValue(process.env.NEXT_PUBLIC_GSTIN),
    NEXT_PUBLIC_VAPID_PUBLIC_KEY: envValue(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY),
    NEXT_PUBLIC_WEB3FORMS_ACCESS_KEY: envValue(process.env.NEXT_PUBLIC_WEB3FORMS_ACCESS_KEY),
    NEXT_PUBLIC_WEB_VITALS_ENDPOINT: envValue(process.env.NEXT_PUBLIC_WEB_VITALS_ENDPOINT),
    NEXT_PUBLIC_INVOICE_PDF_ENABLED: envValue(process.env.NEXT_PUBLIC_INVOICE_PDF_ENABLED) as
      "true" | "false" | undefined,
  });

  if (!publicResult.success) {
    throw new Error(`Invalid public environment: ${formatZodErrors(publicResult.error)}`);
  }

  const serverResult = serverEnvSchema.safeParse({
    NODE_ENV: process.env.NODE_ENV,
    AUTH_SECRET: envValue(process.env.AUTH_SECRET) ?? envValue(process.env.NEXTAUTH_SECRET),
    NEXTAUTH_SECRET: envValue(process.env.NEXTAUTH_SECRET),
    AUTH_URL: envValue(process.env.AUTH_URL),
    AUTH_GOOGLE_ID: envValue(process.env.AUTH_GOOGLE_ID),
    AUTH_GOOGLE_SECRET: envValue(process.env.AUTH_GOOGLE_SECRET),
    GOOGLE_CLIENT_ID: envValue(process.env.GOOGLE_CLIENT_ID),
    GOOGLE_CLIENT_SECRET: envValue(process.env.GOOGLE_CLIENT_SECRET),
    CDN_STORAGE_ROOT: envValue(process.env.CDN_STORAGE_ROOT),
    CDN_PUBLIC_BASE_URL: envValue(process.env.CDN_PUBLIC_BASE_URL),
    RAZORPAY_KEY_ID: envValue(process.env.RAZORPAY_KEY_ID),
    RAZORPAY_KEY_SECRET: envValue(process.env.RAZORPAY_KEY_SECRET),
    RAZORPAY_WEBHOOK_SECRET: envValue(process.env.RAZORPAY_WEBHOOK_SECRET),
    UPSTASH_REDIS_REST_URL: envValue(process.env.UPSTASH_REDIS_REST_URL),
    UPSTASH_REDIS_REST_TOKEN: envValue(process.env.UPSTASH_REDIS_REST_TOKEN),
    REDIS_URL: envValue(process.env.REDIS_URL),
    SENTRY_DSN: envValue(process.env.SENTRY_DSN),
    ERROR_MONITORING_WEBHOOK_URL: envValue(process.env.ERROR_MONITORING_WEBHOOK_URL),
    SMTP_HOST: envValue(process.env.SMTP_HOST),
    SMTP_PORT: envValue(process.env.SMTP_PORT),
    SMTP_USER: envValue(process.env.SMTP_USER),
    SMTP_PASS: envValue(process.env.SMTP_PASS),
    SMTP_SECURE: envValue(process.env.SMTP_SECURE) as "true" | "false" | undefined,
    SMTP_TLS_REJECT_UNAUTHORIZED: envValue(process.env.SMTP_TLS_REJECT_UNAUTHORIZED) as
      "true" | "false" | undefined,
    SMTP_ADMIN_TO: envValue(process.env.SMTP_ADMIN_TO),
    ADMIN_NOTIFICATION_EMAIL: envValue(process.env.ADMIN_NOTIFICATION_EMAIL),
    ADMIN_EMAILS: envValue(process.env.ADMIN_EMAILS),
    ADMIN_EMAIL: envValue(process.env.ADMIN_EMAIL),
    GUEST_ORDER_ACCESS_SECRET:
      envValue(process.env.GUEST_ORDER_ACCESS_SECRET) ??
      envValue(process.env.INVOICE_ACCESS_SECRET),
    INVOICE_ACCESS_SECRET: envValue(process.env.INVOICE_ACCESS_SECRET),
    ALLOW_DEMO_PAYMENTS: envValue(process.env.ALLOW_DEMO_PAYMENTS) as "true" | "false" | undefined,
    ALLOW_TEST_RAZORPAY: envValue(process.env.ALLOW_TEST_RAZORPAY) as "true" | "false" | undefined,
    METRICS_SCRAPE_TOKEN: envValue(process.env.METRICS_SCRAPE_TOKEN),
    GOOGLE_PLACES_API_KEY: envValue(process.env.GOOGLE_PLACES_API_KEY),
    DATABASE_URL: envValue(process.env.DATABASE_URL),
    RESEND_API_KEY: envValue(process.env.RESEND_API_KEY),
    META_CAPI_ACCESS_TOKEN: envValue(process.env.META_CAPI_ACCESS_TOKEN),
    META_TEST_EVENT_CODE: envValue(process.env.META_TEST_EVENT_CODE),
    GA_MEASUREMENT_API_SECRET: envValue(process.env.GA_MEASUREMENT_API_SECRET),
    GA_MEASUREMENT_ID: envValue(process.env.GA_MEASUREMENT_ID),
    GTM_ID: envValue(process.env.GTM_ID),
    VAPID_PRIVATE_KEY: envValue(process.env.VAPID_PRIVATE_KEY),
    VAPID_SUBJECT: envValue(process.env.VAPID_SUBJECT),
    STORE_GSTIN: envValue(process.env.STORE_GSTIN),
    STORE_PHONE: envValue(process.env.STORE_PHONE),
    SMS_PROVIDER: envValue(process.env.SMS_PROVIDER),
    MSG91_AUTH_KEY: envValue(process.env.MSG91_AUTH_KEY),
    MSG91_SENDER_ID: envValue(process.env.MSG91_SENDER_ID),
    WHATSAPP_TOKEN: envValue(process.env.WHATSAPP_TOKEN),
    WHATSAPP_PHONE_NUMBER_ID: envValue(process.env.WHATSAPP_PHONE_NUMBER_ID),
    ALLOW_LARGE_PRICE_CHANGES: envValue(process.env.ALLOW_LARGE_PRICE_CHANGES),
    ALLOW_JSON_CATALOG_FALLBACK: envValue(process.env.ALLOW_JSON_CATALOG_FALLBACK),
    E2E_TEST_MODE: envValue(process.env.E2E_TEST_MODE) as "true" | "false" | undefined,
  });

  if (!serverResult.success) {
    throw new Error(`Invalid server environment: ${formatZodErrors(serverResult.error)}`);
  }

  if (serverResult.data.NODE_ENV === "production" && !isProductionBuildPhase()) {
    const productionResult = productionRequiredSchema.safeParse({
      NEXT_PUBLIC_SITE_URL: envValue(process.env.NEXT_PUBLIC_SITE_URL),
      AUTH_SECRET: envValue(process.env.AUTH_SECRET) ?? envValue(process.env.NEXTAUTH_SECRET),
      DATABASE_URL: envValue(process.env.DATABASE_URL),
      NEXT_PUBLIC_RAZORPAY_KEY_ID: envValue(process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID),
      RAZORPAY_KEY_ID: envValue(process.env.RAZORPAY_KEY_ID),
      RAZORPAY_KEY_SECRET: envValue(process.env.RAZORPAY_KEY_SECRET),
      RAZORPAY_WEBHOOK_SECRET: envValue(process.env.RAZORPAY_WEBHOOK_SECRET),
      GUEST_ORDER_ACCESS_SECRET:
        envValue(process.env.GUEST_ORDER_ACCESS_SECRET) ??
        envValue(process.env.INVOICE_ACCESS_SECRET),
      SMTP_HOST:
        envValue(process.env.SMTP_HOST) ??
        (envValue(process.env.RESEND_API_KEY) ? "smtp.resend.com" : undefined),
      SMTP_USER:
        envValue(process.env.SMTP_USER) ??
        (envValue(process.env.RESEND_API_KEY) ? "resend" : undefined),
      SMTP_PASS: envValue(process.env.SMTP_PASS) ?? envValue(process.env.RESEND_API_KEY),
      UPSTASH_REDIS_REST_URL: envValue(process.env.UPSTASH_REDIS_REST_URL),
      UPSTASH_REDIS_REST_TOKEN: envValue(process.env.UPSTASH_REDIS_REST_TOKEN),
    });

    if (!productionResult.success) {
      throw new Error(`Missing production environment: ${formatZodErrors(productionResult.error)}`);
    }

    if (serverResult.data.ALLOW_DEMO_PAYMENTS === "true") {
      throw new Error("ALLOW_DEMO_PAYMENTS must not be enabled in production");
    }

    if (envValue(process.env.E2E_TEST_MODE) === "true") {
      throw new Error("E2E_TEST_MODE must not be enabled in production");
    }

    const jsonCatalogFlag = envValue(process.env.ALLOW_JSON_CATALOG_FALLBACK)?.toLowerCase();
    if (jsonCatalogFlag === "true" || jsonCatalogFlag === "1") {
      throw new Error("ALLOW_JSON_CATALOG_FALLBACK must not be enabled in production");
    }

    const razorpayKeyId = envValue(process.env.RAZORPAY_KEY_ID);
    const razorpayPublicKeyId = envValue(process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID);
    if (razorpayKeyId && razorpayPublicKeyId && razorpayKeyId !== razorpayPublicKeyId) {
      throw new Error("RAZORPAY_KEY_ID and NEXT_PUBLIC_RAZORPAY_KEY_ID must match in production.");
    }
    const siteUrl = (envValue(process.env.NEXT_PUBLIC_SITE_URL) || "").toLowerCase();
    const isVibeProd = siteUrl.includes("vibemusic.in");
    const allowTest = envValue(process.env.ALLOW_TEST_RAZORPAY) === "true";
    if (isVibeProd && !allowTest) {
      if (razorpayKeyId && !razorpayKeyId.startsWith("rzp_live_")) {
        throw new Error("Production requires live Razorpay keys (rzp_live_…).");
      }
      if (razorpayPublicKeyId && !razorpayPublicKeyId.startsWith("rzp_live_")) {
        throw new Error(
          "NEXT_PUBLIC_RAZORPAY_KEY_ID must be a live key (rzp_live_…) in production.",
        );
      }
    }

    const authUrl = envValue(process.env.AUTH_URL);
    if (authUrl && /localhost|127\.0\.0\.1/i.test(authUrl)) {
      throw new Error(
        "AUTH_URL must be the public site URL in production (not localhost). Set AUTH_URL=https://vibemusic.in or omit it.",
      );
    }

    if (siteUrl && /localhost|127\.0\.0\.1/i.test(siteUrl)) {
      throw new Error(
        "NEXT_PUBLIC_SITE_URL must be the public site URL in production (not localhost).",
      );
    }
  }

  validated = true;
}

/** @internal Vitest only — allows re-running validateEnv with different process.env. */
export function resetEnvValidationForTests(): void {
  validated = false;
}
