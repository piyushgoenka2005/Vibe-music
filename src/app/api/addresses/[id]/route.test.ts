import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/auth/server-session", () => ({
  getSessionUser: vi.fn(),
}));

vi.mock("@/lib/server/addressService", () => ({
  getUserAddress: vi.fn(),
  updateUserAddress: vi.fn(),
  deleteUserAddress: vi.fn(),
  setUserDefaultAddress: vi.fn(),
}));

vi.mock("@/lib/api/route-utils", async (importOriginal) => {
  const orig = await importOriginal<typeof import("@/lib/api/route-utils")>();
  return {
    ...orig,
    enforceRateLimit: vi.fn().mockResolvedValue(null),
  };
});

import { getSessionUser } from "@/lib/auth/server-session";
import { getUserAddress } from "@/lib/server/addressService";
import { GET } from "./route";

describe("GET /api/addresses/[id] (L-19 IDOR)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns address scoped to the authenticated user", async () => {
    vi.mocked(getSessionUser).mockResolvedValue({
      uid: "user_a",
      email: "a@example.com",
      name: "A",
    });
    vi.mocked(getUserAddress).mockResolvedValue({
      id: "addr_1",
      userId: "user_a",
      fullName: "A",
      phone: "9876543210",
      addressLine1: "1 St",
      city: "Kolkata",
      state: "WB",
      postalCode: "700001",
      country: "IN",
      isDefault: true,
      label: "Home",
    });

    const res = await GET(new Request("http://localhost/api/addresses/addr_1"), {
      params: Promise.resolve({ id: "addr_1" }),
    });

    expect(res.status).toBe(200);
    expect(getUserAddress).toHaveBeenCalledWith("user_a", "addr_1");
  });

  it("returns 404 when address is not owned by the user", async () => {
    vi.mocked(getSessionUser).mockResolvedValue({
      uid: "user_b",
      email: "b@example.com",
      name: "B",
    });
    vi.mocked(getUserAddress).mockResolvedValue(null);

    const res = await GET(new Request("http://localhost/api/addresses/addr_1"), {
      params: Promise.resolve({ id: "addr_1" }),
    });

    expect(res.status).toBe(404);
    expect(getUserAddress).toHaveBeenCalledWith("user_b", "addr_1");
  });
});
