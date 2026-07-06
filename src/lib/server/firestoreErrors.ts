import "server-only";

import { withFirestoreRetry } from "@/lib/server/firestoreRetry";

export const FIRESTORE_CIRCUIT_MS = 5 * 60 * 1000;

function readPositiveIntEnv(name: string, fallback: number): number {
  const raw = process.env[name]?.trim();
  if (!raw) return fallback;
  const parsed = Number.parseInt(raw, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

/** Startup health probe may need longer than per-request deadlines on cold VPS boots. */
export const FIRESTORE_STARTUP_DEADLINE_MS = readPositiveIntEnv(
  "FIRESTORE_STARTUP_DEADLINE_MS",
  process.env.NODE_ENV === "production" ? 8_000 : 2_000
);

export const FIRESTORE_FAST_FAIL_MS =
  readPositiveIntEnv(
    "FIRESTORE_DEADLINE_MS",
    process.env.NODE_ENV === "production" ? 1_200 : 350
  );

const FIRESTORE_FAST_FAIL = "FIRESTORE_FAST_FAIL";

export function isFirestoreFastFailError(error: unknown): boolean {
  return error instanceof Error && error.message === FIRESTORE_FAST_FAIL;
}

export function isFirestoreDegraded(error: unknown): boolean {
  return isFirestoreUnavailableError(error) || isFirestoreFastFailError(error);
}

/** Rejects if a Firestore read exceeds the deadline (prevents 8s+ gRPC hangs). */
export async function withFirestoreDeadline<T>(
  operation: () => Promise<T>,
  deadlineMs = FIRESTORE_FAST_FAIL_MS
): Promise<T> {
  return Promise.race([
    operation(),
    new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error(FIRESTORE_FAST_FAIL)), deadlineMs);
    }),
  ]);
}

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

const warningKeys = new Map<string, number>();
const WARNING_DEDUPE_MS = 60_000;

export function logFirestoreWarning(
  domain: string,
  error: unknown,
  context: string
): void {
  const key = `${domain}:${context}`;
  const now = Date.now();
  const lastLoggedAt = warningKeys.get(key) ?? 0;
  if (now - lastLoggedAt < WARNING_DEDUPE_MS) {
    return;
  }
  warningKeys.set(key, now);

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
    if (isFirestoreUnavailableError(error) || isFirestoreFastFailError(error)) {
      markFirestoreUnavailable(error);
      logFirestoreWarning(options.domain, error, options.context);
      return options.fallback();
    }
    throw error;
  }
}
