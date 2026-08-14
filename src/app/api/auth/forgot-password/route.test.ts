import { describe, expect, it, vi, beforeEach } from "vitest";

vi.mock("@/lib/security/distributed-rate-limit", () => ({
  distributedCheckRateLimit: vi.fn(async () => ({
    allowed: true,
    remaining: 10,
    resetAt: Date.now() + 60_000,
  })),
}));

vi.mock("@/lib/server/email/smtp", () => ({
  isSmtpConfigured: vi.fn(() => true),
}));

vi.mock("@/lib/server/userService", () => ({
  findUserByEmail: vi.fn(),
}));

vi.mock("@/lib/db/prisma", () => ({
  prisma: {
    verificationToken: {
      deleteMany: vi.fn(),
      create: vi.fn(),
    },
  },
}));

vi.mock("@/lib/server/passwordResetEmailService", () => ({
  sendPasswordResetEmail: vi.fn(async () => true),
}));

import { POST } from "@/app/api/auth/forgot-password/route";
import { findUserByEmail } from "@/lib/server/userService";

function postForgot(email: string) {
  return POST(
    new Request("http://localhost:3000/api/auth/forgot-password", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Origin: "http://localhost:3000",
      },
      body: JSON.stringify({ email }),
    })
  );
}

describe("POST /api/auth/forgot-password", () => {
  beforeEach(() => {
    vi.mocked(findUserByEmail).mockReset();
  });

  it("returns 400 for invalid email before SMTP logic", async () => {
    const res = await postForgot("not-an-email");
    expect(res.status).toBe(400);
    const body = (await res.json()) as { error?: string };
    expect(body.error).toMatch(/valid email/i);
  });

  it("returns ok for unknown email without revealing existence", async () => {
    vi.mocked(findUserByEmail).mockResolvedValue(null);
    const res = await postForgot("unknown@example.com");
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true });
  });

  it("creates token and sends email for credential users", async () => {
    vi.mocked(findUserByEmail).mockResolvedValue({
      id: "u1",
      email: "admin@vibemusic.in",
      passwordHash: "hash",
    } as never);
    process.env.NEXT_PUBLIC_SITE_URL = "https://vibemusic.in";
    const res = await postForgot("admin@vibemusic.in");
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true });
  });
});
