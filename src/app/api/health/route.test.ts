import { describe, expect, it, vi, beforeEach } from "vitest";

// Mock the dependencies
vi.mock("@/lib/server/integrationConfig", () => ({
  getIntegrationChecks: () => ({ database: "ok", upstash: "ok" }),
}));

vi.mock("@/lib/server/postgresHealth", () => ({
  verifyPostgresConnection: async () => ({ ok: true }),
}));

vi.mock("@/lib/server/logger", () => ({
  logInfo: vi.fn(),
  logWarn: vi.fn(),
}));

describe("GET /api/health", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns healthy status when all checks pass", async () => {
    const { GET } = await import("./route");
    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.status).toBe("healthy");
    expect(body.checks.app).toBe("ok");
    expect(body.checks.database).toBe("ok");
  });

  it("includes timestamp", async () => {
    const { GET } = await import("./route");
    const response = await GET();
    const body = await response.json();

    expect(body.timestamp).toBeDefined();
    expect(new Date(body.timestamp).getTime()).toBeGreaterThan(0);
  });

  it("includes version", async () => {
    const { GET } = await import("./route");
    const response = await GET();
    const body = await response.json();

    expect(body.version).toBeDefined();
  });
});
