/**
 * Seed deterministic storefront customers + owned resources for IDOR E2E.
 *
 * Usage: npx tsx scripts/db/seed-e2e-customers.mts
 */
import bcrypt from "bcryptjs";
import fs from "node:fs";
import path from "node:path";
import { PrismaClient } from "@prisma/client";

export const E2E_USER_A_UID = "00000000-e2e0-4000-8000-000000000002";
export const E2E_USER_B_UID = "00000000-e2e0-4000-8000-000000000003";
export const E2E_USER_A_EMAIL =
  (process.env.E2E_USER_A_EMAIL ?? "e2e-user-a@vibemusic.test").trim().toLowerCase();
export const E2E_USER_B_EMAIL =
  (process.env.E2E_USER_B_EMAIL ?? "e2e-user-b@vibemusic.test").trim().toLowerCase();
export const E2E_CUSTOMER_PASSWORD =
  process.env.E2E_CUSTOMER_PASSWORD ?? "E2eCustomerPassword!123456";
export const E2E_ORDER_A_ID = "e2e-order-user-a-001";
export const E2E_ADDRESS_A_ID = "e2e-address-user-a-001";

const markerPath = path.join(process.cwd(), "e2e", ".auth", "customers-seeded");

async function upsertCustomer(
  prisma: PrismaClient,
  id: string,
  email: string,
  name: string,
  passwordHash: string,
  now: string,
): Promise<void> {
  await prisma.user.upsert({
    where: { id },
    create: {
      id,
      email,
      name,
      passwordHash,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    },
    update: {
      email,
      name,
      passwordHash,
      isActive: true,
      updatedAt: now,
    },
  });
}

async function main(): Promise<void> {
  if (!process.env.DATABASE_URL?.trim()) {
    console.error("DATABASE_URL is required");
    process.exit(1);
  }

  const prisma = new PrismaClient();
  const now = new Date().toISOString();
  const passwordHash = await bcrypt.hash(E2E_CUSTOMER_PASSWORD, 12);

  try {
    await upsertCustomer(
      prisma,
      E2E_USER_A_UID,
      E2E_USER_A_EMAIL,
      "E2E User A",
      passwordHash,
      now,
    );
    await upsertCustomer(
      prisma,
      E2E_USER_B_UID,
      E2E_USER_B_EMAIL,
      "E2E User B",
      passwordHash,
      now,
    );

    const shippingAddress = {
      name: "E2E User A",
      phone: "9876543210",
      line1: "1 E2E Test Street",
      city: "Mumbai",
      state: "Maharashtra",
      postalCode: "400001",
      country: "IN",
    };

    await prisma.order.upsert({
      where: { id: E2E_ORDER_A_ID },
      create: {
        id: E2E_ORDER_A_ID,
        userId: E2E_USER_A_UID,
        email: E2E_USER_A_EMAIL,
        customerName: "E2E User A",
        customerPhone: "9876543210",
        isGuestOrder: false,
        status: "confirmed",
        paymentStatus: "paid",
        paymentMethod: "razorpay",
        subtotal: 5000,
        couponDiscount: 0,
        shippingCharge: 0,
        platformFee: 0,
        totalGst: 900,
        cgst: 450,
        sgst: 450,
        igst: 0,
        total: 5900,
        items: [
          {
            productId: "e2e-product",
            name: "E2E Test Product",
            quantity: 1,
            price: 5000,
            gstRate: 18,
          },
        ],
        shippingAddress,
        createdAt: now,
        updatedAt: now,
      },
      update: {
        userId: E2E_USER_A_UID,
        email: E2E_USER_A_EMAIL,
        status: "confirmed",
        paymentStatus: "paid",
        updatedAt: now,
      },
    });

    await prisma.address.upsert({
      where: { id: E2E_ADDRESS_A_ID },
      create: {
        id: E2E_ADDRESS_A_ID,
        userId: E2E_USER_A_UID,
        fullName: "E2E User A",
        phone: "9876543210",
        addressLine1: "1 E2E Test Street",
        city: "Mumbai",
        state: "Maharashtra",
        country: "India",
        postalCode: "400001",
        isDefault: true,
        createdAt: now,
        updatedAt: now,
      },
      update: {
        userId: E2E_USER_A_UID,
        updatedAt: now,
      },
    });

    fs.mkdirSync(path.dirname(markerPath), { recursive: true });
    fs.writeFileSync(markerPath, now, "utf8");
    console.log(
      `[e2e] Customers ready: ${E2E_USER_A_EMAIL}, ${E2E_USER_B_EMAIL}; order=${E2E_ORDER_A_ID}`,
    );
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
