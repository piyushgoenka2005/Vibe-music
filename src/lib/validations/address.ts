import { z } from "zod";

export function normalizeIndianPhone(value: string): string {
  const digits = value.replace(/\D/g, "");
  if (digits.length === 12 && digits.startsWith("91")) {
    return digits.slice(2);
  }
  if (digits.length === 11 && digits.startsWith("0")) {
    return digits.slice(1);
  }
  return digits;
}

export const addressInputSchema = z.object({
  fullName: z.string().trim().min(1, "Full name is required").max(120),
  phone: z
    .string()
    .trim()
    .transform(normalizeIndianPhone)
    .pipe(
      z
        .string()
        .min(10, "Enter a valid 10-digit phone number")
        .max(10, "Enter a valid 10-digit phone number")
        .regex(/^[6-9]\d{9}$/, "Enter a valid Indian mobile number")
    ),
  addressLine1: z.string().trim().min(1, "Address line 1 is required").max(200),
  addressLine2: z.string().trim().max(200).optional().or(z.literal("")),
  city: z.string().trim().min(1, "City is required").max(100),
  state: z.string().trim().min(1, "State is required").max(100),
  country: z.string().trim().min(1, "Country is required").max(100).default("India"),
  postalCode: z
    .string()
    .trim()
    .transform((value) => value.replace(/\s/g, ""))
    .pipe(
      z
        .string()
        .min(6, "Enter a valid PIN code")
        .max(6, "Enter a valid PIN code")
        .regex(/^[0-9]{6}$/, "PIN code must be 6 digits")
    ),
  isDefault: z.boolean().optional(),
  label: z.string().trim().max(50).optional().or(z.literal("")),
});

export const migrateAddressesSchema = z.object({
  addresses: z.array(
    z.object({
      id: z.string().optional(),
      label: z.string().optional(),
      name: z.string().min(1),
      line1: z.string().min(1),
      line2: z.string().optional(),
      city: z.string().min(1),
      state: z.string().min(1),
      postalCode: z.string().min(1),
      country: z.string().min(1),
      isDefault: z.boolean().optional(),
    })
  ),
  phone: z.string().optional(),
});

export type AddressInputValues = z.infer<typeof addressInputSchema>;
