import { describe, expect, it } from "vitest";
import { verifyMutationOrigin } from "@/lib/security/mutation-origin";

function postRequest(
  url: string,
  headers: Record<string, string> = {}
): Request {
  return new Request(url, {
    method: "POST",
    headers,
  });
}

describe("verifyMutationOrigin", () => {
  it("allows same-origin requests on vercel.app", () => {
    const request = postRequest(
      "https://vibemusic-official.vercel.app/api/payment/create-order",
      { origin: "https://vibemusic-official.vercel.app" }
    );

    expect(verifyMutationOrigin(request)).toBe(true);
  });

  it("allows referer from vercel.app deployment", () => {
    const request = postRequest(
      "https://vibemusic-official.vercel.app/api/coupons/validate",
      { referer: "https://vibemusic-official.vercel.app/checkout" }
    );

    expect(verifyMutationOrigin(request)).toBe(true);
  });

  it("blocks cross-origin requests in production", () => {
    const request = postRequest(
      "https://vibemusic-official.vercel.app/api/payment/create-order",
      { origin: "https://evil.example.com" }
    );

    const previous = process.env.NODE_ENV;
    process.env.NODE_ENV = "production";
    expect(verifyMutationOrigin(request)).toBe(false);
    process.env.NODE_ENV = previous;
  });
});
