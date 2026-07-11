import "server-only";

import { randomUUID } from "crypto";
import * as pg from "@/lib/server/prisma/usersRepository";
import type { Address, CreateAddressInput, UpdateAddressInput } from "@/types/address";

function sortAddresses(addresses: Address[]): Address[] {
  return [...addresses].sort((a, b) => {
    if (a.isDefault !== b.isDefault) return a.isDefault ? -1 : 1;
    return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
  });
}

export async function listAddressesByUserId(userId: string): Promise<Address[]> {
  return sortAddresses(await pg.listAddressesByUserId(userId));
}

export async function getAddressById(
  addressId: string,
  userId: string
): Promise<Address | null> {
  return pg.getAddressById(addressId, userId);
}

export async function createAddress(
  userId: string,
  input: CreateAddressInput
): Promise<Address> {
  let shouldBeDefault: boolean;
  if (input.isDefault === true) {
    shouldBeDefault = true;
    await pg.clearDefaultAddressFlags(userId);
  } else if (input.isDefault === false) {
    shouldBeDefault = false;
  } else {
    const existing = await listAddressesByUserId(userId);
    shouldBeDefault = existing.length === 0;
    if (shouldBeDefault) {
      await pg.clearDefaultAddressFlags(userId);
    }
  }

  return pg.createAddressRecord(userId, input, {
    id: randomUUID(),
    isDefault: shouldBeDefault,
  });
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

  if (input.isDefault === true) {
    await pg.clearDefaultAddressFlags(userId, addressId);
  }

  const updated = await pg.updateAddressRecord(addressId, userId, input);

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

  await pg.deleteAddressRecord(addressId, userId);

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

  await pg.clearDefaultAddressFlags(userId, addressId);
  return pg.updateAddressRecord(addressId, userId, { isDefault: true });
}
