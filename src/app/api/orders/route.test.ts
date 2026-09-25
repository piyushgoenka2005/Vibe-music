import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/auth/server-session", () => ({
  getSessionUser: vi.fn(),
}));

vi.mock("@/lib/server/orderService", () => ({
  listOrdersForUser: vi.fn(),
}));

vi.mock("@/lib/api/route-utils", async (importOriginal) => {
  const orig = await importOriginal<typeof import("@/lib/api/route-utils")>();
  return {
    ...orig,
    enforceRateLimit: vi.fn().mockResolvedValue(null),
  };
});

import { getSessionUser } from "@/lib/auth/server-session";
import { listOrdersForUser } from "@/lib/server/orderService";
import { GET } from "./route";

describe("GET /api/orders", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("lists orders by authenticated user id only", async () => {
    vi.mocked(getSessionUser).mockResolvedValue({
      uid: "user_a",
      email: "buyer@example.com",
      name: "Buyer",
    });
    vi.mocked(listOrdersForUser).mockResolvedValue([]);

    const response = await GET(new Request("http://localhost/api/orders"));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(listOrdersForUser).toHaveBeenCalledWith("user_a");
    expect(listOrdersForUser).toHaveBeenCalledTimes(1);
    expect(body).toEqual({ orders: [] });
  });

  it("returns 401 when unauthenticated", async () => {
    vi.mocked(getSessionUser).mockResolvedValue(null);

    const response = await GET(new Request("http://localhost/api/orders"));

    expect(response.status).toBe(401);
    expect(listOrdersForUser).not.toHaveBeenCalled();
  });
});
