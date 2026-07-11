import "server-only";



import { isPostgresConfigured, prisma } from "@/lib/db/prisma";

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

  databaseConfigured: boolean;

  databaseConnected: boolean;

  checks: {

    razorpayKeyIdPresent: boolean;

    razorpayKeySecretPresent: boolean;

    razorpayPublicKeyPresent: boolean;

    databaseUrlPresent: boolean;

  };

  databaseError?: string;

  timestamp: string;

  environment: string;

}



export async function getPaymentDiagnostics(): Promise<PaymentDiagnostics> {

  const razorpayPresence = getRazorpayEnvPresence();

  const databaseConfigured = isPostgresConfigured();



  let databaseConnected = false;

  let databaseError: string | undefined;



  if (databaseConfigured) {

    try {

      await prisma.$queryRaw`SELECT 1`;

      databaseConnected = true;

    } catch (error) {

      databaseError = error instanceof Error ? error.message : String(error);

    }

  } else {

    databaseError = "DATABASE_URL is not configured";

  }



  return {

    razorpayConfigured: isRazorpayConfigured() && razorpayPresence.publicKeyPresent,

    databaseConfigured,

    databaseConnected,

    checks: {

      razorpayKeyIdPresent: razorpayPresence.keyIdPresent,

      razorpayKeySecretPresent: razorpayPresence.keySecretPresent,

      razorpayPublicKeyPresent: razorpayPresence.publicKeyPresent,

      databaseUrlPresent: databaseConfigured,

    },

    databaseError: databaseConnected ? undefined : databaseError,

    timestamp: new Date().toISOString(),

    environment: process.env.VERCEL_ENV ?? process.env.NODE_ENV ?? "unknown",

  };

}

