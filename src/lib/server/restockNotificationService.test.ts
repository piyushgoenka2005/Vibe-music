import { describe, expect, it } from "vitest";
import { didBecomeAvailable } from "@/lib/server/restockNotificationService";

describe("didBecomeAvailable", () => {
  it("returns true when available stock crosses from 0 to positive", () => {
    expect(
      didBecomeAvailable({
        previousStock: 0,
        previousReserved: 0,
        newStock: 5,
        newReserved: 0,
      })
    ).toBe(true);
  });

  it("returns true when reserved made stock unavailable then release frees it", () => {
    expect(
      didBecomeAvailable({
        previousStock: 2,
        previousReserved: 2,
        newStock: 2,
        newReserved: 0,
      })
    ).toBe(true);
  });

  it("returns false when already available", () => {
    expect(
      didBecomeAvailable({
        previousStock: 3,
        previousReserved: 0,
        newStock: 10,
        newReserved: 0,
      })
    ).toBe(false);
  });

  it("returns false when still unavailable", () => {
    expect(
      didBecomeAvailable({
        previousStock: 0,
        previousReserved: 0,
        newStock: 0,
        newReserved: 0,
      })
    ).toBe(false);
  });
});
