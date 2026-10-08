import { afterEach, describe, expect, it, vi } from "vitest";

const ENV_KEYS = [
  "GOOGLE_PLACES_API_KEY",
  "GOOGLE_MAPS_API_KEY",
  "NEXT_PUBLIC_GOOGLE_MAPS_API_KEY",
  "NEXT_PUBLIC_GOOGLE_PLACES_API_KEY",
] as const;

function clearPlacesEnv(): void {
  for (const key of ENV_KEYS) {
    delete process.env[key];
  }
}

describe("googlePlaces config", () => {
  afterEach(() => {
    clearPlacesEnv();
    vi.resetModules();
  });

  it("prefers GOOGLE_PLACES_API_KEY and ignores placeholders", async () => {
    clearPlacesEnv();
    process.env.GOOGLE_PLACES_API_KEY = "placeholder-key";
    process.env.GOOGLE_MAPS_API_KEY = "AIzaSy-real-looking-key-value";

    const {
      getGooglePlacesApiKey,
      inspectGooglePlacesConfig,
      isGooglePlacesConfigured,
      resetGooglePlacesLogStateForTests,
    } = await import("@/lib/server/googlePlaces");
    resetGooglePlacesLogStateForTests();

    expect(isGooglePlacesConfigured()).toBe(true);
    expect(getGooglePlacesApiKey()).toBe("AIzaSy-real-looking-key-value");
    expect(inspectGooglePlacesConfig()).toEqual({
      status: "configured",
      source: "GOOGLE_MAPS_API_KEY",
      keyLength: "AIzaSy-real-looking-key-value".length,
    });
  });

  it("reports invalid when only placeholder values are set", async () => {
    clearPlacesEnv();
    process.env.GOOGLE_PLACES_API_KEY = "your-api-key-here";

    const {
      inspectGooglePlacesConfig,
      isGooglePlacesConfigured,
      resetGooglePlacesLogStateForTests,
    } = await import("@/lib/server/googlePlaces");
    resetGooglePlacesLogStateForTests();

    expect(isGooglePlacesConfigured()).toBe(false);
    expect(inspectGooglePlacesConfig()).toEqual({
      status: "invalid",
      reason: "placeholder",
      source: "GOOGLE_PLACES_API_KEY",
    });
  });

  it("reports invalid when key is too short", async () => {
    clearPlacesEnv();
    process.env.GOOGLE_PLACES_API_KEY = "AIzaSyShort";

    const {
      inspectGooglePlacesConfig,
      isGooglePlacesConfigured,
      resetGooglePlacesLogStateForTests,
    } = await import("@/lib/server/googlePlaces");
    resetGooglePlacesLogStateForTests();

    expect(isGooglePlacesConfigured()).toBe(false);
    expect(inspectGooglePlacesConfig()).toEqual({
      status: "invalid",
      reason: "too_short",
      source: "GOOGLE_PLACES_API_KEY",
    });
  });

  it("reports missing when no env keys are set", async () => {
    clearPlacesEnv();

    const {
      inspectGooglePlacesConfig,
      isGooglePlacesConfigured,
      resetGooglePlacesLogStateForTests,
    } = await import("@/lib/server/googlePlaces");
    resetGooglePlacesLogStateForTests();

    expect(isGooglePlacesConfigured()).toBe(false);
    expect(inspectGooglePlacesConfig()).toEqual({ status: "missing" });
  });
});
