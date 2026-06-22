import "server-only";

import { getAdminFirestore, isFirebaseAdminConfigured } from "@/lib/firebase/admin";
import { logError, logInfo } from "@/lib/server/logger";

export interface FirestoreHealthResult {
  ok: boolean;
  projectId?: string;
  latencyMs?: number;
  error?: string;
}

export async function verifyFirestoreConnection(): Promise<FirestoreHealthResult> {
  if (!isFirebaseAdminConfigured()) {
    return { ok: false, error: "Firebase Admin is not configured" };
  }

  const startedAt = Date.now();
  try {
    const db = getAdminFirestore();
    await db.collection("settings").doc("store").get();
    const latencyMs = Date.now() - startedAt;
    const projectId = process.env.FIREBASE_PROJECT_ID?.trim();

    logInfo("Firestore connection verified", "firestoreHealth", {
      projectId,
      latencyMs,
    });

    return { ok: true, projectId, latencyMs };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logError("Firestore connection failed", error, "firestoreHealth");
    return { ok: false, error: message };
  }
}
