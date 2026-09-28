import { afterEach, describe, expect, it } from "vitest";
import {
  crispChatStatus,
  gstinComplianceStatus,
  smsChannelStatus,
  whatsappChannelStatus,
} from "@/lib/server/integrationChannels";

describe("integrationChannels", () => {
  const envBackup = { ...process.env };

  afterEach(() => {
    process.env = { ...envBackup };
  });

  it("reports missing GSTIN", () => {
    delete process.env.NEXT_PUBLIC_GSTIN;
    expect(gstinComplianceStatus()).toBe("missing");
  });

  it("reports ok GSTIN when valid", () => {
    process.env.NEXT_PUBLIC_GSTIN = "27AABCU9603R1ZM";
    expect(gstinComplianceStatus()).toBe("ok");
  });

  it("reports partial SMS when MSG91 keys incomplete", () => {
    process.env.SMS_PROVIDER = "msg91";
    process.env.MSG91_AUTH_KEY = "key";
    delete process.env.MSG91_SENDER_ID;
    expect(smsChannelStatus()).toBe("partial");
  });

  it("reports missing WhatsApp without token", () => {
    delete process.env.WHATSAPP_TOKEN;
    expect(whatsappChannelStatus()).toBe("missing");
  });

  it("reports missing Crisp without website id", () => {
    delete process.env.NEXT_PUBLIC_CRISP_WEBSITE_ID;
    expect(crispChatStatus()).toBe("missing");
  });
});
