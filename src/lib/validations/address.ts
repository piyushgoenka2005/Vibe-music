import { z } from "zod";

export const addressInputSchema = z.object({
  fullName: z.string().min(1, "Full name is required").max(120),
  phone: z
    .string()
    .min(10, "Enter a valid 10-digit phone number")
    .max(15)
    .regex(/^[0-9+\-\s]+$/, "Invalid phone number"),
  addressLine1: z.string().min(1, "Address line 1 is required").max(200),
  addressLine2: z.string().max(200).optional(),
  city: z.string().min(1, "City is required").max(100),
  state: z.string().min(1, "State is required").max(100),
  country: z.string().min(1, "Country is required").max(100),
  postalCode: z
    .string()
    .min(6, "Enter a valid PIN code")
    .max(10)
    .regex(/^[0-9]+$/, "PIN code must be numeric"),
  isDefault: z.boolean().optional(),
  label: z.string().max(50).optional(),
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
