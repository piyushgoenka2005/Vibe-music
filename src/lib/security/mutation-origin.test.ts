import { describe, expect, it } from "vitest";
import { isWebhookPath, verifyMutationOrigin } from "@/lib/security/mutation-origin";

function postRequest(url: string, headers: Record<string, string> = {}): Request {
  return new Request(url, {
    method: "POST",
    headers,
  });
}

describe("isWebhookPath", () => {
  it("includes Meta CAPI browser relay", () => {
    expect(isWebhookPath("/api/analytics/meta")).toBe(true);
  });
});

describe("verifyMutationOrigin", () => {
  it("allows same-origin requests", () => {
    const request = postRequest("https://vibemusic.in/api/payment/create-order", {
      origin: "https://vibemusic.in",
    });

    expect(verifyMutationOrigin(request)).toBe(true);
  });

  it("allows referer from the same site", () => {
    const request = postRequest("https://vibemusic.in/api/coupons/validate", {
      referer: "https://vibemusic.in/checkout",
    });

    expect(verifyMutationOrigin(request)).toBe(true);
  });

  it("blocks arbitrary vercel.app origins (not allowlisted)", () => {
    const request = postRequest("https://vibemusic.in/api/payment/create-order", {
      origin: "https://attacker.vercel.app",
    });

    const env = process.env as { NODE_ENV?: string };
    const previous = env.NODE_ENV;
    env.NODE_ENV = "production";
    expect(verifyMutationOrigin(request)).toBe(false);
    env.NODE_ENV = previous;
  });

  it("blocks cross-origin requests in production", () => {
    const request = postRequest("https://vibemusic.in/api/payment/create-order", {
      origin: "https://evil.example.com",
    });

    const env = process.env as { NODE_ENV?: string };
    const previous = env.NODE_ENV;
    env.NODE_ENV = "production";
    expect(verifyMutationOrigin(request)).toBe(false);
    env.NODE_ENV = previous;
  });
});
