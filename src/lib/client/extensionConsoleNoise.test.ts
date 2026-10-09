import { describe, expect, it } from "vitest";
import { isBrowserExtensionConsoleNoise, isExtensionScriptFilename } from "./extensionConsoleNoise";

describe("extensionConsoleNoise", () => {
  it("detects save-page extension errors", () => {
    expect(
      isBrowserExtensionConsoleNoise(new Error("Cannot find menu item with id save-page")),
    ).toBe(true);
  });

  it("detects nested uncaught wrapper messages", () => {
    expect(
      isBrowserExtensionConsoleNoise(
        new Error("Uncaught Error: Cannot find menu item with id save-page"),
      ),
    ).toBe(true);
  });

  it("ignores normal application errors", () => {
    expect(isBrowserExtensionConsoleNoise(new Error("Payment verification failed"))).toBe(false);
  });

  it("detects extension script filenames", () => {
    expect(isExtensionScriptFilename("chrome-extension://abc/contentscript.js")).toBe(true);
    expect(isExtensionScriptFilename("/_next/static/chunks/main.js")).toBe(false);
  });
});
