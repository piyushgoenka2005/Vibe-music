import { describe, expect, it } from "vitest";
import { isPrismaUnavailableError } from "@/lib/db/prisma-errors";

describe("isPrismaUnavailableError", () => {
  it("detects Prisma initialization failures", () => {
    expect(
      isPrismaUnavailableError({
        name: "PrismaClientInitializationError",
        message: "Can't reach database server at `localhost:5433`",
      })
    ).toBe(true);
  });

  it("ignores unrelated errors", () => {
    expect(isPrismaUnavailableError(new Error("Not found"))).toBe(false);
  });
});
