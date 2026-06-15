import type {
  Address,
  CreateAddressInput,
  LegacySavedAddress,
  UpdateAddressInput,
} from "@/types/address";

async function parseJson<T>(response: Response): Promise<T> {
  const data = (await response.json()) as T & { error?: string };
  if (!response.ok) {
    throw new Error(data.error ?? "Request failed");
  }
  return data;
}

export async function fetchAddresses(): Promise<Address[]> {
  const response = await fetch("/api/addresses");
  const data = await parseJson<{ addresses: Address[] }>(response);
  return data.addresses;
}

export async function createAddress(
  input: CreateAddressInput
): Promise<Address> {
  const response = await fetch("/api/addresses", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  const data = await parseJson<{ address: Address }>(response);
  return data.address;
}

export async function updateAddress(
  addressId: string,
  input: UpdateAddressInput
): Promise<Address> {
  const response = await fetch(`/api/addresses/${addressId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  const data = await parseJson<{ address: Address }>(response);
  return data.address;
}

export async function deleteAddress(addressId: string): Promise<void> {
  const response = await fetch(`/api/addresses/${addressId}`, {
    method: "DELETE",
  });
  if (!response.ok) {
    const data = (await response.json()) as { error?: string };
    throw new Error(data.error ?? "Failed to delete address");
  }
}

export async function setDefaultAddress(addressId: string): Promise<Address> {
  const response = await fetch(`/api/addresses/${addressId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ isDefault: true }),
  });
  const data = await parseJson<{ address: Address }>(response);
  return data.address;
}

export async function migrateLegacyAddresses(input: {
  addresses: LegacySavedAddress[];
  phone?: string;
}): Promise<{ imported: number; skipped: number }> {
  const response = await fetch("/api/addresses/migrate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  return parseJson<{ imported: number; skipped: number }>(response);
}
