import { describe, expect, it, vi, beforeEach } from "vitest";

vi.mock("@/lib/security/distributed-rate-limit", () => ({
  distributedCheckRateLimit: vi.fn(async () => ({
    allowed: true,
    remaining: 10,
    resetAt: Date.now() + 60_000,
  })),
}));

vi.mock("@/lib/server/userService", () => ({
  findUserByEmail: vi.fn(),
  updateUserPassword: vi.fn(),
}));

vi.mock("@/lib/db/prisma", () => ({
  prisma: {
    verificationToken: {
      findFirst: vi.fn(),
      deleteMany: vi.fn(),
    },
  },
}));

import { POST } from "@/app/api/auth/reset-password/route";
import { findUserByEmail, updateUserPassword } from "@/lib/server/userService";
import { prisma } from "@/lib/db/prisma";

function postReset(body: Record<string, string>) {
  return POST(
    new Request("http://localhost:3000/api/auth/reset-password", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Origin: "http://localhost:3000",
      },
      body: JSON.stringify(body),
    })
  );
}

describe("POST /api/auth/reset-password", () => {
  beforeEach(() => {
    vi.mocked(findUserByEmail).mockReset();
    vi.mocked(prisma.verificationToken.findFirst).mockReset();
  });

  it("returns 400 for short passwords", async () => {
    const res = await postReset({
      email: "user@example.com",
      token: "tok",
      password: "short",
    });
    expect(res.status).toBe(400);
  });

  it("returns 400 for invalid or expired token", async () => {
    vi.mocked(findUserByEmail).mockResolvedValue({ id: "u1" } as never);
    vi.mocked(prisma.verificationToken.findFirst).mockResolvedValue(null);
    const res = await postReset({
      email: "user@example.com",
      token: "bad-token",
      password: "NewSecure1!",
    });
    expect(res.status).toBe(400);
    const body = (await res.json()) as { error?: string };
    expect(body.error).toMatch(/invalid or expired/i);
  });

  it("updates password and clears tokens on success", async () => {
    vi.mocked(findUserByEmail).mockResolvedValue({ id: "u1" } as never);
    vi.mocked(prisma.verificationToken.findFirst).mockResolvedValue({
      identifier: "user@example.com",
      token: "hash",
      expires: new Date(Date.now() + 60_000),
    } as never);
    const res = await postReset({
      email: "user@example.com",
      token: "valid-token",
      password: "NewSecure1!",
    });
    expect(res.status).toBe(200);
    expect(updateUserPassword).toHaveBeenCalledWith("u1", "NewSecure1!");
    expect(prisma.verificationToken.deleteMany).toHaveBeenCalled();
  });
});
