import type { InvoiceOrder } from "./invoice-types";

export const INVOICE_BRAND = {
  primary: "#1253ED",
  primaryDark: "#0f3f99",
  white: "#ffffff",
  text: "#0f172a",
  muted: "#64748b",
  border: "#e2e8f0",
  subtle: "#f8fafc",
} as const;

export const INVOICE_SELLER = {
  name: "Vibe Music",
  legalName: "Vibe Music",
  tagline: "Your Sound, Delivered",
  address: "Mumbai, Maharashtra, India",
  email: "support@vibemusic.in",
  phone: "+91-9876543210",
  website: "vibemusic.in",
  gstin: "",
  pan: "",
  state: "Maharashtra",
  stateCode: "27",
} as const;

export type InvoiceSeller = {
  name: string;
  legalName: string;
  tagline?: string;
  address: string;
  email: string;
  phone: string;
  website?: string;
  gstin?: string;
  pan?: string;
  state?: string;
  stateCode?: string;
};

const ones = [
  "",
  "One",
  "Two",
  "Three",
  "Four",
  "Five",
  "Six",
  "Seven",
  "Eight",
  "Nine",
  "Ten",
  "Eleven",
  "Twelve",
  "Thirteen",
  "Fourteen",
  "Fifteen",
  "Sixteen",
  "Seventeen",
  "Eighteen",
  "Nineteen",
];

const tens = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];

function twoDigits(n: number): string {
  if (n < 20) return ones[n] ?? "";
  const t = Math.floor(n / 10);
  const o = n % 10;
  return `${tens[t]}${o ? ` ${ones[o]}` : ""}`.trim();
}

function threeDigits(n: number): string {
  if (n === 0) return "";
  if (n < 100) return twoDigits(n);
  const h = Math.floor(n / 100);
  const rest = n % 100;
  return `${ones[h]} Hundred${rest ? ` ${twoDigits(rest)}` : ""}`;
}

function indianNumberWords(n: number): string {
  if (n === 0) return "Zero";
  const parts: string[] = [];
  const crore = Math.floor(n / 10000000);
  const lakh = Math.floor((n % 10000000) / 100000);
  const thousand = Math.floor((n % 100000) / 1000);
  const hundred = n % 1000;
  if (crore) parts.push(`${threeDigits(crore)} Crore`);
  if (lakh) parts.push(`${twoDigits(lakh)} Lakh`);
  if (thousand) parts.push(`${twoDigits(thousand)} Thousand`);
  if (hundred) parts.push(threeDigits(hundred));
  return parts.join(" ");
}

export function amountInWordsInr(amount: number): string {
  const rupees = Math.floor(amount);
  const paise = Math.round((amount - rupees) * 100);
  let words = indianNumberWords(rupees);
  words = words ? `${words} Rupees` : "Zero Rupees";
  if (paise > 0) words += ` and ${twoDigits(paise)} Paise`;
  return `${words} Only`;
}

export function formatInvoiceDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "Asia/Kolkata",
  });
}

export function formatInvoiceDateTime(iso: string): string {
  return new Date(iso).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Kolkata",
  });
}

export function paymentMethodLabel(method: string): string {
  if (method === "razorpay") return "Razorpay — UPI / Card / Net Banking";
  if (method === "demo") return "Demo Payment";
  if (method === "cod") return "Cash on Delivery (COD)";
  return method;
}

export function invoicePaymentDateLabel(order: InvoiceOrder): string {
  if (order.payment.paidAt) return formatInvoiceDate(order.payment.paidAt);
  if (order.payment.method === "cod") return "Pay on delivery";
  return "Pending";
}

export function invoiceStatusBadge(order: InvoiceOrder): {
  label: string;
  tone: "paid" | "cod" | "pending";
} {
  if (order.status === "paid") return { label: "PAID", tone: "paid" };
  if (order.payment.method === "cod" || order.status === "confirmed") {
    return { label: "COD", tone: "cod" };
  }
  return { label: "PENDING", tone: "pending" };
}

export function gstSupplyType(isIntraState: boolean): string {
  return isIntraState ? "Intra-state (CGST + SGST)" : "Inter-state (IGST)";
}
