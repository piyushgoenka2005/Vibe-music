import { describe, expect, it, beforeEach } from "vitest";
import {
  captureResetLinkForE2E,
  clearE2EResetCapture,
  getLastE2EResetCapture,
} from "@/lib/server/e2eResetCapture";

describe("e2eResetCapture", () => {
  beforeEach(() => {
    clearE2EResetCapture();
    delete process.env.E2E_TEST_MODE;
  });

  it("does not capture outside E2E mode", () => {
    captureResetLinkForE2E(
      "test@example.com",
      "https://vibemusic.in/reset-password?token=abc&email=test%40example.com"
    );
    expect(getLastE2EResetCapture()).toBeNull();
  });

  it("captures reset URL and token in E2E mode", () => {
    process.env.E2E_TEST_MODE = "true";
    captureResetLinkForE2E(
      "test@example.com",
      "https://vibemusic.in/reset-password?token=abc123&email=test%40example.com"
    );
    const capture = getLastE2EResetCapture();
    expect(capture?.email).toBe("test@example.com");
    expect(capture?.token).toBe("abc123");
    expect(capture?.resetUrl).toContain("reset-password");
  });
});
