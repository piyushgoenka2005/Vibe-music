import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/server/addressService", () => ({
  getUserAddresses: vi.fn(),
  createUserAddress: vi.fn(),
}));

vi.mock("@/lib/auth/server-session", () => ({
  getSessionUser: vi.fn(),
}));

vi.mock("@/lib/api/route-utils", async (importOriginal) => {
  const orig = await importOriginal<typeof import("@/lib/api/route-utils")>();
  return {
    ...orig,
    enforceRateLimit: vi.fn().mockResolvedValue(null),
  };
});

import { GET, POST } from "./route";
import { getUserAddresses, createUserAddress } from "@/lib/server/addressService";
import { getSessionUser } from "@/lib/auth/server-session";
import { enforceRateLimit } from "@/lib/api/route-utils";

const VALID_ADDRESS = {
  fullName: "Test User",
  phone: "9876543210",
  addressLine1: "456 Oak Avenue",
  city: "Mumbai",
  state: "Maharashtra",
  postalCode: "400001",
  country: "India",
};

function makeRequest(url: string, method = "GET", body?: Record<string, unknown>): Request {
  return new Request(url, {
    method,
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
}

describe("GET /api/addresses", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(enforceRateLimit).mockResolvedValue(null);
    (getUserAddresses as ReturnType<typeof vi.fn>).mockResolvedValue([]);
  });

  it("returns user addresses", async () => {
    const mockAddresses = [
      { id: "1", label: "Home", street: "123 Main St", city: "Delhi" },
    ];
    (getUserAddresses as ReturnType<typeof vi.fn>).mockResolvedValue(mockAddresses);
    (getSessionUser as ReturnType<typeof vi.fn>).mockResolvedValue({ id: "user1", uid: "uid1" });

    const res = await GET(makeRequest("http://localhost/api/addresses"));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.addresses).toHaveLength(1);
  });

  it("returns 401 when not authenticated", async () => {
    (getSessionUser as ReturnType<typeof vi.fn>).mockResolvedValue(null);

    const res = await GET(makeRequest("http://localhost/api/addresses"));
    expect(res.status).toBe(401);
  });

  it("returns 429 when rate limited", async () => {
    (enforceRateLimit as ReturnType<typeof vi.fn>).mockResolvedValue(
      new Response(JSON.stringify({ error: "Too many requests" }), { status: 429 })
    );
    (getSessionUser as ReturnType<typeof vi.fn>).mockResolvedValue({ id: "user1", uid: "uid1" });

    const res = await GET(makeRequest("http://localhost/api/addresses"));
    expect(res.status).toBe(429);
  });
});

describe("POST /api/addresses", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(enforceRateLimit).mockResolvedValue(null);
    (createUserAddress as ReturnType<typeof vi.fn>).mockResolvedValue({ id: "new-addr" });
    (getSessionUser as ReturnType<typeof vi.fn>).mockResolvedValue({ id: "user1", uid: "uid1" });
  });

  it("creates a new address with valid data", async () => {
    const res = await POST(
      makeRequest("http://localhost/api/addresses", "POST", VALID_ADDRESS)
    );
    const body = await res.json();

    expect(res.status).toBe(201);
    expect(body.address.id).toBe("new-addr");
  });

  it("returns 401 when not authenticated", async () => {
    (getSessionUser as ReturnType<typeof vi.fn>).mockResolvedValue(null);

    const res = await POST(
      makeRequest("http://localhost/api/addresses", "POST", VALID_ADDRESS)
    );
    expect(res.status).toBe(401);
  });

  it("returns 429 when rate limited", async () => {
    (enforceRateLimit as ReturnType<typeof vi.fn>).mockResolvedValue(
      new Response(JSON.stringify({ error: "Too many requests" }), { status: 429 })
    );

    const res = await POST(
      makeRequest("http://localhost/api/addresses", "POST", VALID_ADDRESS)
    );
    expect(res.status).toBe(429);
  });

  it("returns 400 for invalid address data", async () => {
    const res = await POST(
      makeRequest("http://localhost/api/addresses", "POST", {})
    );
    expect(res.status).toBe(400);
  });
});
