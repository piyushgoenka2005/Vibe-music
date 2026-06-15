export interface Address {
  id: string;
  userId: string;
  fullName: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  country: string;
  postalCode: string;
  isDefault: boolean;
  label?: string;
  createdAt: string;
  updatedAt: string;
}

export type CreateAddressInput = Omit<
  Address,
  "id" | "userId" | "createdAt" | "updatedAt" | "isDefault"
> & {
  isDefault?: boolean;
};

export type UpdateAddressInput = Partial<CreateAddressInput>;

export interface LegacySavedAddress {
  id: string;
  label: string;
  name: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  isDefault: boolean;
}
