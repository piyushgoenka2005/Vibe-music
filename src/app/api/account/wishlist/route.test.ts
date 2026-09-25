import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/auth/server-session", () => ({
  getSessionUser: vi.fn(),
}));

vi.mock("@/lib/server/prisma/usersRepository", () => ({
  getWishlistItems: vi.fn(),
  upsertWishlistItems: vi.fn(),
}));

vi.mock("@/lib/api/route-utils", async (importOriginal) => {
  const orig = await importOriginal<typeof import("@/lib/api/route-utils")>();
  return {
    ...orig,
    enforceRateLimit: vi.fn().mockResolvedValue(null),
  };
});

import { getSessionUser } from "@/lib/auth/server-session";
import * as pgUsers from "@/lib/server/prisma/usersRepository";
import { GET } from "./route";

describe("GET /api/account/wishlist (L-19 IDOR)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("loads wishlist for the authenticated user id only", async () => {
    vi.mocked(getSessionUser).mockResolvedValue({
      uid: "user_a",
      email: "a@example.com",
      name: "A",
    });
    vi.mocked(pgUsers.getWishlistItems).mockResolvedValue([
      {
        productId: "prod_1",
        slug: "guitar",
        name: "Guitar",
        brand: "Hertz",
        price: 10000,
        imageColor: "#000",
        image: "",
        addedAt: Date.now(),
      },
    ]);

    const res = await GET(new Request("http://localhost/api/account/wishlist"));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(pgUsers.getWishlistItems).toHaveBeenCalledWith("user_a");
    expect(body.items).toHaveLength(1);
  });

  it("returns 401 when unauthenticated", async () => {
    vi.mocked(getSessionUser).mockResolvedValue(null);

    const res = await GET(new Request("http://localhost/api/account/wishlist"));

    expect(res.status).toBe(401);
    expect(pgUsers.getWishlistItems).not.toHaveBeenCalled();
  });
});
