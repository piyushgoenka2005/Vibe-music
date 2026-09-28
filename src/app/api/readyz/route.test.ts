import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/server/gracefulShutdown", () => ({
  isShuttingDown: vi.fn(() => false),
}));

vi.mock("@/lib/server/postgresHealth", () => ({
  verifyPostgresConnection: vi.fn(async () => ({ ok: true })),
}));

import { isShuttingDown } from "@/lib/server/gracefulShutdown";
import { verifyPostgresConnection } from "@/lib/server/postgresHealth";
import { GET } from "@/app/api/readyz/route";

describe("GET /api/readyz", () => {
  beforeEach(() => {
    vi.mocked(isShuttingDown).mockReturnValue(false);
    vi.mocked(verifyPostgresConnection).mockResolvedValue({ ok: true });
  });

  it("returns 200 when DB is reachable", async () => {
    const response = await GET();
    const body = await response.json();
    expect(response.status).toBe(200);
    expect(body.ready).toBe(true);
  });

  it("returns 503 when draining", async () => {
    vi.mocked(isShuttingDown).mockReturnValue(true);
    const response = await GET();
    expect(response.status).toBe(503);
  });

  it("returns 503 when database is down", async () => {
    vi.mocked(verifyPostgresConnection).mockResolvedValue({ ok: false, error: "down" });
    const response = await GET();
    expect(response.status).toBe(503);
  });
});
