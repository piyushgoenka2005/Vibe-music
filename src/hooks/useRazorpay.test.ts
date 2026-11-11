import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ensureRazorpayScriptLoaded } from "./useRazorpay";

describe("ensureRazorpayScriptLoaded", () => {
  beforeEach(() => {
    vi.stubGlobal("window", {
      Razorpay: undefined,
      setTimeout: (fn: () => void, ms: number) => globalThis.setTimeout(fn, ms),
      clearTimeout: globalThis.clearTimeout,
      setInterval: (fn: () => void, ms: number) => globalThis.setInterval(fn, ms),
      clearInterval: globalThis.clearInterval,
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
    window.Razorpay = class {
      open() {}
      on() {}
    } as NonNullable<Window["Razorpay"]>;
    await expect(ensureRazorpayScriptLoaded()).resolves.toBeUndefined();
  });

  it("fails fast when existing script in DOM is already marked failed", async () => {
    const mockScript = {
      dataset: { razorpayFailed: "true" },
      getAttribute: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    } as unknown as HTMLScriptElement;

    vi.stubGlobal("document", {
      querySelector: vi.fn(() => mockScript),
      head: { appendChild: vi.fn() },
    });

    await expect(ensureRazorpayScriptLoaded()).rejects.toThrow(
      /Failed to load Razorpay payment gateway script/i,
    );
  });

  it("fails fast when script emits an error event (e.g. blocked by ad blocker)", async () => {
    let capturedOnError: (() => void) | undefined;
    const mockScript = {
      dataset: {},
      getAttribute: vi.fn(),
      addEventListener: vi.fn((event: string, handler: () => void) => {
        if (event === "error") capturedOnError = handler;
      }),
      removeEventListener: vi.fn(),
    } as unknown as HTMLScriptElement;

    vi.stubGlobal("document", {
      querySelector: vi.fn(() => mockScript),
      head: { appendChild: vi.fn() },
    });

    const promise = ensureRazorpayScriptLoaded();
    expect(mockScript.addEventListener).toHaveBeenCalledWith("error", expect.any(Function), {
      once: true,
    });

    capturedOnError?.();

    await expect(promise).rejects.toThrow(/Failed to load Razorpay payment gateway script/i);
    expect(mockScript.dataset.razorpayFailed).toBe("true");
  });

  it("resolves when existing in-DOM script emits load event and attaches window.Razorpay", async () => {
    let capturedOnLoad: (() => void) | undefined;
    const mockScript = {
      dataset: {},
      getAttribute: vi.fn((attr: string) => (attr === "data-nscript" ? "afterInteractive" : null)),
      addEventListener: vi.fn((event: string, handler: () => void) => {
        if (event === "load") capturedOnLoad = handler;
      }),
      removeEventListener: vi.fn(),
    } as unknown as HTMLScriptElement;

    vi.stubGlobal("document", {
      querySelector: vi.fn(() => mockScript),
      head: { appendChild: vi.fn() },
    });

    const promise = ensureRazorpayScriptLoaded();
    expect(mockScript.addEventListener).toHaveBeenCalledWith("load", expect.any(Function), {
      once: true,
    });

    // Simulate script finishing load and attaching window.Razorpay
    window.Razorpay = class {
      open() {}
      on() {}
    } as NonNullable<Window["Razorpay"]>;
    capturedOnLoad?.();

    await expect(promise).resolves.toBeUndefined();
    expect(mockScript.dataset.razorpayLoaded).toBe("true");
  });
});
