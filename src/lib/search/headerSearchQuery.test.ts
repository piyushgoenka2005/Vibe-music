import { describe, expect, it } from "vitest";
import { resolveHeaderSearchQuery } from "./headerSearchQuery";

describe("resolveHeaderSearchQuery", () => {
  it("returns the query on search results routes", () => {
    expect(resolveHeaderSearchQuery("/search/results", "?q=hetz")).toBe("hetz");
  });

  it("returns the query on the search landing route", () => {
    expect(resolveHeaderSearchQuery("/search", "?q=drums")).toBe("drums");
  });

  it("clears the query on non-search routes", () => {
    expect(resolveHeaderSearchQuery("/", "?q=hetz")).toBe("");
    expect(resolveHeaderSearchQuery("/category/guitars", "?q=hetz")).toBe("");
  });
});
