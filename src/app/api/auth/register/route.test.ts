import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/api/route-utils", async (importOriginal) => {
  const orig = await importOriginal<typeof import("@/lib/api/route-utils")>();
  return {
    ...orig,
    enforceRateLimit: vi.fn().mockResolvedValue(null),
    enforceMutationSecurity: vi.fn().mockReturnValue(null),
    handleRouteError: vi.fn((error: unknown) => {
      const message = error instanceof Error ? error.message : "Server error";
      return new Response(JSON.stringify({ error: message }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }),
  };
});

vi.mock("@/lib/server/userService", () => ({
  findUserByEmail: vi.fn(),
  createAuthUser: vi.fn(),
}));

import { POST } from "./route";
import { enforceMutationSecurity } from "@/lib/api/route-utils";
import { createAuthUser, findUserByEmail } from "@/lib/server/userService";

function makeRequest(body: Record<string, unknown>): Request {
  return new Request("http://localhost/api/auth/register", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Origin: "http://localhost:3000",
    },
    body: JSON.stringify(body),
  });
}

const validRegisterBody = {
  name: "Test User",
  email: "newuser@example.com",
  password: "Secret123",
  confirmPassword: "Secret123",
};

describe("POST /api/auth/register", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(enforceMutationSecurity).mockReturnValue(null);
    vi.mocked(findUserByEmail).mockResolvedValue(null);
    vi.mocked(createAuthUser).mockResolvedValue({
      id: "user-new-1",
      email: "newuser@example.com",
    } as Awaited<ReturnType<typeof createAuthUser>>);
  });

  it("returns 403 when CSRF check fails", async () => {
    vi.mocked(enforceMutationSecurity).mockReturnValue(
      new Response(JSON.stringify({ error: "Invalid origin" }), { status: 403 }),
    );

    const res = await POST(makeRequest(validRegisterBody));
    expect(res.status).toBe(403);
    expect(createAuthUser).not.toHaveBeenCalled();
  });

  it("rejects invalid registration payload", async () => {
    const res = await POST(
      makeRequest({
        ...validRegisterBody,
        password: "short",
        confirmPassword: "short",
      }),
    );
    expect(res.status).toBe(400);
    expect(createAuthUser).not.toHaveBeenCalled();
  });

  it("returns 409 when email already exists", async () => {
    vi.mocked(findUserByEmail).mockResolvedValue({
      id: "existing",
      email: "newuser@example.com",
    } as Awaited<ReturnType<typeof findUserByEmail>>);

    const res = await POST(makeRequest(validRegisterBody));
    expect(res.status).toBe(409);
    expect(createAuthUser).not.toHaveBeenCalled();
  });

  it("creates a new user for valid registration", async () => {
    const res = await POST(makeRequest(validRegisterBody));
    expect(res.status).toBe(200);
    expect(createAuthUser).toHaveBeenCalledWith({
      email: "newuser@example.com",
      password: "Secret123",
      name: "Test User",
    });
    const body = (await res.json()) as { ok?: boolean; userId?: string };
    expect(body.ok).toBe(true);
    expect(body.userId).toBe("user-new-1");
  });
});
