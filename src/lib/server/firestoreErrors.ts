import "server-only";

import { withFirestoreRetry } from "@/lib/server/firestoreRetry";

export const FIRESTORE_CIRCUIT_MS = 5 * 60 * 1000;
export const FIRESTORE_FAST_FAIL_MS = 1_200;

const FIRESTORE_FAST_FAIL = "FIRESTORE_FAST_FAIL";

export function isFirestoreUnavailableError(error: unknown): boolean {
  if (!error) return false;

  const message = error instanceof Error ? error.message : String(error);
  if (
    /RESOURCE_EXHAUSTED|Quota exceeded|quota exceeded|UNAVAILABLE/i.test(message)
  ) {
    return true;
  }

  let current: unknown = error;
  for (let depth = 0; depth < 4; depth += 1) {
    if (!current || typeof current !== "object") break;

    const code = (current as { code?: number | string }).code;
    const codeText = String(code ?? "").toLowerCase();

    if (
      code === 8 ||
      code === 14 ||
      codeText === "resource_exhausted" ||
      codeText === "unavailable" ||
      codeText.includes("resource_exhausted")
    ) {
      return true;
    }

    current = (current as { cause?: unknown }).cause;
  }

  return false;
}

export function logFirestoreWarning(
  domain: string,
  error: unknown,
  context: string
): void {
  const message = error instanceof Error ? error.message : String(error);
  console.warn(`[${domain}] ${context}: ${message}`);
}

export type FirestoreCircuitBreaker = {
  isOpen(): boolean;
  open(): void;
};

export function createFirestoreCircuitBreaker(
  durationMs = FIRESTORE_CIRCUIT_MS
): FirestoreCircuitBreaker {
  let openUntil = 0;

  return {
    isOpen(): boolean {
      return Date.now() < openUntil;
    },
    open(): void {
      openUntil = Date.now() + durationMs;
    },
  };
}

const globalFirestoreCircuit = createFirestoreCircuitBreaker();

export function isGlobalFirestoreCircuitOpen(): boolean {
  return globalFirestoreCircuit.isOpen();
}

export function openGlobalFirestoreCircuit(): void {
  globalFirestoreCircuit.open();
}

export function markFirestoreUnavailable(error: unknown): boolean {
  if (!isFirestoreUnavailableError(error)) {
    return false;
  }
  openGlobalFirestoreCircuit();
  return true;
}

export async function tryFirestoreFast<T>(
  operation: () => Promise<T>,
  options: {
    domain: string;
    context: string;
    fallback: () => T | Promise<T>;
  }
): Promise<T> {
  if (isGlobalFirestoreCircuitOpen()) {
    return options.fallback();
  }

  try {
    return await Promise.race([
      withFirestoreRetry(operation),
      new Promise<never>((_, reject) => {
        setTimeout(
          () => reject(new Error(FIRESTORE_FAST_FAIL)),
          FIRESTORE_FAST_FAIL_MS
        );
      }),
    ]);
  } catch (error) {
    if (
      isFirestoreUnavailableError(error) ||
      (error instanceof Error && error.message === FIRESTORE_FAST_FAIL)
    ) {
      markFirestoreUnavailable(error);
      logFirestoreWarning(options.domain, error, options.context);
      return options.fallback();
    }
    throw error;
  }
}
