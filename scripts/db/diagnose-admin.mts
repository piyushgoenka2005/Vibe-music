/**
 * Diagnose admin access issues.
 *
 * Usage:
 *   npx tsx --env-file=.env.local scripts/db/diagnose-admin.mts
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🔍 Vibe Music Admin Diagnostic\n");

  try {
    // Check database connection
    console.log("1️⃣  Database Connection:");
    await prisma.$queryRaw`SELECT 1`;
    console.log("   ✅ PostgreSQL is connected\n");
  } catch (err) {
    console.error("   ❌ PostgreSQL connection failed:", err instanceof Error ? err.message : String(err));
    process.exit(1);
  }

  try {
    // Check admin users
    console.log("2️⃣  Admin Users in Database:");
    const admins = await prisma.admin.findMany();
    
    if (admins.length === 0) {
      console.log("   ⚠️  No admin users found!");
      console.log("   ℹ️  Run this to create one:");
      console.log("   npm run seed:admin-credentials -- admin@vibemusic.in YourPassword123\n");
    } else {
      admins.forEach((admin, idx) => {
        console.log(`   ${idx + 1}. ${admin.email} (UID: ${admin.uid})`);
        console.log(`      Role: ${admin.role} | Active: ${admin.isActive}`);
      });
      console.log();
    }
  } catch (err) {
    console.error("   ❌ Failed to fetch admins:", err instanceof Error ? err.message : String(err));
  }

  try {
    // Check users table
    console.log("3️⃣  Regular Users in Database:");
    const users = await prisma.user.findMany({ take: 5 });
    console.log(`   Total users: ${(await prisma.user.count())}`);
    if (users.length > 0) {
      console.log(`   First user: ${users[0].email}\n`);
    } else {
      console.log("   ⚠️  No users found - start by registering a user\n");
    }
  } catch (err) {
    console.error("   ❌ Failed to fetch users:", err instanceof Error ? err.message : String(err));
  }

  try {
    // Check categories
    console.log("4️⃣  Categories in Database:");
    const categories = await prisma.category.findMany();
    console.log(`   Total categories: ${categories.length}`);
    if (categories.length > 0) {
      console.log("   ✅ Categories table is populated\n");
    } else {
      console.log("   ℹ️  Categories table is empty (will use static fallback)\n");
    }
  } catch (err) {
    console.error("   ❌ Failed to fetch categories:", err instanceof Error ? err.message : String(err));
  }

  console.log("5️⃣  Quick Setup:");
  console.log("   If you see issues above, try:");
  console.log("   a) npm run seed:admin-credentials -- admin@vibemusic.in Password123");
  console.log("   b) Register a user at http://localhost:3000/register");
  console.log("   c) Restart: npm run dev\n");

  console.log("✅ Diagnostic complete!");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
