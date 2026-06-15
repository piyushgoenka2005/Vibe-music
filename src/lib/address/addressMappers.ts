import type { Address, LegacySavedAddress } from "@/types/address";
import type { ShippingAddress } from "@/types/order";

export function addressToShipping(address: Address): ShippingAddress {
  return {
    name: address.fullName,
    line1: address.addressLine1,
    line2: address.addressLine2,
    city: address.city,
    state: address.state,
    postalCode: address.postalCode,
    country: address.country,
    phone: address.phone,
  };
}

export function legacyAddressToInput(
  legacy: LegacySavedAddress,
  fallbackPhone = ""
): Omit<Address, "id" | "userId" | "createdAt" | "updatedAt"> {
  return {
    fullName: legacy.name,
    phone: fallbackPhone,
    addressLine1: legacy.line1,
    addressLine2: legacy.line2,
    city: legacy.city,
    state: legacy.state,
    country: legacy.country,
    postalCode: legacy.postalCode,
    isDefault: legacy.isDefault,
    label: legacy.label,
  };
}

export function formatAddressLines(address: Address): string {
  const parts = [
    address.fullName,
    address.addressLine1,
    address.addressLine2,
    `${address.city}, ${address.state} ${address.postalCode}`,
    address.country,
    address.phone ? `Phone: ${address.phone}` : null,
  ].filter(Boolean);
  return parts.join("\n");
}

export function getAddressDisplayLabel(address: Address): string {
  return address.label?.trim() || "Address";
}
