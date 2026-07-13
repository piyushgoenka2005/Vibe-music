import { z } from "zod";

const publicEnvSchema = z.object({
  NEXT_PUBLIC_SITE_URL: z.string().url().optional(),
  NEXT_PUBLIC_RAZORPAY_KEY_ID: z.string().min(1).optional(),
});

const serverEnvSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  AUTH_SECRET: z.string().min(1).optional(),
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
  SMTP_HOST: z.string().min(1).optional(),
  SMTP_PORT: z.string().min(1).optional(),
  SMTP_USER: z.string().min(1).optional(),
  SMTP_PASS: z.string().min(1).optional(),
  SMTP_SECURE: z.enum(["true", "false"]).optional(),
  SMTP_TLS_REJECT_UNAUTHORIZED: z.enum(["true", "false"]).optional(),
  SMTP_ADMIN_TO: z.string().email().optional(),
  ADMIN_NOTIFICATION_EMAIL: z.string().email().optional(),
  GUEST_ORDER_ACCESS_SECRET: z.string().min(1).optional(),
  ALLOW_DEMO_PAYMENTS: z.enum(["true", "false"]).optional(),
  DATABASE_URL: z.string().min(1).optional(),
  RESEND_API_KEY: z.string().min(1).optional(),
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
  });

  if (!publicResult.success) {
    throw new Error(`Invalid public environment: ${formatZodErrors(publicResult.error)}`);
  }

  const serverResult = serverEnvSchema.safeParse({
    NODE_ENV: process.env.NODE_ENV,
    AUTH_SECRET: envValue(process.env.AUTH_SECRET),
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
    SMTP_HOST: envValue(process.env.SMTP_HOST),
    SMTP_PORT: envValue(process.env.SMTP_PORT),
    SMTP_USER: envValue(process.env.SMTP_USER),
    SMTP_PASS: envValue(process.env.SMTP_PASS),
    SMTP_SECURE: envValue(process.env.SMTP_SECURE) as "true" | "false" | undefined,
    SMTP_TLS_REJECT_UNAUTHORIZED: envValue(
      process.env.SMTP_TLS_REJECT_UNAUTHORIZED
    ) as "true" | "false" | undefined,
    SMTP_ADMIN_TO: envValue(process.env.SMTP_ADMIN_TO),
    ADMIN_NOTIFICATION_EMAIL: envValue(process.env.ADMIN_NOTIFICATION_EMAIL),
    GUEST_ORDER_ACCESS_SECRET: envValue(process.env.GUEST_ORDER_ACCESS_SECRET),
    ALLOW_DEMO_PAYMENTS: envValue(process.env.ALLOW_DEMO_PAYMENTS) as
      | "true"
      | "false"
      | undefined,
    DATABASE_URL: envValue(process.env.DATABASE_URL),
    RESEND_API_KEY: envValue(process.env.RESEND_API_KEY),
  });

  if (!serverResult.success) {
    throw new Error(`Invalid server environment: ${formatZodErrors(serverResult.error)}`);
  }

  if (serverResult.data.NODE_ENV === "production" && !isProductionBuildPhase()) {
    const productionResult = productionRequiredSchema.safeParse({
      NEXT_PUBLIC_SITE_URL: envValue(process.env.NEXT_PUBLIC_SITE_URL),
      AUTH_SECRET: envValue(process.env.AUTH_SECRET),
      DATABASE_URL: envValue(process.env.DATABASE_URL),
      NEXT_PUBLIC_RAZORPAY_KEY_ID: envValue(process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID),
      RAZORPAY_KEY_ID: envValue(process.env.RAZORPAY_KEY_ID),
      RAZORPAY_KEY_SECRET: envValue(process.env.RAZORPAY_KEY_SECRET),
      RAZORPAY_WEBHOOK_SECRET: envValue(process.env.RAZORPAY_WEBHOOK_SECRET),
      GUEST_ORDER_ACCESS_SECRET: envValue(process.env.GUEST_ORDER_ACCESS_SECRET),
      SMTP_HOST: envValue(process.env.SMTP_HOST) ?? (envValue(process.env.RESEND_API_KEY) ? "smtp.resend.com" : undefined),
      SMTP_USER: envValue(process.env.SMTP_USER) ?? (envValue(process.env.RESEND_API_KEY) ? "resend" : undefined),
      SMTP_PASS: envValue(process.env.SMTP_PASS) ?? envValue(process.env.RESEND_API_KEY),
    });

    if (!productionResult.success) {
      throw new Error(
        `Missing production environment: ${formatZodErrors(productionResult.error)}`
      );
    }

    if (serverResult.data.ALLOW_DEMO_PAYMENTS === "true") {
      throw new Error("ALLOW_DEMO_PAYMENTS must not be enabled in production");
    }

    const authUrl = envValue(process.env.AUTH_URL);
    if (authUrl && /localhost|127\.0\.0\.1/i.test(authUrl)) {
      throw new Error(
        "AUTH_URL must be the public site URL in production (not localhost). Set AUTH_URL=https://vibemusic.in or omit it."
      );
    }

    const siteUrl = envValue(process.env.NEXT_PUBLIC_SITE_URL);
    if (siteUrl && /localhost|127\.0\.0\.1/i.test(siteUrl)) {
      throw new Error(
        "NEXT_PUBLIC_SITE_URL must be the public site URL in production (not localhost)."
      );
    }
  }

  validated = true;
}
