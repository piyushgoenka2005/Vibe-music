import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ensureRazorpayScriptLoaded } from "./useRazorpay";

describe("ensureRazorpayScriptLoaded", () => {
  beforeEach(() => {
    vi.stubGlobal("window", {
      Razorpay: undefined,
      setTimeout: (fn: () => void, ms: number) => globalThis.setTimeout(fn, ms),
      clearTimeout: globalThis.clearTimeout,
    });
    vi.stubGlobal("document", {
      querySelector: vi.fn(() => null),
      head: { appendChild: vi.fn() },
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.resetModules();
  });

  it("resolves immediately when Razorpay is already on window", async () => {
    (window as Window & { Razorpay?: unknown }).Razorpay = class {};
    await expect(ensureRazorpayScriptLoaded()).resolves.toBeUndefined();
  });
});
