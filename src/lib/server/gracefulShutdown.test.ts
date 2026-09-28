import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/db/prisma", () => ({
  disconnectPrisma: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("@/lib/server/jobQueue", () => ({
  closeJobQueue: vi.fn().mockResolvedValue(undefined),
}));

import { disconnectPrisma } from "@/lib/db/prisma";
import { isShuttingDown, runGracefulShutdown } from "@/lib/server/gracefulShutdown";

describe("gracefulShutdown", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("marks process as shutting down", async () => {
    const exitSpy = vi.spyOn(process, "exit").mockImplementation(() => undefined as never);
    vi.stubEnv("NODE_ENV", "test");

    await runGracefulShutdown("SIGTERM");
    expect(isShuttingDown()).toBe(true);
    expect(disconnectPrisma).toHaveBeenCalled();
    expect(exitSpy).not.toHaveBeenCalled();

    exitSpy.mockRestore();
    vi.unstubAllEnvs();
  });
});
