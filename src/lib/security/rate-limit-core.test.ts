import { describe, expect, it } from "vitest";
import { getClientIp } from "@/lib/security/rate-limit-core";

describe("getClientIp", () => {
  it("prefers X-Real-IP over spoofable left-most X-Forwarded-For", () => {
    const request = new Request("https://vibemusic.in/api/health", {
      headers: {
        "x-forwarded-for": "1.2.3.4, 10.0.0.1",
        "x-real-ip": "10.0.0.1",
      },
    });
    expect(getClientIp(request)).toBe("10.0.0.1");
  });

  it("uses rightmost forwarded hop when X-Real-IP is absent", () => {
    const request = new Request("https://vibemusic.in/api/health", {
      headers: {
        "x-forwarded-for": "9.9.9.9, 203.0.113.10",
      },
    });
    expect(getClientIp(request)).toBe("203.0.113.10");
  });
});
