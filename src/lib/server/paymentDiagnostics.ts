import "server-only";

import { getAdminFirestore, isFirebaseAdminConfigured } from "@/lib/firebase/admin";
import { isRazorpayConfigured } from "@/lib/server/env";

export function logPayment(
  message: string,
  meta?: Record<string, unknown>
): void {
  if (meta) {
    console.log(`[PAYMENT] ${message}`, meta);
    return;
  }
  console.log(`[PAYMENT] ${message}`);
}

export function logPaymentError(
  error: unknown,
  meta?: Record<string, unknown>
): void {
  console.error("[PAYMENT_ERROR]", {
    message: error instanceof Error ? error.message : String(error),
    stack: error instanceof Error ? error.stack : undefined,
    ...meta,
  });
}

export function getRazorpayEnvPresence(): {
  keyIdPresent: boolean;
  keySecretPresent: boolean;
  publicKeyPresent: boolean;
} {
  return {
    keyIdPresent: Boolean(process.env.RAZORPAY_KEY_ID?.trim()),
    keySecretPresent: Boolean(process.env.RAZORPAY_KEY_SECRET?.trim()),
    publicKeyPresent: Boolean(
      process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID?.trim() ||
        process.env.RAZORPAY_KEY_ID?.trim()
    ),
  };
}

export function logRazorpayEnvPresence(): void {
  const presence = getRazorpayEnvPresence();
  logPayment("Razorpay env check", {
    keyIdPresent: presence.keyIdPresent,
    keySecretPresent: presence.keySecretPresent,
    publicKeyPresent: presence.publicKeyPresent,
  });
}

export interface PaymentDiagnostics {
  razorpayConfigured: boolean;
  firebaseConfigured: boolean;
  firestoreConnected: boolean;
  checks: {
    razorpayKeyIdPresent: boolean;
    razorpayKeySecretPresent: boolean;
    razorpayPublicKeyPresent: boolean;
    firebaseProjectIdPresent: boolean;
    firebaseClientEmailPresent: boolean;
    firebasePrivateKeyPresent: boolean;
    firebasePrivateKeyHasLiteralNewlines: boolean;
    firebasePrivateKeyHasEscapedNewlines: boolean;
  };
  firestoreError?: string;
  timestamp: string;
  environment: string;
}

export async function getPaymentDiagnostics(): Promise<PaymentDiagnostics> {
  const razorpayPresence = getRazorpayEnvPresence();
  const firebaseConfigured = isFirebaseAdminConfigured();
  const privateKeyRaw = process.env.FIREBASE_PRIVATE_KEY;

  let firestoreConnected = false;
  let firestoreError: string | undefined;

  if (firebaseConfigured) {
    try {
      await getAdminFirestore().collection("settings").doc("store").get();
      firestoreConnected = true;
    } catch (error) {
      firestoreError = error instanceof Error ? error.message : String(error);
    }
  } else {
    firestoreError = "Firebase Admin is not configured";
  }

  return {
    razorpayConfigured: isRazorpayConfigured() && razorpayPresence.publicKeyPresent,
    firebaseConfigured,
    firestoreConnected,
    checks: {
      razorpayKeyIdPresent: razorpayPresence.keyIdPresent,
      razorpayKeySecretPresent: razorpayPresence.keySecretPresent,
      razorpayPublicKeyPresent: razorpayPresence.publicKeyPresent,
      firebaseProjectIdPresent: Boolean(process.env.FIREBASE_PROJECT_ID?.trim()),
      firebaseClientEmailPresent: Boolean(process.env.FIREBASE_CLIENT_EMAIL?.trim()),
      firebasePrivateKeyPresent: Boolean(privateKeyRaw?.trim()),
      firebasePrivateKeyHasLiteralNewlines: privateKeyRaw?.includes("\n") ?? false,
      firebasePrivateKeyHasEscapedNewlines: privateKeyRaw?.includes("\\n") ?? false,
    },
    firestoreError: firestoreConnected ? undefined : firestoreError,
    timestamp: new Date().toISOString(),
    environment: process.env.VERCEL_ENV ?? process.env.NODE_ENV ?? "unknown",
  };
}
