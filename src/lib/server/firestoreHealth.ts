import "server-only";

import { getAdminFirestore, isFirebaseAdminConfigured } from "@/lib/firebase/admin";
import {
  isFirestoreUnavailableError,
  isFirestoreFastFailError,
  isGlobalFirestoreCircuitOpen,
  markFirestoreUnavailable,
  withFirestoreDeadline,
} from "@/lib/server/firestoreErrors";
import { logInfo, logWarn } from "@/lib/server/logger";

export interface FirestoreHealthResult {
  ok: boolean;
  error?: string;
  usingLocalFallback?: boolean;
}

/**
 * Verifies Firestore connectivity at startup. Opens the global circuit breaker
 * on quota/unavailability so API routes fast-fail to local catalog instead of hanging.
 */
export async function verifyFirestoreConnection(): Promise<FirestoreHealthResult> {
  if (!isFirebaseAdminConfigured()) {
    const message = "Firebase Admin is not configured";
    logWarn(message, "firestoreHealth");
    return { ok: false, error: message, usingLocalFallback: true };
  }

  if (process.env.DISABLE_FIRESTORE_CATALOG === "true") {
    logInfo("Firestore catalog disabled via env — using local JSON catalog", "firestoreHealth");
    return { ok: true, usingLocalFallback: true };
  }

  if (isGlobalFirestoreCircuitOpen()) {
    return {
      ok: false,
      error: "Firestore unavailable — local catalog fallback active",
      usingLocalFallback: true,
    };
  }

  try {
    await withFirestoreDeadline(
      () => getAdminFirestore().collection("settings").doc("store").get(),
      800
    );
    return { ok: true };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Firestore connection failed";

    if (
      isFirestoreUnavailableError(error) ||
      isFirestoreFastFailError(error)
    ) {
      markFirestoreUnavailable(error);
    }

    logWarn("Firestore health check failed — using local catalog fallback", "firestoreHealth", {
      error: message,
    });

    return { ok: false, error: message, usingLocalFallback: true };
  }
}
