import { describe, expect, it } from "vitest";
import { BRAND, DEFAULT_STORE_PHONE, buildWhatsAppUrl, formatIndianPhone } from "./brand";

describe("brand contact", () => {
  it("formats a 10-digit Indian mobile for display and tel links", () => {
    const formatted = formatIndianPhone(DEFAULT_STORE_PHONE);
    expect(formatted.display).toBe("+91 89104 82950");
    expect(formatted.tel).toBe("+918910482950");
    expect(formatted.whatsappDigits).toBe("918910482950");
  });

  it("builds a WhatsApp deep link with optional prefilled message", () => {
    expect(buildWhatsAppUrl("+918910482950")).toBe("https://wa.me/918910482950");
    expect(buildWhatsAppUrl("8910482950", "Hello")).toBe("https://wa.me/8910482950?text=Hello");
  });

  it("exposes storefront support phone and WhatsApp URL from BRAND", () => {
    expect(BRAND.phoneDisplay).toContain("89104");
    expect(BRAND.phoneTel).toBe("+918910482950");
    expect(BRAND.whatsappUrl).toContain("https://wa.me/918910482950");
    expect(BRAND.whatsappUrl).toContain("text=");
  });
});
