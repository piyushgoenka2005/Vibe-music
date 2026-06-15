import "server-only";

import { legacyAddressToInput } from "@/lib/address/addressMappers";
import {
  createAddress,
  deleteAddress,
  getAddressById,
  listAddressesByUserId,
  setDefaultAddress,
  updateAddress,
} from "@/lib/server/addressRepository";
import type { Address, CreateAddressInput, UpdateAddressInput } from "@/types/address";
import type { LegacySavedAddress } from "@/types/address";

export async function getUserAddresses(userId: string): Promise<Address[]> {
  return listAddressesByUserId(userId);
}

export async function getUserAddress(
  userId: string,
  addressId: string
): Promise<Address | null> {
  return getAddressById(addressId, userId);
}

export async function createUserAddress(
  userId: string,
  input: CreateAddressInput
): Promise<Address> {
  return createAddress(userId, input);
}

export async function updateUserAddress(
  userId: string,
  addressId: string,
  input: UpdateAddressInput
): Promise<Address> {
  return updateAddress(addressId, userId, input);
}

export async function deleteUserAddress(
  userId: string,
  addressId: string
): Promise<void> {
  return deleteAddress(addressId, userId);
}

export async function setUserDefaultAddress(
  userId: string,
  addressId: string
): Promise<Address> {
  return setDefaultAddress(addressId, userId);
}

export async function migrateLegacyAddresses(
  userId: string,
  legacyAddresses: LegacySavedAddress[],
  fallbackPhone = ""
): Promise<{ imported: number; skipped: number }> {
  if (legacyAddresses.length === 0) {
    return { imported: 0, skipped: 0 };
  }

  const existing = await listAddressesByUserId(userId);
  let imported = 0;
  let skipped = 0;

  const hasDefault = existing.some((a) => a.isDefault);
  let defaultAssigned = hasDefault;

  for (const legacy of legacyAddresses) {
    const duplicate = existing.find(
      (addr) =>
        addr.addressLine1.toLowerCase() === legacy.line1.toLowerCase() &&
        addr.postalCode === legacy.postalCode &&
        addr.fullName.toLowerCase() === legacy.name.toLowerCase()
    );

    if (duplicate) {
      skipped += 1;
      continue;
    }

    const input = legacyAddressToInput(legacy, fallbackPhone);
    if (!defaultAssigned && (legacy.isDefault || existing.length + imported === 0)) {
      input.isDefault = true;
      defaultAssigned = true;
    } else {
      input.isDefault = false;
    }

    await createAddress(userId, input);
    imported += 1;
  }

  return { imported, skipped };
}
