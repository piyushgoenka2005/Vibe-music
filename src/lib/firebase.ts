/**
 * Unified Firebase entry point for client and server usage.
 * Client: auth, Firestore, storage via firebase/app SDK.
 * Server: Admin Auth + Firestore via firebase-admin (see admin.ts).
 */
export {
  firebasePublicConfig,
  assertFirebaseClientConfig,
} from "@/lib/firebase/config";

export {
  getClientAuth,
  getClientFirestore,
  getClientStorage,
} from "@/lib/firebase/client";

export { getAdminAuth, getAdminFirestore } from "@/lib/firebase/admin";
