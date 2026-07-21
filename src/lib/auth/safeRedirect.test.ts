import { describe, expect, it } from "vitest";
import { sanitizeAuthRedirect } from "@/lib/auth/safeRedirect";

describe("sanitizeAuthRedirect", () => {
  it("allows relative paths", () => {
    expect(sanitizeAuthRedirect("/account/orders")).toBe("/account/orders");
    expect(sanitizeAuthRedirect("/checkout?step=1")).toBe("/checkout?step=1");
  });

  it("rejects open redirects", () => {
    expect(sanitizeAuthRedirect("//evil.com")).toBe("/account");
    expect(sanitizeAuthRedirect("https://evil.com")).toBe("/account");
    expect(sanitizeAuthRedirect("http://evil.com")).toBe("/account");
    expect(sanitizeAuthRedirect("\\evil")).toBe("/account");
    expect(sanitizeAuthRedirect("javascript:alert(1)")).toBe("/account");
  });

  it("uses custom fallback", () => {
    expect(sanitizeAuthRedirect("//x", "/cart")).toBe("/cart");
  });
});
