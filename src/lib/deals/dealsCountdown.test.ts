import { describe, expect, it } from "vitest";
import { getEndOfDayIstIso } from "@/lib/deals/dealsCountdown";

describe("getEndOfDayIstIso", () => {
  it("returns 23:59:59 IST for the current IST calendar day", () => {
    const target = getEndOfDayIstIso(new Date("2026-09-25T10:00:00+05:30"));
    expect(target).toBe("2026-09-25T23:59:59+05:30");
  });
});
