import { describe, expect, it } from "vitest";
import { clampPageLimit, pageFromRows } from "@/lib/server/prisma/pagination";

interface Row {
  id: string;
  createdAt: string;
}

function rows(n: number): Row[] {
  return Array.from({ length: n }, (_, i) => ({
    id: `row-${i}`,
    createdAt: new Date(Date.UTC(2026, 0, 1) + i * 1000).toISOString(),
  }));
}

describe("clampPageLimit", () => {
  it("applies fallback and bounds", () => {
    expect(clampPageLimit(undefined)).toBe(20);
    expect(clampPageLimit(NaN)).toBe(20);
    expect(clampPageLimit(0)).toBe(1);
    expect(clampPageLimit(-5)).toBe(1);
    expect(clampPageLimit(5000)).toBe(100);
    expect(clampPageLimit(50)).toBe(50);
  });
});

describe("pageFromRows", () => {
  it("returns a full page with hasMore when an extra row exists", () => {
    const result = pageFromRows(rows(21), 20, (r) => r.createdAt);
    expect(result.items).toHaveLength(20);
    expect(result.hasMore).toBe(true);
    expect(result.nextCursor).toBe(result.items[19]!.createdAt);
  });

  it("returns the tail page without a cursor when no extra row exists", () => {
    const result = pageFromRows(rows(7), 20, (r) => r.createdAt);
    expect(result.items).toHaveLength(7);
    expect(result.hasMore).toBe(false);
    expect(result.nextCursor).toBeUndefined();
  });

  it("handles exactly-limit-sized tables as a final page", () => {
    const result = pageFromRows(rows(20), 20, (r) => r.createdAt);
    expect(result.items).toHaveLength(20);
    expect(result.hasMore).toBe(false);
    expect(result.nextCursor).toBeUndefined();
  });

  it("handles empty tables", () => {
    const result = pageFromRows<Row>([], 20, (r) => r.createdAt);
    expect(result.items).toHaveLength(0);
    expect(result.hasMore).toBe(false);
    expect(result.nextCursor).toBeUndefined();
  });
});
