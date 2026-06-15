import "server-only";

import { getAdminFirestore } from "@/lib/firebase/admin";
import type { Address, CreateAddressInput, UpdateAddressInput } from "@/types/address";

const COLLECTION = "addresses";

function now(): string {
  return new Date().toISOString();
}

function normalizeAddress(
  id: string,
  data: FirebaseFirestore.DocumentData
): Address {
  return {
    id,
    userId: String(data.userId ?? ""),
    fullName: String(data.fullName ?? ""),
    phone: String(data.phone ?? ""),
    addressLine1: String(data.addressLine1 ?? ""),
    addressLine2: data.addressLine2 ? String(data.addressLine2) : undefined,
    city: String(data.city ?? ""),
    state: String(data.state ?? ""),
    country: String(data.country ?? "India"),
    postalCode: String(data.postalCode ?? ""),
    isDefault: Boolean(data.isDefault),
    label: data.label ? String(data.label) : undefined,
    createdAt: String(data.createdAt ?? ""),
    updatedAt: String(data.updatedAt ?? ""),
  };
}

export async function listAddressesByUserId(userId: string): Promise<Address[]> {
  const snap = await getAdminFirestore()
    .collection(COLLECTION)
    .where("userId", "==", userId)
    .get();

  return snap.docs
    .map((doc) => normalizeAddress(doc.id, doc.data()))
    .sort((a, b) => {
      if (a.isDefault !== b.isDefault) return a.isDefault ? -1 : 1;
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    });
}

export async function getAddressById(
  addressId: string,
  userId: string
): Promise<Address | null> {
  const doc = await getAdminFirestore()
    .collection(COLLECTION)
    .doc(addressId)
    .get();

  if (!doc.exists) return null;
  const data = doc.data();
  if (!data) return null;

  const address = normalizeAddress(doc.id, data);
  if (address.userId !== userId) return null;
  return address;
}

async function clearDefaultFlags(
  userId: string,
  exceptId?: string
): Promise<void> {
  const snap = await getAdminFirestore()
    .collection(COLLECTION)
    .where("userId", "==", userId)
    .where("isDefault", "==", true)
    .get();

  const batch = getAdminFirestore().batch();
  const timestamp = now();

  for (const doc of snap.docs) {
    if (doc.id !== exceptId) {
      batch.update(doc.ref, { isDefault: false, updatedAt: timestamp });
    }
  }

  if (!snap.empty) {
    await batch.commit();
  }
}

export async function createAddress(
  userId: string,
  input: CreateAddressInput
): Promise<Address> {
  const db = getAdminFirestore();
  const existing = await listAddressesByUserId(userId);
  const shouldBeDefault = input.isDefault ?? existing.length === 0;
  const timestamp = now();
  const ref = db.collection(COLLECTION).doc();

  const address: Address = {
    id: ref.id,
    userId,
    fullName: input.fullName.trim(),
    phone: input.phone.trim(),
    addressLine1: input.addressLine1.trim(),
    addressLine2: input.addressLine2?.trim() || undefined,
    city: input.city.trim(),
    state: input.state.trim(),
    country: input.country.trim(),
    postalCode: input.postalCode.trim(),
    isDefault: shouldBeDefault,
    label: input.label?.trim() || undefined,
    createdAt: timestamp,
    updatedAt: timestamp,
  };

  if (shouldBeDefault) {
    await clearDefaultFlags(userId);
  }

  await ref.set(address);
  return address;
}

export async function updateAddress(
  addressId: string,
  userId: string,
  input: UpdateAddressInput
): Promise<Address> {
  const existing = await getAddressById(addressId, userId);
  if (!existing) {
    throw new Error("Address not found");
  }

  const timestamp = now();
  const patch: Record<string, unknown> = { updatedAt: timestamp };

  if (input.fullName !== undefined) patch.fullName = input.fullName.trim();
  if (input.phone !== undefined) patch.phone = input.phone.trim();
  if (input.addressLine1 !== undefined) {
    patch.addressLine1 = input.addressLine1.trim();
  }
  if (input.addressLine2 !== undefined) {
    patch.addressLine2 = input.addressLine2.trim() || null;
  }
  if (input.city !== undefined) patch.city = input.city.trim();
  if (input.state !== undefined) patch.state = input.state.trim();
  if (input.country !== undefined) patch.country = input.country.trim();
  if (input.postalCode !== undefined) {
    patch.postalCode = input.postalCode.trim();
  }
  if (input.label !== undefined) patch.label = input.label.trim() || null;

  if (input.isDefault === true) {
    await clearDefaultFlags(userId, addressId);
    patch.isDefault = true;
  } else if (input.isDefault === false && existing.isDefault) {
    patch.isDefault = false;
  }

  await getAdminFirestore()
    .collection(COLLECTION)
    .doc(addressId)
    .update(patch);

  const updated = await getAddressById(addressId, userId);
  if (!updated) throw new Error("Address not found after update");

  if (!updated.isDefault) {
    const all = await listAddressesByUserId(userId);
    if (all.length > 0 && !all.some((a) => a.isDefault)) {
      await setDefaultAddress(all[0]!.id, userId);
      return (await getAddressById(addressId, userId))!;
    }
  }

  return updated;
}

export async function deleteAddress(
  addressId: string,
  userId: string
): Promise<void> {
  const existing = await getAddressById(addressId, userId);
  if (!existing) {
    throw new Error("Address not found");
  }

  await getAdminFirestore().collection(COLLECTION).doc(addressId).delete();

  if (existing.isDefault) {
    const remaining = await listAddressesByUserId(userId);
    if (remaining.length > 0) {
      await setDefaultAddress(remaining[0]!.id, userId);
    }
  }
}

export async function setDefaultAddress(
  addressId: string,
  userId: string
): Promise<Address> {
  const existing = await getAddressById(addressId, userId);
  if (!existing) {
    throw new Error("Address not found");
  }

  await clearDefaultFlags(userId, addressId);
  const timestamp = now();

  await getAdminFirestore().collection(COLLECTION).doc(addressId).update({
    isDefault: true,
    updatedAt: timestamp,
  });

  const updated = await getAddressById(addressId, userId);
  if (!updated) throw new Error("Address not found after update");
  return updated;
}
