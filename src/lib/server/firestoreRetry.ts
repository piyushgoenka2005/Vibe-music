import "server-only";

import {
  isFirestoreFastFailError,
  isFirestoreUnavailableError,
} from "@/lib/server/firestoreErrors";

export interface FirestoreRetryOptions {
  maxRetries?: number;
  baseDelayMs?: number;
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isRetryableFirestoreError(error: unknown): boolean {
  if (!isFirestoreUnavailableError(error) || isFirestoreFastFailError(error)) {
    return false;
  }

  const message = error instanceof Error ? error.message : String(error);
  // Quota exhaustion will not recover with short retries — fail fast to local fallbacks.
  if (/RESOURCE_EXHAUSTED|Quota exceeded|quota exceeded/i.test(message)) {
    return false;
  }

  return true;
}

/**
 * Retries Firestore operations on transient UNAVAILABLE errors with exponential backoff.
 * Quota exhaustion and deadline failures are not retried.
 */
export async function withFirestoreRetry<T>(
  operation: () => Promise<T>,
  options: FirestoreRetryOptions = {}
): Promise<T> {
  const maxRetries = options.maxRetries ?? 3;
  const baseDelayMs = options.baseDelayMs ?? 200;

  let lastError: unknown;

  for (let attempt = 0; attempt <= maxRetries; attempt += 1) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      if (!isRetryableFirestoreError(error) || attempt >= maxRetries) {
        throw error;
      }
      await delay(baseDelayMs * 2 ** attempt);
    }
  }

  throw lastError;
}
