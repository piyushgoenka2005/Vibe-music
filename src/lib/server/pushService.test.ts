import { describe, expect, it } from "vitest";
import { getVapidPublicKey, isPushConfigured } from "@/lib/server/pushService";

describe("pushService", () => {
  it("is inert without VAPID keys", () => {
    expect(isPushConfigured()).toBe(false);
    expect(getVapidPublicKey()).toBe("");
  });
});
