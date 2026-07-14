/**
 * Seed a deterministic super-admin account for Playwright E2E.
 *
 * Usage:
 *   npm run seed:e2e-admin
 *
 * Env (optional — defaults match e2e/helpers/e2e-credentials.ts):
 *   E2E_ADMIN_EMAIL, E2E_ADMIN_PASSWORD, DATABASE_URL
 */
import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";

const E2E_ADMIN_UID = "00000000-e2e0-4000-8000-000000000001";
const email = (process.env.E2E_ADMIN_EMAIL ?? "e2e-admin@vibemusic.test")
  .trim()
  .toLowerCase();
const password = process.env.E2E_ADMIN_PASSWORD ?? "E2eAdminPassword!123456";

async function main() {
  if (!process.env.DATABASE_URL) {
    console.error("DATABASE_URL is required");
    process.exit(1);
  }

  const prisma = new PrismaClient();
  const now = new Date().toISOString();
  const passwordHash = await bcrypt.hash(password, 12);

  try {
    await prisma.user.upsert({
      where: { id: E2E_ADMIN_UID },
      create: {
        id: E2E_ADMIN_UID,
        email,
        name: "E2E Super Admin",
        passwordHash,
        isActive: true,
        createdAt: now,
        updatedAt: now,
      },
      update: {
        email,
        name: "E2E Super Admin",
        passwordHash,
        isActive: true,
        updatedAt: now,
      },
    });

    await prisma.admin.upsert({
      where: { uid: E2E_ADMIN_UID },
      create: {
        uid: E2E_ADMIN_UID,
        email,
        displayName: "E2E Super Admin",
        role: "super_admin",
        isActive: true,
        createdAt: now,
        updatedAt: now,
      },
      update: {
        email,
        displayName: "E2E Super Admin",
        role: "super_admin",
        isActive: true,
        updatedAt: now,
      },
    });

    console.log(`E2E admin ready: ${email} (${E2E_ADMIN_UID})`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
