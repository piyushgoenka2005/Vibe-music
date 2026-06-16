import { isFirebaseAdminConfigured } from "@/lib/firebase/admin";
import { isFirebaseClientConfigured } from "@/lib/firebase/config";

export type IntegrationStatus = "ok" | "missing";

export interface IntegrationChecks {
  firebaseAdmin: IntegrationStatus;
  firebaseClient: IntegrationStatus;
  razorpay: IntegrationStatus;
  cloudinary: IntegrationStatus;
  resend: IntegrationStatus;
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
    cloudinary: configured(
      process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
      process.env.CLOUDINARY_API_KEY,
      process.env.CLOUDINARY_API_SECRET
    ),
    resend: configured(process.env.RESEND_API_KEY),
  };
}
