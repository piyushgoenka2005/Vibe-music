/**
 * Seed the first Super Admin in PostgreSQL.
 *
 * Usage:
 *   npx tsx --env-file=.env.local scripts/seed-admin.mts <user-id> <email> [displayName]
 *
 * The user must already exist in the `users` table (register first or use Auth.js Google sign-in).
 */
import { PrismaClient } from "@prisma/client";

const [uid, email, displayName = "Super Admin"] = process.argv.slice(2);

if (!uid || !email) {
  console.error(
    "Usage: npx tsx --env-file=.env.local scripts/seed-admin.mts <uid> <email> [displayName]"
  );
  process.exit(1);
}

async function main() {
  const prisma = new PrismaClient();
  const now = new Date().toISOString();

  try {
    await prisma.admin.upsert({
      where: { uid },
      create: {
        uid,
        email,
        displayName,
        role: "super_admin",
        isActive: true,
        createdAt: now,
        updatedAt: now,
      },
      update: {
        email,
        displayName,
        role: "super_admin",
        isActive: true,
        updatedAt: now,
      },
    });

    console.log(`Super Admin created: ${email} (${uid})`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
