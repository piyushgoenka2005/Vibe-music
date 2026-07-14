/**
 * Upsert a storefront user with password + active super_admin row.
 *
 * Usage:
 *   npx tsx --env-file=.env.local scripts/db/ensure-admin-credentials.mts <email> <password> [displayName]
 *
 * Does not print the password. Requires DATABASE_URL.
 */
import { randomUUID } from "node:crypto";
import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";

const [emailRaw, password, displayName = "Super Admin"] = process.argv.slice(2);

if (!emailRaw || !password) {
  console.error(
    "Usage: npx tsx --env-file=.env.local scripts/db/ensure-admin-credentials.mts <email> <password> [displayName]"
  );
  process.exit(1);
}

if (password.length < 8) {
  console.error("Password must be at least 8 characters.");
  process.exit(1);
}

async function main() {
  if (!process.env.DATABASE_URL) {
    console.error("DATABASE_URL is required");
    process.exit(1);
  }

  const email = emailRaw.trim().toLowerCase();
  const prisma = new PrismaClient();
  const now = new Date().toISOString();
  const passwordHash = await bcrypt.hash(password, 12);

  try {
    const existing = await prisma.user.findUnique({ where: { email } });
    const uid = existing?.id ?? randomUUID();

    await prisma.user.upsert({
      where: { id: uid },
      create: {
        id: uid,
        email,
        name: displayName,
        passwordHash,
        isActive: true,
        createdAt: now,
        updatedAt: now,
      },
      update: {
        email,
        name: displayName,
        passwordHash,
        isActive: true,
        updatedAt: now,
      },
    });

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

    console.log(`Admin credentials ready for ${email} (${uid})`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
