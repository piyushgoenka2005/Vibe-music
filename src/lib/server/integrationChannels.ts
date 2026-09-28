import "server-only";

import { isValidGstin } from "@/lib/gst/gstin";
import type { IntegrationStatus } from "@/lib/server/integrationConfig";
import { isPushConfigured } from "@/lib/server/pushService";

function configured(...values: Array<string | undefined>): boolean {
  return values.every((value) => Boolean(value?.trim()));
}

export function gstinComplianceStatus(): IntegrationStatus {
  const gstin = process.env.NEXT_PUBLIC_GSTIN?.trim() || process.env.STORE_GSTIN?.trim() || "";
  if (!gstin) return "missing";
  return isValidGstin(gstin) ? "ok" : "partial";
}

export function smsChannelStatus(): IntegrationStatus {
  const provider = (process.env.SMS_PROVIDER ?? "").toLowerCase();
  if (provider !== "msg91") return "missing";
  const ok = configured(
    process.env.MSG91_AUTH_KEY,
    process.env.MSG91_SENDER_ID,
    process.env.MSG91_TEMPLATE_ORDER,
  );
  return ok ? "ok" : "partial";
}

export function whatsappChannelStatus(): IntegrationStatus {
  const ok = configured(process.env.WHATSAPP_TOKEN, process.env.WHATSAPP_PHONE_NUMBER_ID);
  return ok ? "ok" : "missing";
}

export function webPushChannelStatus(): IntegrationStatus {
  if (isPushConfigured()) return "ok";
  const partial = configured(
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY,
  );
  return partial ? "partial" : "missing";
}

export function crispChatStatus(): IntegrationStatus {
  const id = process.env.NEXT_PUBLIC_CRISP_WEBSITE_ID?.trim() ?? "";
  if (!id) return "missing";
  if (/^(your-|xxx+|changeme|placeholder)/i.test(id)) return "partial";
  return "ok";
}
