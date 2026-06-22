import "server-only";

import { randomUUID } from "crypto";
import fs from "fs";
import path from "path";

import { getAdminFirestore } from "@/lib/firebase/admin";
import {
  createFirestoreCircuitBreaker,
  isFirestoreDegraded,
  isGlobalFirestoreCircuitOpen,
  logFirestoreWarning,
  openGlobalFirestoreCircuit,
  withFirestoreDeadline,
} from "@/lib/server/firestoreErrors";
import { withFirestoreRetry } from "@/lib/server/firestoreRetry";
import { sanitizeForFirestore } from "@/lib/server/firestoreSanitize";
import type { Address, CreateAddressInput, UpdateAddressInput } from "@/types/address";

const COLLECTION = "addresses";
const ADDRESSES_DIR = path.join(process.cwd(), ".data", "addresses");

const addressCircuit = createFirestoreCircuitBreaker();

function isAddressFirestoreDisabled(): boolean {
  return (
    process.env.DISABLE_FIRESTORE_ADDRESSES === "true" ||
    addressCircuit.isOpen() ||
    isGlobalFirestoreCircuitOpen()
  );
}

function ensureAddressesDir(): void {
  fs.mkdirSync(ADDRESSES_DIR, { recursive: true });
}

function localAddressesPath(userId: string): string {
  return path.join(ADDRESSES_DIR, `${userId}.json`);
}

function readLocalAddresses(userId: string): Address[] {
  const filePath = localAddressesPath(userId);
  if (!fs.existsSync(filePath)) return [];
  return JSON.parse(fs.readFileSync(filePath, "utf8")) as Address[];
}

function writeLocalAddresses(userId: string, addresses: Address[]): void {
  ensureAddressesDir();
  fs.writeFileSync(
    localAddressesPath(userId),
    `${JSON.stringify(addresses, null, 2)}\n`,
    "utf8"
  );
}

function openAddressCircuit(error: unknown, context: string): void {
  const wasOpen = isAddressFirestoreDisabled();
  addressCircuit.open();
  openGlobalFirestoreCircuit();
  if (!wasOpen) {
    logFirestoreWarning("addresses", error, context);
  }
}

function sortAddresses(addresses: Address[]): Address[] {
  return [...addresses].sort((a, b) => {
    if (a.isDefault !== b.isDefault) return a.isDefault ? -1 : 1;
    return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
  });
}

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
  if (!isAddressFirestoreDisabled()) {
    try {
      const snap = await withFirestoreDeadline(() =>
        withFirestoreRetry(() =>
          getAdminFirestore()
            .collection(COLLECTION)
            .where("userId", "==", userId)
            .get()
        )
      );

      return sortAddresses(
        snap.docs.map((doc) => normalizeAddress(doc.id, doc.data()))
      );
    } catch (error) {
      if (isFirestoreDegraded(error)) {
        openAddressCircuit(error, "Reading addresses from local store");
      } else {
        throw error;
      }
    }
  }

  return sortAddresses(readLocalAddresses(userId));
}

export async function getAddressById(
  addressId: string,
  userId: string
): Promise<Address | null> {
  if (!isAddressFirestoreDisabled()) {
    try {
      const doc = await withFirestoreDeadline(() =>
        getAdminFirestore()
          .collection(COLLECTION)
          .doc(addressId)
          .get()
      );

      if (doc.exists) {
        const address = normalizeAddress(doc.id, doc.data()!);
        if (address.userId === userId) return address;
      }
    } catch (error) {
      if (isFirestoreDegraded(error)) {
        openAddressCircuit(error, "Reading address from local store");
      } else {
        throw error;
      }
    }
  }

  return (
    readLocalAddresses(userId).find((address) => address.id === addressId) ??
    null
  );
}

