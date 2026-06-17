import "server-only";

import { isFirestoreUnavailableError } from "@/lib/server/firestoreErrors";

export interface FirestoreRetryOptions {
  maxRetries?: number;
  baseDelayMs?: number;
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Retries Firestore operations on RESOURCE_EXHAUSTED / UNAVAILABLE with exponential backoff.
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
      if (!isFirestoreUnavailableError(error) || attempt >= maxRetries) {
        throw error;
      }
      await delay(baseDelayMs * 2 ** attempt);
    }
  }

  throw lastError;
}
