import { describe, expect, it } from "vitest";
import { SECURITY_HEADERS } from "@/lib/security/headers";

function headerValue(name: string): string | undefined {
  return SECURITY_HEADERS.find((h) => h.key === name)?.value;
}

describe("SECURITY_HEADERS", () => {
  it("includes HSTS with preload", () => {
    const hsts = headerValue("Strict-Transport-Security");
    expect(hsts).toContain("max-age=");
    expect(hsts).toContain("includeSubDomains");
    expect(hsts).toContain("preload");
  });

  it("includes CSP, frame protection, and MIME sniffing guards", () => {
    expect(headerValue("Content-Security-Policy")).toContain("default-src 'self'");
    expect(headerValue("X-Frame-Options")).toBe("SAMEORIGIN");
    expect(headerValue("X-Content-Type-Options")).toBe("nosniff");
  });

  it("includes referrer and permissions policies", () => {
    expect(headerValue("Referrer-Policy")).toBe("strict-origin-when-cross-origin");
    expect(headerValue("Permissions-Policy")).toContain("camera=()");
  });
});