async function clearDefaultFlags(
  userId: string,
  exceptId?: string
): Promise<void> {
  if (isAddressFirestoreDisabled()) {
    const addresses = readLocalAddresses(userId).map((address) =>
      address.id !== exceptId && address.isDefault
        ? { ...address, isDefault: false, updatedAt: now() }
        : address
    );
    writeLocalAddresses(userId, addresses);
    return;
  }

  try {
    const snap = await withFirestoreDeadline(() =>
      getAdminFirestore()
        .collection(COLLECTION)
        .where("userId", "==", userId)
        .where("isDefault", "==", true)
        .get()
    );

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
  } catch (error) {
    if (isFirestoreDegraded(error)) {
      openAddressCircuit(error, "Clearing default flags locally");
      await clearDefaultFlags(userId, exceptId);
      return;
    }
    throw error;
  }
}

export async function createAddress(
  userId: string,
  input: CreateAddressInput
): Promise<Address> {
  const timestamp = now();
  const addressId = randomUUID();

  let shouldBeDefault: boolean;
  if (input.isDefault === true) {
    shouldBeDefault = true;
    await clearDefaultFlags(userId);
  } else if (input.isDefault === false) {
    shouldBeDefault = false;
  } else {
    const existing = await listAddressesByUserId(userId);
    shouldBeDefault = existing.length === 0;
    if (shouldBeDefault) {
      await clearDefaultFlags(userId);
    }
  }

  const address: Address = {
    id: addressId,
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

  if (isAddressFirestoreDisabled()) {
    writeLocalAddresses(userId, [...readLocalAddresses(userId), address]);
    return address;
  }

  try {
    await withFirestoreDeadline(() =>
      getAdminFirestore()
        .collection(COLLECTION)
        .doc(addressId)
        .set(sanitizeForFirestore(address))
    );
    return address;
  } catch (error) {
    if (isFirestoreDegraded(error)) {
      openAddressCircuit(error, "Creating address locally — Firestore unavailable");
      writeLocalAddresses(userId, [...readLocalAddresses(userId), address]);
      return address;
    }
    throw error;
  }
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

  if (isAddressFirestoreDisabled()) {
    const addresses = readLocalAddresses(userId).map((address) =>
      address.id === addressId
        ? {
            ...address,
            ...patch,
            updatedAt: timestamp,
          }
        : address
    );
    writeLocalAddresses(userId, addresses as Address[]);
  } else {
    try {
      await getAdminFirestore()
        .collection(COLLECTION)
        .doc(addressId)
        .update(sanitizeForFirestore(patch));
    } catch (error) {
      if (isFirestoreDegraded(error)) {
        openAddressCircuit(error, "Updating address locally — Firestore unavailable");
        const addresses = readLocalAddresses(userId).map((address) =>
          address.id === addressId
            ? {
                ...address,
                ...patch,
                updatedAt: timestamp,
              }
            : address
        );
        writeLocalAddresses(userId, addresses as Address[]);
      } else {
        throw error;
      }
    }
  }

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

  if (isAddressFirestoreDisabled()) {
    writeLocalAddresses(
      userId,
      readLocalAddresses(userId).filter((address) => address.id !== addressId)
    );
  } else {
    try {
      await getAdminFirestore().collection(COLLECTION).doc(addressId).delete();
    } catch (error) {
      if (isFirestoreDegraded(error)) {
        openAddressCircuit(error, "Deleting address locally — Firestore unavailable");
        writeLocalAddresses(
          userId,
          readLocalAddresses(userId).filter((address) => address.id !== addressId)
        );
      } else {
        throw error;
      }
    }
  }

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

  if (isAddressFirestoreDisabled()) {
    const addresses = readLocalAddresses(userId).map((address) =>
      address.id === addressId
        ? { ...address, isDefault: true, updatedAt: timestamp }
        : address
    );
    writeLocalAddresses(userId, addresses);
  } else {
    try {
      await getAdminFirestore().collection(COLLECTION).doc(addressId).update({
        isDefault: true,
        updatedAt: timestamp,
      });
    } catch (error) {
      if (isFirestoreDegraded(error)) {
        openAddressCircuit(error, "Setting default address locally");
        const addresses = readLocalAddresses(userId).map((address) =>
          address.id === addressId
            ? { ...address, isDefault: true, updatedAt: timestamp }
            : address
        );
        writeLocalAddresses(userId, addresses);
      } else {
        throw error;
      }
    }
  }

  const updated = await getAddressById(addressId, userId);
  if (!updated) throw new Error("Address not found after update");
  return updated;
}
