import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { getAdminEmailsFromEnv } from "./adminLoginGate";

describe("adminLoginGate: getAdminEmailsFromEnv", () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    delete process.env.ADMIN_EMAILS;
    delete process.env.ADMIN_EMAIL;
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it("returns empty set when env variables are not set", () => {
    const emails = getAdminEmailsFromEnv();
    expect(emails.size).toBe(0);
  });

  it("parses single ADMIN_EMAIL", () => {
    process.env.ADMIN_EMAIL = "superadmin@vibemusic.in";
    const emails = getAdminEmailsFromEnv();
    expect(emails.has("superadmin@vibemusic.in")).toBe(true);
    expect(emails.size).toBe(1);
  });

  it("parses comma-separated ADMIN_EMAILS with trimming and lowercasing", () => {
    process.env.ADMIN_EMAILS = " Admin1@VibeMusic.in , admin2@vibemusic.in, invalid-email ";
    const emails = getAdminEmailsFromEnv();
    expect(emails.has("admin1@vibemusic.in")).toBe(true);
    expect(emails.has("admin2@vibemusic.in")).toBe(true);
    expect(emails.has("invalid-email")).toBe(false);
    expect(emails.size).toBe(2);
  });
});
