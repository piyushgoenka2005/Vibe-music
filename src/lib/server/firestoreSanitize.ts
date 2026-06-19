import "server-only";

/** Remove undefined values — Firestore rejects undefined field values. */
export function sanitizeForFirestore<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}
