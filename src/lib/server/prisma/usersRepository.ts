import "server-only";

import type { Prisma } from "@prisma/client";
import { randomUUID } from "crypto";
import { prisma } from "@/lib/db/prisma";
import { asJsonValue } from "./mappers";
import type { Address, CreateAddressInput, UpdateAddressInput } from "@/types/address";
import type { AdminProfile, AdminRole } from "@/types/admin";

export async function listAddressesByUserId(userId: string): Promise<Address[]> {
  const rows = await prisma.address.findMany({
    where: { userId },
    orderBy: { updatedAt: "desc" },
  });
  return rows.map((row) => ({
    id: row.id,
    userId: row.userId,
    fullName: row.fullName,
    phone: row.phone,
    addressLine1: row.addressLine1,
    addressLine2: row.addressLine2 ?? undefined,
    city: row.city,
    state: row.state,
    country: row.country,
    postalCode: row.postalCode,
    isDefault: row.isDefault,
    label: row.label ?? undefined,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  }));
}

export async function getAddressById(addressId: string, userId: string): Promise<Address | null> {
  const row = await prisma.address.findFirst({
    where: { id: addressId, userId },
  });
  if (!row) return null;
  return {
    id: row.id,
    userId: row.userId,
    fullName: row.fullName,
    phone: row.phone,
    addressLine1: row.addressLine1,
    addressLine2: row.addressLine2 ?? undefined,
    city: row.city,
    state: row.state,
    country: row.country,
    postalCode: row.postalCode,
    isDefault: row.isDefault,
    label: row.label ?? undefined,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

function mapAdminRow(row: {
  uid: string;
  email: string;
  displayName: string;
  role: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  lastLoginAt: string | null;
}): AdminProfile {
  return {
    uid: row.uid,
    email: row.email,
    displayName: row.displayName,
    role: row.role as AdminRole,
    isActive: row.isActive,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    lastLoginAt: row.lastLoginAt ?? undefined,
  };
}

/** Active admins only — used for login / session. */
export async function getAdminProfile(uid: string): Promise<AdminProfile | null> {
  const row = await prisma.admin.findUnique({ where: { uid } });
  if (!row || !row.isActive) return null;
  return mapAdminRow(row);
}

/** Any admin row including inactive — used for admin management. */
export async function getAdminRecord(uid: string): Promise<AdminProfile | null> {
  const row = await prisma.admin.findUnique({ where: { uid } });
  if (!row) return null;
  return mapAdminRow(row);
}

export async function listAdmins(): Promise<AdminProfile[]> {
  const rows = await prisma.admin.findMany({ orderBy: { createdAt: "desc" } });
  return rows.map((row) => ({
    uid: row.uid,
    email: row.email,
    displayName: row.displayName,
    role: row.role as AdminRole,
    isActive: row.isActive,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    lastLoginAt: row.lastLoginAt ?? undefined,
  }));
}

export async function getWishlistItems(userId: string): Promise<unknown[]> {
  const row = await prisma.wishlist.findUnique({ where: { userId } });
  if (!row) return [];
  return Array.isArray(row.items) ? (row.items as unknown[]) : [];
}

function now(): string {
  return new Date().toISOString();
}

export async function clearDefaultAddressFlags(userId: string, exceptId?: string): Promise<void> {
  const timestamp = now();
  await prisma.address.updateMany({
    where: {
      userId,
      isDefault: true,
      ...(exceptId ? { id: { not: exceptId } } : {}),
    },
    data: { isDefault: false, updatedAt: timestamp },
  });
}

export async function createAddressRecord(
  userId: string,
  input: CreateAddressInput,
  options: { id?: string; isDefault: boolean },
): Promise<Address> {
  const timestamp = now();
  const id = options.id ?? randomUUID();
  const address: Address = {
    id,
    userId,
    fullName: input.fullName.trim(),
    phone: input.phone.trim(),
    addressLine1: input.addressLine1.trim(),
    addressLine2: input.addressLine2?.trim() || undefined,
    city: input.city.trim(),
    state: input.state.trim(),
    country: input.country.trim(),
    postalCode: input.postalCode.trim(),
    isDefault: options.isDefault,
    label: input.label?.trim() || undefined,
    createdAt: timestamp,
    updatedAt: timestamp,
  };

  await prisma.address.create({
    data: {
      id: address.id,
      userId: address.userId,
      fullName: address.fullName,
      phone: address.phone,
      addressLine1: address.addressLine1,
      addressLine2: address.addressLine2 ?? null,
      city: address.city,
      state: address.state,
      country: address.country,
      postalCode: address.postalCode,
      isDefault: address.isDefault,
      label: address.label ?? null,
      createdAt: address.createdAt,
      updatedAt: address.updatedAt,
    },
  });

  return address;
}

export async function updateAddressRecord(
  addressId: string,
  userId: string,
  patch: UpdateAddressInput,
): Promise<Address> {
  const timestamp = now();
  await prisma.address.updateMany({
    where: { id: addressId, userId },
    data: {
      ...(patch.fullName !== undefined ? { fullName: patch.fullName.trim() } : {}),
      ...(patch.phone !== undefined ? { phone: patch.phone.trim() } : {}),
      ...(patch.addressLine1 !== undefined ? { addressLine1: patch.addressLine1.trim() } : {}),
      ...(patch.addressLine2 !== undefined
        ? { addressLine2: patch.addressLine2.trim() || null }
        : {}),
      ...(patch.city !== undefined ? { city: patch.city.trim() } : {}),
      ...(patch.state !== undefined ? { state: patch.state.trim() } : {}),
      ...(patch.country !== undefined ? { country: patch.country.trim() } : {}),
      ...(patch.postalCode !== undefined ? { postalCode: patch.postalCode.trim() } : {}),
      ...(patch.label !== undefined ? { label: patch.label.trim() || null } : {}),
      ...(patch.isDefault !== undefined ? { isDefault: patch.isDefault } : {}),
      updatedAt: timestamp,
    },
  });

  const updated = await getAddressById(addressId, userId);
  if (!updated) throw new Error("Address not found after update");
  return updated;
}

export async function deleteAddressRecord(addressId: string, userId: string): Promise<void> {
  await prisma.address.deleteMany({ where: { id: addressId, userId } });
}

export async function upsertWishlistItems(userId: string, items: unknown[]): Promise<void> {
  const updatedAt = now();
  await prisma.wishlist.upsert({
    where: { userId },
    create: {
      userId,
      items: asJsonValue(items),
      updatedAt,
    },
    update: {
      items: asJsonValue(items),
      updatedAt,
    },
  });
}

export async function updateAdminLastLoginRecord(uid: string): Promise<void> {
  const timestamp = now();
  await prisma.admin.update({
    where: { uid },
    data: { lastLoginAt: timestamp, updatedAt: timestamp },
  });
}

export async function createAdminProfileRecord(profile: AdminProfile): Promise<AdminProfile> {
  await prisma.admin.create({
    data: {
      uid: profile.uid,
      email: profile.email,
      displayName: profile.displayName,
      role: profile.role,
      isActive: profile.isActive,
      createdAt: profile.createdAt,
      updatedAt: profile.updatedAt,
      lastLoginAt: profile.lastLoginAt ?? null,
    },
  });
  return profile;
}

export async function updateAdminProfileRecord(
  uid: string,
  patch: Partial<Pick<AdminProfile, "displayName" | "role" | "isActive">>,
): Promise<AdminProfile> {
  const timestamp = now();
  await prisma.admin.update({
    where: { uid },
    data: { ...patch, updatedAt: timestamp },
  });
  const profile = await getAdminRecord(uid);
  if (!profile) throw new Error("Admin not found after update");
  return profile;
}

export async function countActiveSuperAdmins(): Promise<number> {
  return prisma.admin.count({
    where: { role: "super_admin", isActive: true },
  });
}

export async function updateUserActiveStatus(uid: string, isActive: boolean): Promise<void> {
  await prisma.user.update({
    where: { id: uid },
    data: { isActive, updatedAt: now() },
  });
}

export async function getUserProfile(uid: string) {
  return prisma.user.findUnique({ where: { id: uid } });
}

export async function listRecentUsers(limit: number) {
  return prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}

const USER_PAGE_ORDER_BY = [
  { createdAt: "desc" },
  { id: "desc" },
] as const satisfies Prisma.UserOrderByWithRelationInput[];

export interface PaginatedUsersResult {
  users: Array<{
    id: string;
    email: string;
    name: string | null;
    image: string | null;
    isActive: boolean;
    createdAt: string;
  }>;
  hasMore: boolean;
  nextCursor?: string;
}

/**
 * DB-side search + pagination across the full user table (no 500-row cap).
 * Search matches email or display name case-insensitively.
 */
export async function listUsersPaginated(options: {
  search?: string;
  limit?: number;
  cursor?: string;
  offset?: number;
}): Promise<PaginatedUsersResult> {
  const limit = Math.min(Math.max(options.limit ?? 20, 1), 100);
  const search = options.search?.trim();

  const where: Prisma.UserWhereInput = search
    ? {
        OR: [
          { email: { contains: search, mode: "insensitive" } },
          { name: { contains: search, mode: "insensitive" } },
        ],
      }
    : {};

  const rows = await prisma.user.findMany({
    where,
    orderBy: USER_PAGE_ORDER_BY,
    select: {
      id: true,
      email: true,
      name: true,
      image: true,
      isActive: true,
      createdAt: true,
    },
    take: limit + 1,
    ...(options.cursor
      ? { cursor: { id: options.cursor }, skip: 1 }
      : options.offset && options.offset > 0
        ? { skip: options.offset }
        : {}),
  });

  const hasMore = rows.length > limit;
  const users = rows.slice(0, limit);
  return {
    users,
    hasMore,
    nextCursor: hasMore && users.length > 0 ? users[users.length - 1]!.id : undefined,
  };
}

export async function countUsers(): Promise<number> {
  return prisma.user.count();
}
