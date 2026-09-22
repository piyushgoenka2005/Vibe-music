import { describe, expect, it } from "vitest";
import { isPrismaMissingTableError, isPrismaUnavailableError } from "@/lib/db/prisma-errors";

describe("isPrismaUnavailableError", () => {
  it("detects Prisma initialization failures", () => {
    expect(
      isPrismaUnavailableError({
        name: "PrismaClientInitializationError",
        message: "Can't reach database server at `localhost:5433`",
      }),
    ).toBe(true);
  });

  it("ignores unrelated errors", () => {
    expect(isPrismaUnavailableError(new Error("Not found"))).toBe(false);
  });
});

describe("isPrismaMissingTableError", () => {
  it("detects missing catalog taxonomy table", () => {
    expect(
      isPrismaMissingTableError(
        {
          code: "P2021",
          message: "The table `public.catalog_taxonomies` does not exist in the current database.",
        },
        "catalog_taxonomies",
      ),
    ).toBe(true);
  });

  it("ignores unrelated prisma errors", () => {
    expect(isPrismaMissingTableError({ code: "P2002" }, "catalog_taxonomies")).toBe(false);
  });
});
