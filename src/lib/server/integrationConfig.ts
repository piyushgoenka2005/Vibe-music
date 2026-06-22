import { isFirebaseAdminConfigured } from "@/lib/firebase/admin";
import { isFirebaseClientConfigured } from "@/lib/firebase/config";

export type IntegrationStatus = "ok" | "missing";

export interface IntegrationChecks {
  firebaseAdmin: IntegrationStatus;
  firebaseClient: IntegrationStatus;
  razorpay: IntegrationStatus;
  razorpayWebhook: IntegrationStatus;
  cloudinary: IntegrationStatus;
  resend: IntegrationStatus;
  upstash: IntegrationStatus;
}

function configured(...values: Array<string | undefined>): IntegrationStatus {
  return values.every((value) => Boolean(value?.trim())) ? "ok" : "missing";
}

export function getIntegrationChecks(): IntegrationChecks {
  return {
    firebaseAdmin: isFirebaseAdminConfigured() ? "ok" : "missing",
    firebaseClient: isFirebaseClientConfigured() ? "ok" : "missing",
    razorpay: configured(
      process.env.RAZORPAY_KEY_ID,
      process.env.RAZORPAY_KEY_SECRET,
      process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID ?? process.env.RAZORPAY_KEY_ID
    ),
    razorpayWebhook: configured(process.env.RAZORPAY_WEBHOOK_SECRET),
    upstash: configured(
      process.env.UPSTASH_REDIS_REST_URL,
      process.env.UPSTASH_REDIS_REST_TOKEN
    ),
    cloudinary: configured(
      process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
      process.env.CLOUDINARY_API_KEY,
      process.env.CLOUDINARY_API_SECRET
    ),
    resend: configured(process.env.RESEND_API_KEY),
  };
}
