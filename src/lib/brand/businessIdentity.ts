/**
 * Canonical registered business identity — use everywhere (footer, invoices, JSON-LD, legal pages).
 */
export const CANONICAL_LEGAL_ENTITY_NAME = "Sikkim Commerce House Pvt Ltd";

export const CANONICAL_BUSINESS_ADDRESS =
  "Sikkim Commerce House, 4/1 Middleton Street, 3rd Floor, Room 303, Kolkata – 700071, West Bengal, India";

/** GST place-of-supply / invoice seller state — matches registered Kolkata address. */
export const REGISTERED_BUSINESS_STATE = "West Bengal";

export const SUPPORT_HOURS_LABEL = "Mon–Sat";
export const SUPPORT_HOURS_DETAIL = "Gear advisors reply by email Mon–Sat (IST business hours).";

export const DISPATCH_COPY =
  "Orders are packed securely and dispatched within 1–2 business days after payment confirmation.";

/** DPDP / Consumer Protection grievance contact (shown in footer and legal pages). */
export const GRIEVANCE_OFFICER_NAME =
  process.env.NEXT_PUBLIC_GRIEVANCE_OFFICER_NAME?.trim() || "Customer Grievance Officer";

export const GRIEVANCE_OFFICER_EMAIL =
  process.env.NEXT_PUBLIC_GRIEVANCE_EMAIL?.trim() || "support@vibemusic.in";
