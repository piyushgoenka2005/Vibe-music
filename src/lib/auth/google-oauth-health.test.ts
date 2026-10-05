import { afterEach, describe, expect, it, vi } from "vitest";

describe("probeGoogleOAuthClient", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it("treats invalid_grant as a healthy client", async () => {
    vi.stubEnv("AUTH_GOOGLE_ID", "123456789012-abcdefghijklmnop.apps.googleusercontent.com");
    vi.stubEnv("AUTH_GOOGLE_SECRET", "GOCSPX-test-secret-value");
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://vibemusic.in");

    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        json: async () => ({ error: "invalid_grant" }),
      }),
    );

    const { probeGoogleOAuthClient } = await import("@/lib/auth/google-oauth-health");
    const result = await probeGoogleOAuthClient({ bypassCache: true });
    expect(result.ok).toBe(true);
    expect(result.redirectUri).toBe("https://vibemusic.in/api/auth/callback/google");
  });

  it("detects deleted OAuth clients", async () => {
    vi.stubEnv("AUTH_GOOGLE_ID", "123456789012-abcdefghijklmnop.apps.googleusercontent.com");
    vi.stubEnv("AUTH_GOOGLE_SECRET", "GOCSPX-test-secret-value");

    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        json: async () => ({
          error: "deleted_client",
          error_description: "The OAuth client was deleted.",
        }),
      }),
    );

    const { probeGoogleOAuthClient } = await import("@/lib/auth/google-oauth-health");
    const result = await probeGoogleOAuthClient({ bypassCache: true });
    expect(result.ok).toBe(false);
    expect(result.reason).toBe("deleted_client");
  });
});
