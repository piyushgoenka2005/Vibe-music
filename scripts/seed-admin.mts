/**
 * Seed the first Super Admin in Firestore.
 *
 * Usage:
 *   npx tsx --env-file=.env.local scripts/seed-admin.mts <firebase-uid> <email> [displayName]
 *
 * The Firebase user must already exist (create via Firebase Console or register first).
 */
import { getAdminFirestore } from "../src/lib/firebase/admin";

const [uid, email, displayName = "Super Admin"] = process.argv.slice(2);

if (!uid || !email) {
  console.error(
    "Usage: npx tsx --env-file=.env.local scripts/seed-admin.mts <uid> <email> [displayName]"
  );
  process.exit(1);
}

async function main() {
  const db = getAdminFirestore();
  const now = new Date().toISOString();

  await db.collection("admins").doc(uid).set({
    uid,
    email,
    displayName,
    role: "super_admin",
    isActive: true,
    createdAt: now,
    updatedAt: now,
  });

  console.log(`Super Admin created: ${email} (${uid})`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
